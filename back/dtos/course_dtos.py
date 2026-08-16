from typing import Optional
from pydantic import BaseModel

class CourseSummaryDTO(BaseModel):
    id: int
    name: str
    keyword_hierarchy_id: Optional[int] = None
    student_count: int = 0
