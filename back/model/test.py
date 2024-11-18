from typing import List, Optional
from sqlmodel import SQLModel, Field, Relationship

from model.question import Question
from model.user import User

class UserTestLink(SQLModel, table=True):
    user_id: Optional[int] = Field(default=None, foreign_key="user.id", primary_key=True)
    test_id: Optional[int] = Field(default=None, foreign_key="test.id", primary_key=True)

class KeywordTestLink(SQLModel, table=True):
    keyword_id: Optional[int] = Field(default=None, foreign_key="keyword.id", primary_key=True)
    test_id: Optional[int] = Field(default=None, foreign_key="test.id", primary_key=True)

class Test(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    creator_id: Optional[int] = Field(default=None, foreign_key="user.id")
    course_id: Optional[int] = Field(default=None, foreign_key="course.id")

    takers: List["User"] = Relationship(link_model=UserTestLink)
    questions: List["Question"] = Relationship(back_populates="test")
    keywords: List["Keyword"] = Relationship(link_model=KeywordTestLink)