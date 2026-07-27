import os
import shutil
from dtos.keyword_dtos import KeywordUpdateDTO
from services.keyword_service import get_hierarchy, get_hierarchy_keywords, update_keyword
from services.course_service import create_course, get_all_courses, get_all_materials_for_course, get_course, get_material, remove_from_course, signup_to_course, delete_course_from_db
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List
from dtos.user_dtos import Token, UserLogin, UserRegistration
from services.user_service import create_user, login
from dtos.test_dtos import TestCreateDTO, TestResponseDTO
from services.test_service import create_test
from dtos.attempt_dtos import AttemptDetailDTO, AttemptListItemDTO, AttemptResultDTO, GradeOverrideDTO, StudentTestDTO, SubmitTestDTO, TestListItemDTO
from services.take_test_service import get_course_tests_for_student, get_test_for_student, submit_test
from services.grading_service import get_attempt_result, get_test_attempts, grade_attempt, override_grade
from fastapi import FastAPI, Depends, HTTPException, UploadFile, BackgroundTasks
from pydantic import BaseModel
from model.database import engine
from sqlmodel import SQLModel
from model.question import Question
from model.keyword import Keyword, KeywordHierarchy
from model.course import Course, CourseMaterial
from model.user import UserCourseLink, User
from model.test import UserTestLink, Test
from model.attempt import TestAttempt, Answer
from parse_materials import parse_document, parse_materials 
from repositories import KeywordRepository
from jwt_token import verify_jwt_token, create_jwt_token
from seed import seed_if_empty

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

active_tokens: Dict[str, str] = {}

UPLOAD_DIR = "data/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

async def get_current_user(token: str) -> dict:
    payload = verify_jwt_token(token)
    if not payload or payload.get("sub") not in active_tokens or active_tokens[payload["sub"]] != token:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload

@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    await seed_if_empty()

@app.get("/")
async def read_root():
    return {"message": "Hello, World!"}

class Item(BaseModel):
    name: str
    description: str | None = None
    price: float
    tax: float | None = None

@app.post("/items/")
async def create_item(item: Item):
    item_dict = item.dict()
    item_dict["total_price"] = item.price + (item.tax or 0)
    return item_dict

@app.post("/register", response_model=Token)
async def register_user(user: UserRegistration):
    new_user = await create_user(user)

    if not new_user:
        raise HTTPException(status_code=400, detail="Invalid email or email in use")

    token_data = {"sub": new_user.email, "role": new_user.role}
    access_token = create_jwt_token(token_data)
    active_tokens[new_user.email] = access_token

    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/login", response_model=Token)
async def login_user(user: UserLogin):
    db_user = await login(user)
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid email")
    token_data = {"sub": db_user.email, "role": db_user.role}
    access_token = create_jwt_token(token_data)
    active_tokens[db_user.email] = access_token

    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/logout")
async def logout_user(token: str):
    payload = verify_jwt_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    email = payload["sub"]
    active_tokens.pop(email, None) 
    return {"detail": "Logged out successfully"}

@app.post("/courses/{course_id}/upload-material")
async def upload_material(course_id: int, file: UploadFile, token: str):
    current_user = await get_current_user(token)
    if current_user.get("role") != "PROFESSOR":
        raise HTTPException(status_code=403, detail="Access forbidden: Professors only")
    
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    await parse_materials(course_id, file_path)

@app.post("/courses", response_model=Course)
async def create_course_endpoint(name: str, token: str):
    current_user = await get_current_user(token)
    if current_user.get("role") != "PROFESSOR":
        raise HTTPException(status_code=403, detail="Access forbidden: Professors only")
    course = create_course(name, current_user.get("sub"))
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    return course

@app.delete("/courses/{course_id}")
async def delete_course(course_id: int, token: str):
    current_user = await get_current_user(token)
    if current_user.get("role") != "PROFESSOR":
        raise HTTPException(status_code=403, detail="Access forbidden: Professors only")
    
    deleted = await delete_course_from_db(course_id) 
    if not deleted:
        raise HTTPException(status_code=404, detail="Course not found")
    
    return {"detail": "Course deleted successfully"}

@app.get("/courses/{course_id}", response_model=Course)
async def get_course_endpoint(course_id: int, token: str):
    current_user = await get_current_user(token)
    if not current_user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return await get_course(course_id)

@app.get("/courses", response_model=List[Course])
async def get_all_courses_endpoint(token: str):
    current_user = await get_current_user(token)
    if not current_user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return await get_all_courses()

@app.get("/courses/{course_id}/materials", response_model=List[CourseMaterial])
async def get_all_materials_for_course_endpoint(course_id: int, token: str):
    current_user = await get_current_user(token)
    if not current_user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return await get_all_materials_for_course(course_id)

@app.post("/courses/{course_id}/signup")
async def get_all_materials_for_course_endpoint(course_id: int, token: str):
    current_user = await get_current_user(token)
    if current_user.get("role") != "STUDENT":
        raise HTTPException(status_code=403, detail="Access forbidden: Student only")
    await signup_to_course(current_user.get("sub"), course_id)

@app.post("/courses/{course_id}/remove")
async def get_all_materials_for_course_endpoint(course_id: int, token: str):
    current_user = await get_current_user(token)
    if current_user.get("role") != "STUDENT":
        raise HTTPException(status_code=403, detail="Access forbidden: Student only")
    await remove_from_course(current_user.get("sub"), course_id)

@app.get("/materials/{material_id}", response_model=CourseMaterial)
async def get_material_endpoint(material_id: int, token: str):
    current_user = await get_current_user(token)
    if not current_user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return await get_material(material_id)

@app.get("/hierarchy/{hierarchy_id}", response_model=KeywordHierarchy)
async def get_hierarchy_endpoint(hierarchy_id: int, token: str):
    current_user = await get_current_user(token)
    if not current_user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return await get_hierarchy(hierarchy_id)

@app.put("/keywords/{keyword_id}")
async def get_keyword_endpoint(keyword_id: int, update_data: KeywordUpdateDTO, token: str):
    current_user = await get_current_user(token)
    if current_user.get("role") != "PROFESSOR":
        raise HTTPException(status_code=403, detail="Access forbidden: Professors only")
    await update_keyword(keyword_id, update_data)


@app.get("/hierarchy/{hierarchy_id}/keywords", response_model=List[Keyword])
async def get_hierarchy_keywords_endpoint(hierarchy_id: int, token: str):
    current_user = await get_current_user(token)
    if not current_user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return await get_hierarchy_keywords(hierarchy_id)

@app.post("/courses/{course_id}/tests", response_model=TestResponseDTO)
async def create_test_endpoint(course_id: int, test_data: TestCreateDTO, token: str):
    current_user = await get_current_user(token)
    if current_user.get("role") != "PROFESSOR":
        raise HTTPException(status_code=403, detail="Access forbidden: Professors only")
    return await create_test(course_id, current_user.get("sub"), test_data)

@app.get("/courses/{course_id}/tests", response_model=List[TestListItemDTO])
async def get_course_tests_endpoint(course_id: int, token: str):
    current_user = await get_current_user(token)
    if current_user.get("role") != "STUDENT":
        raise HTTPException(status_code=403, detail="Access forbidden: Students only")
    return await get_course_tests_for_student(course_id, current_user.get("sub"))

@app.get("/tests/{test_id}", response_model=StudentTestDTO)
async def get_test_endpoint(test_id: int, token: str):
    current_user = await get_current_user(token)
    if current_user.get("role") != "STUDENT":
        raise HTTPException(status_code=403, detail="Access forbidden: Students only")
    return await get_test_for_student(test_id, current_user.get("sub"))

@app.post("/tests/{test_id}/submit", response_model=AttemptResultDTO)
async def submit_test_endpoint(test_id: int, submission: SubmitTestDTO, token: str, background_tasks: BackgroundTasks):
    current_user = await get_current_user(token)
    if current_user.get("role") != "STUDENT":
        raise HTTPException(status_code=403, detail="Access forbidden: Students only")
    result = await submit_test(test_id, current_user.get("sub"), submission)
    background_tasks.add_task(grade_attempt, result.attempt_id)
    return result

@app.get("/tests/{test_id}/attempts", response_model=List[AttemptListItemDTO])
async def get_test_attempts_endpoint(test_id: int, token: str):
    current_user = await get_current_user(token)
    if current_user.get("role") != "PROFESSOR":
        raise HTTPException(status_code=403, detail="Access forbidden: Professors only")
    return await get_test_attempts(test_id, current_user.get("sub"))

@app.get("/attempts/{attempt_id}/result", response_model=AttemptDetailDTO)
async def get_attempt_result_endpoint(attempt_id: int, token: str):
    current_user = await get_current_user(token)
    return await get_attempt_result(attempt_id, current_user.get("sub"))

@app.patch("/attempts/{attempt_id}/answers/{answer_id}/grade", response_model=AttemptDetailDTO)
async def override_grade_endpoint(attempt_id: int, answer_id: int, data: GradeOverrideDTO, token: str):
    current_user = await get_current_user(token)
    if current_user.get("role") != "PROFESSOR":
        raise HTTPException(status_code=403, detail="Access forbidden: Professors only")
    return await override_grade(answer_id, current_user.get("sub"), data)
