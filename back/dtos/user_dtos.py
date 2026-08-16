from typing import List
from pydantic import BaseModel

class UserRegistration(BaseModel):
    email: str
    password: str
    name: str
    lastname: str
    role: str  
    
class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class StudentCreateDTO(BaseModel):
    name: str
    lastname: str
    email: str
    password: str
    course_ids: List[int] = []

class StudentSummaryDTO(BaseModel):
    id: int
    name: str
    lastname: str
    email: str
    courses: List[str]

class StudentRegisterResultDTO(StudentSummaryDTO):
    created: bool
    newly_enrolled: List[str] = []
    already_enrolled: List[str] = []
