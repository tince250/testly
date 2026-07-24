from typing import List
from pydantic import BaseModel
from model.question import QuestionType

class StudentQuestionDTO(BaseModel):
    id: int
    text: str
    type: QuestionType
    choices: List[str]

class StudentTestDTO(BaseModel):
    test_id: int
    title: str
    questions: List[StudentQuestionDTO]

class TestListItemDTO(BaseModel):
    test_id: int
    title: str
    num_questions: int
    taken: bool

class AnswerSubmitDTO(BaseModel):
    question_id: int
    answer: str

class SubmitTestDTO(BaseModel):
    answers: List[AnswerSubmitDTO]

class AttemptResultDTO(BaseModel):
    attempt_id: int
    test_id: int
    submitted: bool
