import os
from typing import List, Set
from dotenv import load_dotenv
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from dtos.user_dtos import StudentCreateDTO, StudentRegisterResultDTO, StudentSummaryDTO
from model.user import UserRole, User
from repositories import UserRepository

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_async_engine(DATABASE_URL, echo=True)

async_session_maker = sessionmaker(
    bind=engine, expire_on_commit=False, class_=AsyncSession
)

async def _student_summary(user_repo: UserRepository, student: User, owned_ids: Set[int]) -> StudentSummaryDTO:
    student_courses = await user_repo.get_all_courses_user_takes(student.id)
    course_names = [course.name for course in student_courses if course.id in owned_ids]
    return StudentSummaryDTO(
        id=student.id,
        name=student.name,
        lastname=student.lastname,
        email=student.email,
        courses=course_names,
    )

async def create_student(professor_email: str, data: StudentCreateDTO) -> StudentRegisterResultDTO:
    async with async_session_maker() as session:
        user_repo = UserRepository(session)

        professor = await user_repo.get_user_by_email(professor_email)
        owned_courses = await user_repo.get_all_courses_user_takes(professor.id)
        owned_ids = {course.id for course in owned_courses}
        courses_by_id = {course.id: course.name for course in owned_courses}

        invalid = [course_id for course_id in data.course_ids if course_id not in owned_ids]
        if invalid:
            raise HTTPException(status_code=403, detail=f"Not your courses: {invalid}")

        student = await user_repo.get_user_by_email(data.email)
        if student and student.role != UserRole.STUDENT:
            raise HTTPException(status_code=400, detail="Email already in use")
        created = False
        if not student:
            student = await user_repo.create_user(
                email=data.email, password=data.password, name=data.name, lastname=data.lastname, role=UserRole.STUDENT
            )
            created = True

        newly_enrolled = []
        already_enrolled = []
        for course_id in data.course_ids:
            name = courses_by_id.get(course_id, str(course_id))
            if await user_repo.is_enrolled(student.id, course_id):
                already_enrolled.append(name)
            else:
                await user_repo.add_course_to_user(student.id, course_id)
                newly_enrolled.append(name)

        summary = await _student_summary(user_repo, student, owned_ids)
        return StudentRegisterResultDTO(
            **summary.dict(),
            created=created,
            newly_enrolled=newly_enrolled,
            already_enrolled=already_enrolled,
        )

async def list_students(professor_email: str) -> List[StudentSummaryDTO]:
    async with async_session_maker() as session:
        user_repo = UserRepository(session)

        professor = await user_repo.get_user_by_email(professor_email)
        owned_ids = {course.id for course in await user_repo.get_all_courses_user_takes(professor.id)}

        students = await user_repo.get_students_in_courses(list(owned_ids))
        return [await _student_summary(user_repo, student, owned_ids) for student in students]
