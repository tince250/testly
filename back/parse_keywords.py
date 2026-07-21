from model.course import Course
from repositories import CourseRepository, KeywordRepository
from model.keyword import Keyword, KeywordHierarchy
import json
from sqlmodel import SQLModel, create_engine
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from typing import List, Optional
import os
from dotenv import load_dotenv


load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_async_engine(DATABASE_URL, echo=True)

# Async session factory
async_session_maker = sessionmaker(
    bind=engine, expire_on_commit=False, class_=AsyncSession
)

async def parse_keywords(json_string: str, course: Course)  -> List[Keyword]:
    """Parses keywords and their hierarchical relationships."""
    json_start = json_string.find("[")
    json_end = json_string.rfind("]") + 1
    if json_start == -1 or json_end == -1:
        raise ValueError("JSON array not found in the response.")

    json_string = json_string[json_start:json_end]
    data = json.loads(json_string)

    keywords = []

    async with async_session_maker() as session:
        keyword_repo = KeywordRepository(session)
        course_repo = CourseRepository(session)

        course_root_keyword = await keyword_repo.create_keyword(
            name=course.name,
            definition=f"Root for course: {course.name}",
            parent_id=None
        )

        hierarchy = await keyword_repo.create_hierarchy(root_id=course_root_keyword.id)
        keywords.append(course_root_keyword)

        async def process_keyword(item, parent_id=None):
            """Recursively processes a keyword and its children."""
            actual_parent_id = parent_id or course_root_keyword.id
            keyword = await keyword_repo.create_keyword(
                name=item["name"],
                definition=item["definition"],
                parent_id=actual_parent_id
            )

            keywords.append(keyword)

            for child in item.get("children", []):
                await process_keyword(child, parent_id=keyword.id)

        for item in data:
            await process_keyword(item)

        updated_course = await course_repo.update_course(course.id, None, hierarchy.id)
        if not updated_course:
            raise ValueError("Course not found or could not be updated.")

    return keywords