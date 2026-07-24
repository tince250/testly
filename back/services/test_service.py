import os
import random
from typing import List
from dotenv import load_dotenv
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from dtos.test_dtos import QuestionResponseDTO, TestCreateDTO, TestResponseDTO
from model.question import Question, QuestionType
from query_llm import generate_distractor_topics
from repositories import CourseRepository, KeywordRepository, QuestionRepository, TestRepository, UserRepository

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_async_engine(DATABASE_URL, echo=True)

async_session_maker = sessionmaker(
    bind=engine, expire_on_commit=False, class_=AsyncSession
)

def _build_matching_choices(correct_topic: str, distractor_topics: List[str], num_distractors: int) -> List[str]:
    distractor_pool = [topic for topic in distractor_topics if topic != correct_topic]
    distractors = random.sample(distractor_pool, min(num_distractors, len(distractor_pool)))
    choices = distractors + [correct_topic]
    random.shuffle(choices)
    return choices

def _to_question_dto(question: Question) -> QuestionResponseDTO:
    return QuestionResponseDTO(
        id=question.id,
        text=question.text,
        type=question.type,
        choices=question.choices,
        correct_answer=question.correct_answer,
    )

async def create_test(course_id: int, creator_email: str, test_data: TestCreateDTO) -> TestResponseDTO:
    async with async_session_maker() as session:
        course_repo = CourseRepository(session)
        keyword_repo = KeywordRepository(session)
        user_repo = UserRepository(session)
        test_repo = TestRepository(session)
        question_repo = QuestionRepository(session)

        course = await course_repo.get_course_by_id(course_id)
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        if not course.keyword_hierarchy_id:
            raise HTTPException(status_code=400, detail="Course has no keyword index yet; upload materials first")

        hierarchy = await keyword_repo.get_hierarchy_by_id(course.keyword_hierarchy_id)
        root = await keyword_repo.get_keyword_by_id(hierarchy.root_id)
        keyword_pool = await keyword_repo.get_all_descendant_keywords(hierarchy.root_id)
        if not keyword_pool:
            raise HTTPException(status_code=400, detail="Course keyword index is empty")

        keywords_by_id = {keyword.id: keyword for keyword in keyword_pool + [root]}

        # The root is an ancestor of every keyword, so it must never be a wrong answer.
        # It stays valid only as the correct topic for keywords directly under it.
        distractor_topics = list({
            keywords_by_id[keyword.parent_id].name
            for keyword in keyword_pool
            if keyword.parent_id != root.id
        })

        creator = await user_repo.get_user_by_email(creator_email)

        test = await test_repo.create_test(title=test_data.title, creator_id=creator.id, course_id=course_id)

        matching_keywords = random.sample(keyword_pool, min(test_data.num_matching_questions, len(keyword_pool)))
        open_keywords = random.sample(keyword_pool, min(test_data.num_open_questions, len(keyword_pool)))

        # When the hierarchy has too few real topics to fill the requested options, ask the
        # LLM for extra plausible distractors that aren't ambiguous with any correct answer.
        num_distractors = test_data.num_matching_options - 1
        if matching_keywords:
            shortfall = num_distractors - (len(distractor_topics) - 1)
            if shortfall > 0:
                try:
                    generated = generate_distractor_topics(course.name, distractor_topics + [root.name], shortfall)
                except Exception:
                    generated = []
                distractor_topics = list(dict.fromkeys(distractor_topics + generated))

        questions: List[QuestionResponseDTO] = []

        for keyword in matching_keywords:
            correct_topic = keywords_by_id[keyword.parent_id].name
            choices = _build_matching_choices(correct_topic, distractor_topics, num_distractors)
            question = await question_repo.create_question(
                text=f"Which topic does '{keyword.name}' belong to?",
                correct_answer=correct_topic,
                choices=choices,
                test_id=test.id,
                type=QuestionType.MATCHING,
            )
            questions.append(_to_question_dto(question))

        for keyword in open_keywords:
            question = await question_repo.create_question(
                text=f"What is {keyword.name}?",
                correct_answer=keyword.definition,
                choices=[],
                test_id=test.id,
                type=QuestionType.OPEN,
            )
            questions.append(_to_question_dto(question))

        used_keywords = {keyword.id: keyword for keyword in matching_keywords + open_keywords}
        await test_repo.add_keywords_to_test(test.id, list(used_keywords.values()))

        return TestResponseDTO(id=test.id, title=test.title, course_id=test.course_id, questions=questions)
