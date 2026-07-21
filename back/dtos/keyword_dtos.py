from pydantic import BaseModel
from typing import Optional

class KeywordUpdateDTO(BaseModel):
    name: Optional[str] = None
    definition: Optional[str] = None