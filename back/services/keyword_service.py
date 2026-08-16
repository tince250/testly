from fastapi import HTTPException
from typing import List, Optional
from dtos.keyword_dtos import KeywordUpdateDTO, KeywordNodeDTO
from repositories import KeywordRepository
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from model.keyword import KeywordHierarchy
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
    
async def get_hierarchy_keywords(hierarchy_id: int) -> List[KeywordNodeDTO]:
    async with async_session_maker() as session:
        repo = KeywordRepository(session)

        hierarchy = await repo.get_hierarchy_by_id(hierarchy_id)
        if not hierarchy:
            raise HTTPException(status_code=404, detail="Hierarchy not found")

        root = await repo.get_keyword_by_id(hierarchy.root_id)
        if not root:
            return []

        descendants = await repo.get_all_descendant_keywords(root.id)

        return [
            KeywordNodeDTO(id=k.id, name=k.name, definition=k.definition, parent_id=k.parent_id)
            for k in [root] + descendants
        ]

async def update_keyword(keyword_id: int, update_data: KeywordUpdateDTO) -> KeywordNodeDTO:
    async with async_session_maker() as session:
        repo = KeywordRepository(session)

        updated_keyword = await repo.update_keyword(
            keyword_id=keyword_id,
            name=update_data.name,
            definition=update_data.definition,
        )

        if not updated_keyword:
            raise HTTPException(status_code=404, detail="Keyword not found")

        return KeywordNodeDTO(
            id=updated_keyword.id,
            name=updated_keyword.name,
            definition=updated_keyword.definition,
            parent_id=updated_keyword.parent_id,
        )