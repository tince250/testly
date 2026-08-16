from typing import List, Optional
from pydantic import BaseModel
from model.question import QuestionType

class QuestionStatDTO(BaseModel):
    question_id: int
    text: str
    type: QuestionType
    answered_count: int              # graded answers (is_correct not None)
    correct_count: int
    correct_rate: Optional[float]    # % correct among graded answers; None if none graded

class ScoreBucketDTO(BaseModel):
    label: str                       # "0–50%", "50–70%", "70–100%"
    count: int

class TestStatsDTO(BaseModel):
    test_id: int
    title: str
    enrolled_count: int
    attempt_count: int               # attempts taken
    graded_count: int
    participation_rate: Optional[float]   # attempts / enrolled %
    average_score: Optional[float]
    median_score: Optional[float]
    min_score: Optional[float]
    max_score: Optional[float]
    distribution: List[ScoreBucketDTO]
    questions: List[QuestionStatDTO]
