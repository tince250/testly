from typing import List, Optional
from sqlmodel import SQLModel, Field, Relationship, String
from sqlalchemy import ARRAY
from sqlalchemy.sql.schema import Column

class Question(SQLModel):
    text: str
    correct_answer: str

class MultipleChoiceQuestion(Question, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    choices: List[str] = Field(sa_column=Column(ARRAY(String())), default_factory=list)

class DefinitionQuestion(Question, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)