from typing import List, Optional
from pydantic import BaseModel
from model.question import QuestionType
from model.attempt import AttemptStatus

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
    attempt_id: Optional[int] = None
    status: Optional[AttemptStatus] = None
    score: Optional[float] = None

class AnswerSubmitDTO(BaseModel):
    question_id: int
    answer: str

class SubmitTestDTO(BaseModel):
    answers: List[AnswerSubmitDTO]

class AttemptResultDTO(BaseModel):
    attempt_id: int
    test_id: int
    submitted: bool

class QuestionResultDTO(BaseModel):
    question_id: int
    answer_id: Optional[int] = None   # None for skipped questions
    text: str
    type: QuestionType
    student_answer: Optional[str]
    correct_answer: str
    is_correct: Optional[bool]
    feedback: Optional[str]

class AttemptDetailDTO(BaseModel):
    attempt_id: int
    test_id: int
    status: AttemptStatus
    score: Optional[float]
    correct_count: Optional[int]
    total_questions: int
    results: List[QuestionResultDTO]

class AttemptListItemDTO(BaseModel):
    attempt_id: int
    student_email: str
    status: AttemptStatus
    score: Optional[float]

class TestAttemptsDTO(BaseModel):
    enrolled_count: int
    attempts: List[AttemptListItemDTO]

class GradeOverrideDTO(BaseModel):
    is_correct: bool
    feedback: Optional[str] = None
