import os
from typing import List
from model.course import Course
from model.keyword import Keyword, KeywordHierarchy
from repositories import CourseRepository, KeywordRepository
from parse_keywords import parse_keywords
from dotenv import load_dotenv
from llama_parse import LlamaParse
from llama_index.core import SimpleDirectoryReader, Document, VectorStoreIndex
from fastapi import Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from query_llm import query_llm, extract_keywords_with_attachment

load_dotenv()

API_KEY = os.getenv("LLAMA_CLOUD_API_KEY")

extensions = {
    "text": ".txt",
    "markdown": ".md"
}

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_async_engine(DATABASE_URL, echo=True)

async_session_maker = sessionmaker(
    bind=engine, expire_on_commit=False, class_=AsyncSession
)

async def parse_materials(course_id: int, doc_path: str) -> None:
    async with async_session_maker() as session:
        course_repo = CourseRepository(session)
    
        course = await course_repo.get_course_by_id(course_id)
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        hierarchy = await course_repo.get_hierarchy_for_course(course_id)
        
        new_material = await course_repo.create_course_material(doc_path, course.id)

        keywords = await parse_document(doc_path, course, hierarchy)
        await course_repo.add_keywords_to_material(new_material.id, keywords)

def _format_hierarchy(root: Keyword, descendants: List[Keyword]) -> str:
    """Renders the existing keyword tree as an indented outline for the extraction prompt."""
    children_by_parent = {}
    for node in [root] + descendants:
        if node.parent_id is not None:
            children_by_parent.setdefault(node.parent_id, []).append(node)

    lines = []

    def visit(node: Keyword, depth: int) -> None:
        children = children_by_parent.get(node.id, [])
        children_note = f"children: {', '.join(str(child.id) for child in children)}" if children else "children: none"
        lines.append(f"{'  ' * depth}{node.id}: {node.name} — {node.definition} ({children_note})")
        for child in children:
            visit(child, depth + 1)

    visit(root, 0)
    return "\n".join(lines)

async def parse_document(doc_path: str, course: Course, hierarchy: KeywordHierarchy, result_type: str = "text") -> List[Keyword]:
    """Parses a document and processes keywords and their hierarchy."""
    parser = LlamaParse(
        api_key=API_KEY,
        language="en",
        parsing_instruction="You are parsing educational materials.",
        result_type=result_type  # "markdown"/"text"
    )

    # SimpleDirectoryReader keys file_extractor by file extension, not a "default" catch-all —
    # without this, LlamaParse is silently skipped and the raw file bytes are read as text.
    file_extractor = {
        ".pdf": parser,
        ".docx": parser,
        ".txt": parser,
        ".md": parser,
    }

    documents = SimpleDirectoryReader(input_files=[doc_path], file_extractor=file_extractor).load_data()

    combined_markdown = "\n\n".join([doc.text for doc in documents if isinstance(doc, Document)])

    if hierarchy:
        async with async_session_maker() as session:
            keyword_repo = KeywordRepository(session)
            root = await keyword_repo.get_keyword_by_id(hierarchy.root_id)
            descendants = await keyword_repo.get_all_descendant_keywords(hierarchy.root_id)
        hierarchy_outline = _format_hierarchy(root, descendants)
        res = extract_keywords_with_attachment(combined_markdown, course.name, hierarchy_outline)
    else:
        res = query_llm(combined_markdown, course=course.name)

    return await parse_keywords(res, course, existing_hierarchy=hierarchy)
