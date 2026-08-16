from model.course import Course
from repositories import CourseRepository, KeywordRepository
from model.keyword import Keyword, KeywordHierarchy
import json
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from typing import List, Optional, Union
import os
from dotenv import load_dotenv


load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_async_engine(DATABASE_URL, echo=True)

# Async session factory
async_session_maker = sessionmaker(
    bind=engine, expire_on_commit=False, class_=AsyncSession
)

def _normalize(name: str) -> str:
    normalized = name.strip().casefold()
    # Treat a simple trailing "s" as a plural of the same concept. 
    if normalized.endswith("s") and not normalized.endswith("ss"):
        normalized = normalized[:-1]
    return normalized

def _parse_legacy_array(json_string: str) -> list:
    """Parses the bare-array response shape used when there's no existing hierarchy to attach to."""
    json_start = json_string.find("[")
    json_end = json_string.rfind("]")
    if json_start == -1 or json_end == -1 or json_end < json_start:
        raise ValueError("JSON array not found in the response.")
    return json.loads(json_string[json_start:json_end + 1])

async def parse_keywords(response: Union[str, dict], course: Course, existing_hierarchy: Optional[KeywordHierarchy] = None) -> List[Keyword]:
    """Parses extracted keywords and grafts them onto the course's keyword hierarchy.

    If the course has no hierarchy yet, `response` is the bare extraction array (legacy shape) and a
    new root/hierarchy is created. If a hierarchy already exists, `response` is the richer
    {"attach_to", "insert_intermediate", "keywords"} shape: new keywords attach under the LLM's chosen
    existing node (optionally behind one new intermediate node) instead of always landing under root,
    and any extracted keyword that duplicates one already in the tree (by normalized name) is reused
    instead of creating a second copy.
    """
    if isinstance(response, str):
        data = _parse_legacy_array(response)
        attach_to_id = None
        insert_intermediate = None
    else:
        data = response.get("keywords", [])
        attach_to_id = response.get("attach_to")
        insert_intermediate = response.get("insert_intermediate")

    keywords = []

    async with async_session_maker() as session:
        keyword_repo = KeywordRepository(session)
        course_repo = CourseRepository(session)

        if not existing_hierarchy:
            course_root_keyword = await keyword_repo.create_keyword(
                name=course.name,
                definition=f"Root for course: {course.name}",
                parent_id=None
            )
            hierarchy = await keyword_repo.create_hierarchy(root_id=course_root_keyword.id)
            keywords.append(course_root_keyword)
            root_id = course_root_keyword.id
            existing_by_name = {}
        else:
            root_id = existing_hierarchy.root_id
            root = await keyword_repo.get_keyword_by_id(root_id)
            descendants = await keyword_repo.get_all_descendant_keywords(root_id)
            all_existing = [root] + descendants
            existing_ids = {node.id for node in all_existing}
            existing_by_name = {_normalize(node.name): node for node in all_existing}

            # Only trust an attach point that's actually part of this course's hierarchy.
            parent_id = attach_to_id if attach_to_id in existing_ids else root_id

            if insert_intermediate and attach_to_id in existing_ids:
                new_node = await keyword_repo.create_keyword(
                    name=insert_intermediate["name"],
                    definition=insert_intermediate["definition"],
                    parent_id=attach_to_id,
                )
                current_children_ids = {node.id for node in all_existing if node.parent_id == attach_to_id}
                requested_ids = set(insert_intermediate.get("reparent_existing_children", []) or [])
                for child_id in current_children_ids & requested_ids:
                    await keyword_repo.reparent_keyword(child_id, new_node.id)
                parent_id = new_node.id

            root_id = parent_id

        async def process_keyword(item, parent_id=None):
            """Recursively processes a keyword, reusing an existing node of the same name if one exists."""
            actual_parent_id = parent_id or root_id
            name_key = _normalize(item["name"])
            existing = existing_by_name.get(name_key)

            if existing:
                keyword = existing
                keywords.append(keyword)
            else:
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

        if not existing_hierarchy:
            updated_course = await course_repo.update_course(course.id, None, hierarchy.id)
            if not updated_course:
                raise ValueError("Course not found or could not be updated.")

    return keywords
