from typing import List, Optional
from sqlmodel import SQLModel, Field, Relationship
from model.course import CourseMaterialKeywordLink
from model.test import KeywordTestLink

class KeywordHierarchy(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    root_id: Optional[int] = Field(default=None, foreign_key="keyword.id")
    root: Optional["Keyword"] = Relationship()

    keywords: List["Keyword"] = Relationship(back_populates="hierarchy")
    course: Optional["Course"] = Relationship(back_populates="keyword_hierarchy")

class Keyword(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    definition: str

    parent_id: Optional[int] = Field(default=None, foreign_key="keyword.id")
    parent: Optional["Keyword"] = Relationship(back_populates="children")
    children: List["Keyword"] = Relationship(back_populates="parent")

    hierarchy: Optional[KeywordHierarchy] = Relationship(back_populates="keywords")
    materials: List["CourseMaterial"] = Relationship(back_populates="keywords", link_model=CourseMaterialKeywordLink)

    tests: List["Test"] = Relationship(link_model=KeywordTestLink)
