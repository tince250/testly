import os
from typing import List
from dotenv import load_dotenv
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from dtos.attempt_dtos import (
    AttemptResultDTO,
    StudentQuestionDTO,
    StudentTestDTO,
    SubmitTestDTO,
    TestListItemDTO,
)
from repositories import AttemptRepository, CourseRepository, QuestionRepository, TestRepository, UserRepository

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_async_engine(DATABASE_URL, echo=True)

async_session_maker = sessionmaker(
    bind=engine, expire_on_commit=False, class_=AsyncSession
)

async def get_course_tests_for_student(course_id: int, student_email: str) -> List[TestListItemDTO]:
    async with async_session_maker() as session:
        user_repo = UserRepository(session)
        course_repo = CourseRepository(session)
        question_repo = QuestionRepository(session)
        attempt_repo = AttemptRepository(session)

        student = await user_repo.get_user_by_email(student_email)
        if not await user_repo.is_enrolled(student.id, course_id):
            raise HTTPException(status_code=403, detail="Not enrolled in this course")

        tests = await course_repo.get_all_tests_for_course(course_id)
        taken_test_ids = set(await attempt_repo.get_test_ids_taken_by_student(student.id))

        items = []
        for test in tests:
            questions = await question_repo.get_questions_for_test(test.id)
            items.append(TestListItemDTO(
                test_id=test.id,
                title=test.title,
                num_questions=len(questions),
                taken=test.id in taken_test_ids,
            ))
        return items

async def get_test_for_student(test_id: int, student_email: str) -> StudentTestDTO:
    async with async_session_maker() as session:
        user_repo = UserRepository(session)
        test_repo = TestRepository(session)
        question_repo = QuestionRepository(session)

        student = await user_repo.get_user_by_email(student_email)
        test = await test_repo.get_test_by_id(test_id)
        if not test:
            raise HTTPException(status_code=404, detail="Test not found")
        if not await user_repo.is_enrolled(student.id, test.course_id):
            raise HTTPException(status_code=403, detail="Not enrolled in this course")

        questions = await question_repo.get_questions_for_test(test_id)
        return StudentTestDTO(
            test_id=test.id,
            title=test.title,
            questions=[
                StudentQuestionDTO(id=q.id, text=q.text, type=q.type, choices=q.choices)
                for q in questions
            ],
        )

async def submit_test(test_id: int, student_email: str, submission: SubmitTestDTO) -> AttemptResultDTO:
    async with async_session_maker() as session:
        user_repo = UserRepository(session)
        test_repo = TestRepository(session)
        question_repo = QuestionRepository(session)
        attempt_repo = AttemptRepository(session)

        student = await user_repo.get_user_by_email(student_email)
        test = await test_repo.get_test_by_id(test_id)
        if not test:
            raise HTTPException(status_code=404, detail="Test not found")
        if not await user_repo.is_enrolled(student.id, test.course_id):
            raise HTTPException(status_code=403, detail="Not enrolled in this course")
        if await attempt_repo.get_attempt_for_student_and_test(student.id, test_id):
            raise HTTPException(status_code=400, detail="Test already taken")

        question_ids = {q.id for q in await question_repo.get_questions_for_test(test_id)}
        foreign_ids = [a.question_id for a in submission.answers if a.question_id not in question_ids]
        if foreign_ids:
            raise HTTPException(status_code=400, detail=f"Answers for questions not in this test: {foreign_ids}")

        attempt = await attempt_repo.create_attempt(test_id, student.id)
        await attempt_repo.add_answers(attempt.id, submission.answers)

        return AttemptResultDTO(attempt_id=attempt.id, test_id=test_id, submitted=True)
