from pydantic import BaseModel
from typing import Optional

class KeywordUpdateDTO(BaseModel):
    name: Optional[str] = None
    definition: Optional[str] = None

class KeywordNodeDTO(BaseModel):
    id: int
    name: str
    definition: str
    parent_id: Optional[int] = None