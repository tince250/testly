from typing import List, Optional
from sqlmodel import SQLModel, Field, Relationship

class CourseMaterialKeywordLink(SQLModel, table=True):
    coursematerial_id: Optional[int] = Field(default=None, foreign_key="coursematerial.id", primary_key=True)
    keyword_id: Optional[int] = Field(default=None, foreign_key="keyword.id", primary_key=True)

class Course(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)

    keyword_hierarchy_id: Optional[int] = Field(default=None, foreign_key="keywordhierarchy.id")
    keyword_hierarchy: Optional["KeywordHierarchy"] = Relationship()
    
    materials: List["CourseMaterial"] = Relationship(back_populates="course")

class CourseMaterial(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    
    course_id: Optional[int] = Field(default=None, foreign_key="course.id")
    course: Optional[Course] = Relationship(back_populates="materials")
    
    keywords: List["Keyword"] = Relationship(back_populates="materials", link_model=CourseMaterialKeywordLink)