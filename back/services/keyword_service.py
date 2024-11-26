from http.client import HTTPException
from typing import List, Optional
from dtos.keyword_dtos import KeywordUpdateDTO
from repositories import KeywordRepository
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from model.keyword import Keyword, KeywordHierarchy
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_async_engine(DATABASE_URL, echo=True)

async_session_maker = sessionmaker(
    bind=engine, expire_on_commit=False, class_=AsyncSession
)
   
async def get_hierarchy(hierarchy_id: int) -> KeywordHierarchy:
    async with async_session_maker() as session:
        repo = KeywordRepository(session)
        material = await repo.get_hierarchy_by_id(hierarchy_id)
        return material
    
async def get_hierarchy_keywords(hierarchy_id: int) -> List[Keyword]:
    async with async_session_maker() as session:
        repo = KeywordRepository(session)
        root = await repo.get_root_by_hierarchy_id(hierarchy_id)
        if not root:
            return []

        # LAZY LOADING FIX
        #async def collect_keywords(keyword: Keyword, keywords: List[Keyword]):
        #    keywords.append(keyword)
        #    for child in keyword.children:
        #        await collect_keywords(child, keywords)

        all_keywords = []
        #await collect_keywords(root, all_keywords)

        return all_keywords

async def update_keyword(keyword_id: int, update_data: KeywordUpdateDTO) -> Optional[Keyword]:
    async with async_session_maker() as session:
        repo = KeywordRepository(session)

        updated_keyword = await repo.update_keyword(
            keyword_id=keyword_id,
            name=update_data.name,
            definition=update_data.definition,
        )

        if not updated_keyword:
            raise HTTPException(status_code=404, detail="Keyword not found")

        return updated_keyword