from typing import List, Optional
from sqlmodel import SQLModel, Field, Relationship


class CourseMaterial(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    course_id: Optional[int] = Field(default=None, foreign_key="course.id")

    keywords: Optional["Keyword"] = Relationship()
