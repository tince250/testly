import os
from typing import List
from model.course import Course
from model.keyword import Keyword, KeywordHierarchy
from repositories import CourseRepository
from parse_keywords import parse_keywords
from dotenv import load_dotenv
from llama_parse import LlamaParse
from llama_index.core import SimpleDirectoryReader, Document, VectorStoreIndex
from fastapi import Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from query_llm import query_llm

load_dotenv()

API_KEY = os.getenv("LLAMA_CLOUD_API_KEY")

extensions = {
    "text": ".txt",
    "markdown": ".md"
}

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_async_engine(DATABASE_URL, echo=True)

# Async session factory
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

async def parse_document(doc_path: str, course: Course, hierarhy: KeywordHierarchy, result_type: str = "text") -> List[Keyword]:
    """Parses a document and processes keywords and their hierarchy."""
    parser = LlamaParse(
        language="en",
        parsing_instruction="You are parsing educational materials.",
        result_type=result_type  # "markdown"/"text"
    )

    file_extractor = {
        "default": parser
    }

    documents = SimpleDirectoryReader(input_files=[doc_path], file_extractor=file_extractor).load_data()

    combined_markdown = "\n\n".join([doc.text for doc in documents if isinstance(doc, Document)])

    res = query_llm(combined_markdown)
    #print(res)
    return await parse_keywords(res, course)
