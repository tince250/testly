from fastapi import HTTPException
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from repositories import CourseRepository, KeywordRepository, TestRepository, UserRepository
from dtos.course_dtos import CourseSummaryDTO
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

def _to_course_summary(course: Course, student_count: int) -> CourseSummaryDTO:
    return CourseSummaryDTO(
        id=course.id,
        name=course.name,
        keyword_hierarchy_id=course.keyword_hierarchy_id,
        student_count=student_count,
    )

async def get_course(course_id: int) -> Optional[CourseSummaryDTO]:
    async with async_session_maker() as session:
        course_repo = CourseRepository(session)
        user_repo = UserRepository(session)
        course = await course_repo.get_course_by_id(course_id)
        if not course:
            return None
        students = await user_repo.get_students_in_courses([course.id])
        return _to_course_summary(course, len(students))

async def get_courses_for_user(email: str) -> List[CourseSummaryDTO]:
    async with async_session_maker() as session:
        user_repo = UserRepository(session)
        user = await user_repo.get_user_by_email(email)
        courses = await user_repo.get_all_courses_user_takes(user.id)
        summaries = []
        for course in courses:
            students = await user_repo.get_students_in_courses([course.id])
            summaries.append(_to_course_summary(course, len(students)))
        return summaries

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

async def delete_course_from_db(course_id: int) -> bool:
    async with async_session_maker() as session:
        course_repo = CourseRepository(session)
        test_repo = TestRepository(session)
        keyword_repo = KeywordRepository(session)

        course = await course_repo.get_course_by_id(course_id)
        if not course:
            return False

        # Tests first — reuses the tested delete_test cascade (questions, links, attempts, answers).
        for test in await course_repo.get_all_tests_for_course(course_id):
            await test_repo.delete_test(test.id)

        # Collect every keyword in the hierarchy (root + descendants via the parent tree).
        hierarchy_id = course.keyword_hierarchy_id
        keyword_ids: List[int] = []
        if hierarchy_id:
            hierarchy = await keyword_repo.get_hierarchy_by_id(hierarchy_id)
            if hierarchy and hierarchy.root_id:
                descendants = await keyword_repo.get_all_descendant_keywords(hierarchy.root_id)
                keyword_ids = [hierarchy.root_id] + [k.id for k in descendants]

        return await course_repo.delete_course(course_id, hierarchy_id, keyword_ids)