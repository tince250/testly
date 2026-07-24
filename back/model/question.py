from enum import Enum
from typing import List, Optional
from sqlmodel import SQLModel, Field, Relationship, String
from sqlalchemy import ARRAY
from sqlalchemy.sql.schema import Column

class QuestionType(str, Enum):
    MATCHING = "MATCHING"
    OPEN = "OPEN"

class Question(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    text: str
    type: QuestionType
    correct_answer: str
    test_id: Optional[int] = Field(default=None, foreign_key="test.id")
    choices: List[str] = Field(sa_column=Column(ARRAY(String())), default_factory=list)

    test: Optional["Test"] = Relationship(back_populates="questions")