from typing import List, Optional
from pydantic import BaseModel, Field
from model.question import QuestionType

class TestCreateDTO(BaseModel):
    title: str
    num_matching_questions: int = 5
    num_open_questions: int = 5
    num_matching_options: int = Field(default=4, ge=2)

class QuestionResponseDTO(BaseModel):
    id: int
    text: str
    type: QuestionType
    choices: List[str]
    correct_answer: str

class TestResponseDTO(BaseModel):
    id: int
    title: str
    course_id: Optional[int]
    questions: List[QuestionResponseDTO]
