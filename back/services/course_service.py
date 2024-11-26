from http.client import HTTPException
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from repositories import CourseRepository, UserRepository
from model.course import Course, CourseMaterial
from model.user import User, UserCourseLink
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_async_engine(DATABASE_URL, echo=True)

async_session_maker = sessionmaker(
    bind=engine, expire_on_commit=False, class_=AsyncSession
)

async def create_course(name: str, email: str) -> Course:
    async with async_session_maker() as session:
        repo = UserRepository(session)
        existing_user = await repo.get_user_by_email(email)
        course_repo = CourseRepository(session)
        course = await course_repo.create_course(name)
        user_repo = UserRepository(session)
        await user_repo.add_course_to_user(existing_user.id, course.id)
        return course

async def get_course(course_id: int) -> Course:
    async with async_session_maker() as session:
        course_repo = CourseRepository(session)
        course = await course_repo.get_course_by_id(course_id)
        return course

async def get_all_courses() -> List[Course]:
    async with async_session_maker() as session:
        course_repo = CourseRepository(session)
        return await course_repo.get_all_courses()

async def get_all_materials_for_course(course_id: int) -> List[CourseMaterial]:
    async with async_session_maker() as session:
        course_repo = CourseRepository(session)
        materials = await course_repo.get_all_materials_for_course(course_id)
        if not materials:
            raise HTTPException(status_code=404, detail="Materials not found")
        return materials

async def signup_to_course(email: str, course_id: int):
    async with async_session_maker() as session:
        repo = UserRepository(session)
        existing_user = await repo.get_user_by_email(email)
        await repo.add_course_to_user(existing_user.id, course_id)

async def remove_from_course(email: str, course_id: int):
    async with async_session_maker() as session:
        repo = UserRepository(session)
        existing_user = await repo.get_user_by_email(email)
        await repo.remove_course_from_user(existing_user.id, course_id)

async def get_material(material_id: int) -> CourseMaterial:
    async with async_session_maker() as session:
        course_repo = CourseRepository(session)
        material = await course_repo.get_course_material_by_id(material_id)
        return material
