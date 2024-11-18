from typing import List, Optional
from sqlmodel import SQLModel, Field, Relationship

class KeywordHierarchy(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    root_id: Optional[int] = Field(default=None, foreign_key="keyword.id")

    keywords: list["Keyword"] = Relationship(back_populates="hierarchy")

class Keyword(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    definition: str
    parent_id: Optional[int] = Field(default=None, foreign_key="keyword.id")
    
    children: list["Keyword"] = Relationship()