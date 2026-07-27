import asyncio
import os
from typing import List
from dotenv import load_dotenv
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from dtos.attempt_dtos import AttemptDetailDTO, AttemptListItemDTO, GradeOverrideDTO, QuestionResultDTO
from model.attempt import AttemptStatus
from model.question import Question, QuestionType
from repositories import AttemptRepository, QuestionRepository, TestRepository, UserRepository
from query_llm import grade_open_answer

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_async_engine(DATABASE_URL, echo=True)

async_session_maker = sessionmaker(
    bind=engine, expire_on_commit=False, class_=AsyncSession
)

def _to_attempt_detail_dto(attempt, answers, questions: List[Question]) -> AttemptDetailDTO:
    answers_by_question = {answer.question_id: answer for answer in answers}
    results = []
    for question in questions:
        answer = answers_by_question.get(question.id)
        results.append(QuestionResultDTO(
            question_id=question.id,
            text=question.text,
            type=question.type,
            student_answer=answer.answer if answer else None,
            correct_answer=question.correct_answer,
            is_correct=answer.is_correct if answer else None,
            feedback=answer.feedback if answer else None,
        ))
    graded = attempt.status == AttemptStatus.GRADED
    correct_count = sum(1 for answer in answers if answer.is_correct) if graded else None
    return AttemptDetailDTO(
        attempt_id=attempt.id,
        test_id=attempt.test_id,
        status=attempt.status,
        score=attempt.score,
        correct_count=correct_count,
        total_questions=len(questions),
        results=results,
    )

async def grade_attempt(attempt_id: int) -> None:
    async with async_session_maker() as session:
        attempt_repo = AttemptRepository(session)
        question_repo = QuestionRepository(session)

        attempt = await attempt_repo.get_attempt_by_id(attempt_id)
        if not attempt:
            return

        answers = await attempt_repo.get_answers_for_attempt(attempt_id)
        questions = await question_repo.get_questions_for_test(attempt.test_id)
        questions_by_id = {question.id: question for question in questions}

        correct = 0
        for answer in answers:
            question = questions_by_id.get(answer.question_id)
            if not question:
                continue
            if question.type == QuestionType.MATCHING:
                answer.is_correct = answer.answer.strip().casefold() == question.correct_answer.strip().casefold()
                answer.feedback = None
            else:
                try:
                    result = await asyncio.to_thread(
                        grade_open_answer, question.text, question.correct_answer, answer.answer
                    )
                    answer.is_correct = result["correct"]
                    answer.feedback = result["feedback"]
                except Exception:
                    answer.is_correct = None
                    answer.feedback = "Automatic grading unavailable"
            if answer.is_correct:
                correct += 1
            session.add(answer)

        total = len(questions)
        attempt.score = round(correct / total * 100, 1) if total else 0.0
        attempt.status = AttemptStatus.GRADED
        session.add(attempt)
        await session.commit()

async def get_attempt_result(attempt_id: int, requester_email: str) -> AttemptDetailDTO:
    async with async_session_maker() as session:
        attempt_repo = AttemptRepository(session)
        question_repo = QuestionRepository(session)
        test_repo = TestRepository(session)
        user_repo = UserRepository(session)

        attempt = await attempt_repo.get_attempt_by_id(attempt_id)
        if not attempt:
            raise HTTPException(status_code=404, detail="Attempt not found")

        requester = await user_repo.get_user_by_email(requester_email)
        test = await test_repo.get_test_by_id(attempt.test_id)
        if requester.id != attempt.student_id and requester.id != test.creator_id:
            raise HTTPException(status_code=403, detail="Not allowed to view this attempt")

        answers = await attempt_repo.get_answers_for_attempt(attempt_id)
        questions = await question_repo.get_questions_for_test(attempt.test_id)
        return _to_attempt_detail_dto(attempt, answers, questions)

async def get_test_attempts(test_id: int, professor_email: str) -> List[AttemptListItemDTO]:
    async with async_session_maker() as session:
        attempt_repo = AttemptRepository(session)
        test_repo = TestRepository(session)
        user_repo = UserRepository(session)

        test = await test_repo.get_test_by_id(test_id)
        if not test:
            raise HTTPException(status_code=404, detail="Test not found")
        professor = await user_repo.get_user_by_email(professor_email)
        if test.creator_id != professor.id:
            raise HTTPException(status_code=403, detail="Not the creator of this test")

        attempts = await attempt_repo.get_attempts_for_test(test_id)
        items = []
        for attempt in attempts:
            student = await user_repo.get_user_by_id(attempt.student_id)
            items.append(AttemptListItemDTO(
                attempt_id=attempt.id,
                student_email=student.email,
                status=attempt.status,
                score=attempt.score,
            ))
        return items

async def override_grade(answer_id: int, professor_email: str, data: GradeOverrideDTO) -> AttemptDetailDTO:
    async with async_session_maker() as session:
        attempt_repo = AttemptRepository(session)
        question_repo = QuestionRepository(session)
        test_repo = TestRepository(session)
        user_repo = UserRepository(session)

        answer = await attempt_repo.get_answer_by_id(answer_id)
        if not answer:
            raise HTTPException(status_code=404, detail="Answer not found")
        attempt = await attempt_repo.get_attempt_by_id(answer.attempt_id)
        test = await test_repo.get_test_by_id(attempt.test_id)
        professor = await user_repo.get_user_by_email(professor_email)
        if test.creator_id != professor.id:
            raise HTTPException(status_code=403, detail="Not the creator of this test")

        answer.is_correct = data.is_correct
        if data.feedback is not None:
            answer.feedback = data.feedback
        session.add(answer)
        await session.commit()

        answers = await attempt_repo.get_answers_for_attempt(attempt.id)
        questions = await question_repo.get_questions_for_test(attempt.test_id)
        total = len(questions)
        correct = sum(1 for graded_answer in answers if graded_answer.is_correct)
        attempt.score = round(correct / total * 100, 1) if total else 0.0
        session.add(attempt)
        await session.commit()

        return _to_attempt_detail_dto(attempt, answers, questions)
