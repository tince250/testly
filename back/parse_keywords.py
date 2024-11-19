from repositories import KeywordRepository
from model.keyword import Keyword, KeywordHierarchy
import json
from sqlmodel import SQLModel, create_engine
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from typing import Optional
import os
from dotenv import load_dotenv


load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_async_engine(DATABASE_URL, echo=True)

# Async session factory
async_session_maker = sessionmaker(
    bind=engine, expire_on_commit=False, class_=AsyncSession
)

async def parse_keywords(json_string: str) -> None:
    """Parses keywords and their hierarchical relationships."""
    json_start = json_string.find("[")
    json_end = json_string.rfind("]") + 1
    if json_start == -1 or json_end == -1:
        raise ValueError("JSON array not found in the response.")

    json_string = json_string[json_start:json_end]
    data = json.loads(json_string)

    keywords = {}

    async def process_keyword(item, parent_id=None):
        """Recursively processes a keyword and its children."""
        async with async_session_maker() as session:
            repository = KeywordRepository(session)
            keyword = await repository.create_keyword(
                name=item["name"],
                definition=item["definition"],
                parent_id=parent_id
            )
            keywords[item["name"]] = keyword

        for child in item.get("children", []):
            await process_keyword(child, keyword.id)

    for item in data:
        await process_keyword(item)

    print("Keywords:")
    for keyword in keywords.values():
        print(keyword)