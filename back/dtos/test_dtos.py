from typing import List, Optional
from pydantic import BaseModel, Field
from model.question import QuestionType
from dtos.keyword_dtos import KeywordNodeDTO

class TestCreateDTO(BaseModel):
    title: str
    num_matching_questions: int = 5
    num_open_questions: int = 5
    num_matching_options: int = Field(default=4, ge=2)
    root_keyword_id: Optional[int] = None   # scope the test to this keyword's subtree; None = whole hierarchy

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

class ProfessorTestListItemDTO(BaseModel):
    test_id: int
    title: str
    num_questions: int
    attempt_count: int = 0

class ProfessorTestDetailDTO(BaseModel):
    test_id: int
    title: str
    course_id: Optional[int]
    attempt_count: int = 0
    keywords: List[KeywordNodeDTO]
    questions: List[QuestionResponseDTO]
