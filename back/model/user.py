from sqlmodel import SQLModel, Field, Relationship
from typing import List, Optional
from enum import Enum

class UserRole(str, Enum):
    STUDENT = "STUDENT"
    PROFESSOR = "PROFESSOR"

class UserCourseLink(SQLModel, table=True):
    user_id: Optional[int] = Field(default=None, foreign_key="user.id", primary_key=True)
    course_id: Optional[int] = Field(default=None, foreign_key="course.id", primary_key=True)


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True)
    password: str
    name: str
    lastname: str
    role: UserRole
    
    courses: List["Course"] = Relationship(link_model=UserCourseLink)