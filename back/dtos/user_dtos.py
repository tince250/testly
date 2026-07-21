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
