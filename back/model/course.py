from typing import List, Optional
from sqlmodel import SQLModel, Field, Relationship


class Course(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    keyword_hierarchy_id: Optional[int] = Field(default=None, foreign_key="keywordhierarchy.id")
    
    course_materials: List["CourseMaterial"] = Relationship()