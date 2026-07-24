from typing import List, Optional
from sqlmodel import SQLModel, Field, Relationship

class TestAttempt(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    test_id: Optional[int] = Field(default=None, foreign_key="test.id")
    student_id: Optional[int] = Field(default=None, foreign_key="user.id")

    answers: List["Answer"] = Relationship(back_populates="attempt")

class Answer(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    attempt_id: Optional[int] = Field(default=None, foreign_key="testattempt.id")
    question_id: Optional[int] = Field(default=None, foreign_key="question.id")
    answer: str

    attempt: Optional[TestAttempt] = Relationship(back_populates="answers")
