import os
from typing import List, Optional
from sqlmodel import Session, select
from model.question import Question
from model.keyword import Keyword, KeywordHierarchy
from model.course import Course, CourseMaterial
from model.user import UserCourseLink, User
from model.test import UserTestLink, Test
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

class KeywordRepository:
    """Handles CRUD operations for the Keyword and KeywordHierarchy models."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_keyword(self, name: str, definition: str, parent_id: Optional[int] = None) -> Keyword:
        """Creates a new keyword."""
        keyword = Keyword(name=name, definition=definition, parent_id=parent_id)
        self.session.add(keyword)
        await self.session.commit()
        await self.session.refresh(keyword)
        return keyword

    async def get_keyword_by_id(self, keyword_id: int) -> Optional[Keyword]:
        """Fetches a keyword by its ID."""
        statement = select(Keyword).where(Keyword.id == keyword_id)
        return self.session.exec(statement).first()

    async def get_all_keywords(self) -> List[Keyword]:
        """Fetches all keywords."""
        statement = select(Keyword)
        return self.session.exec(statement).all()

    async def update_keyword(self, keyword_id: int, name: Optional[str] = None, definition: Optional[str] = None) -> Optional[Keyword]:
        """Updates an existing keyword."""
        keyword = self.get_keyword_by_id(keyword_id)
        if not keyword:
            return None
        if name:
            keyword.name = name
        if definition:
            keyword.definition = definition
        self.session.add(keyword)
        await self.session.commit()
        self.session.refresh(keyword)
        return keyword

    async def delete_keyword(self, keyword_id: int) -> bool:
        """Deletes a keyword by its ID."""
        keyword = self.get_keyword_by_id(keyword_id)
        if not keyword:
            return False
        self.session.delete(keyword)
        self.session.commit()
        return True

    # --- KeywordHierarchy CRUD Operations ---

    async def create_hierarchy(self, root_id: Optional[int] = None) -> KeywordHierarchy:
        """Creates a new keyword hierarchy."""
        hierarchy = KeywordHierarchy(root_id=root_id)
        self.session.add(hierarchy)
        self.session.commit()
        self.session.refresh(hierarchy)
        return hierarchy

    async def get_hierarchy_by_id(self, hierarchy_id: int) -> Optional[KeywordHierarchy]:
        """Fetches a hierarchy by its ID."""
        statement = select(KeywordHierarchy).where(KeywordHierarchy.id == hierarchy_id)
        return self.session.exec(statement).first()

    async def get_all_hierarchies(self) -> List[KeywordHierarchy]:
        """Fetches all keyword hierarchies."""
        statement = select(KeywordHierarchy)
        return self.session.exec(statement).all()

    async def add_keyword_to_hierarchy(self, hierarchy_id: int, keyword_id: int) -> Optional[KeywordHierarchy]:
        """Adds a keyword to a hierarchy."""
        hierarchy = self.get_hierarchy_by_id(hierarchy_id)
        keyword = self.get_keyword_by_id(keyword_id)
        if not hierarchy or not keyword:
            return None
        hierarchy.keywords.append(keyword)
        self.session.add(hierarchy)
        self.session.commit()
        self.session.refresh(hierarchy)
        return hierarchy

    async def delete_hierarchy(self, hierarchy_id: int) -> bool:
        """Deletes a keyword hierarchy."""
        hierarchy = self.get_hierarchy_by_id(hierarchy_id)
        if not hierarchy:
            return False
        self.session.delete(hierarchy)
        self.session.commit()
        return True
       
class CourseRepository:
    """Handles CRUD operations for the Course and CourseMaterials models."""

    def __init__(self, session: Session):
        self.session = session

    # --- Course CRUD Operations ---

    async def create_course(self, name: str, keyword_hierarchy_id: Optional[int] = None) -> Course:
        course = Course(name=name, keyword_hierarchy_id=keyword_hierarchy_id)
        self.session.add(course)
        self.session.commit()
        self.session.refresh(course)
        return course

    async def get_course_by_id(self, course_id: int) -> Optional[Course]:
        statement = select(Course).where(Course.id == course_id)
        return self.session.exec(statement).first()

    async def update_course(self, course_id: int, name: Optional[str] = None, keyword_hierarchy_id: Optional[int] = None) -> Optional[Course]:
        course = self.get_course_by_id(course_id)
        if not course:
            return None
        if name:
            course.name = name
        if keyword_hierarchy_id is not None:
            course.keyword_hierarchy_id = keyword_hierarchy_id
        self.session.add(course)
        self.session.commit()
        self.session.refresh(course)
        return course

    async def add_material_to_course(self, course_id: int, material: CourseMaterial) -> Optional[Course]:
        course = self.get_course_by_id(course_id)
        if not course:
            return None
        material.course_id = course.id
        self.session.add(material)
        self.session.commit()
        self.session.refresh(course)
        return course

    async def delete_course(self, course_id: int) -> bool:
        course = self.get_course_by_id(course_id)
        if not course:
            return False
        self.session.delete(course)
        self.session.commit()
        return True

    # --- CourseMaterial CRUD Operations ---

    async def create_course_material(self, title: str, course_id: Optional[int] = None) -> CourseMaterial:
        material = CourseMaterial(title=title, course_id=course_id)
        self.session.add(material)
        self.session.commit()
        self.session.refresh(material)
        return material

    async def get_course_material_by_id(self, material_id: int) -> Optional[CourseMaterial]:
        statement = select(CourseMaterial).where(CourseMaterial.id == material_id)
        return self.session.exec(statement).first()

    async def update_course_material(self, material_id: int, title: Optional[str] = None) -> Optional[CourseMaterial]:
        material = self.get_course_material_by_id(material_id)
        if not material:
            return None
        if title:
            material.title = title
        self.session.add(material)
        self.session.commit()
        self.session.refresh(material)
        return material
    
class TestRepository:
    """Handles CRUD operations for the Test model."""

    def __init__(self, session: Session):
        self.session = session
    
    async def create_test(self, title: str, creator_id: Optional[int] = None, course_id: Optional[int] = None) -> Test:
        test = Test(title=title, creator_id=creator_id, course_id=course_id)
        self.session.add(test)
        self.session.commit()
        self.session.refresh(test)
        return test

    async def get_test_by_id(self, test_id: int) -> Optional[Test]:
        statement = select(Test).where(Test.id == test_id)
        return self.session.exec(statement).first()

    async def update_test(self, test_id: int, title: Optional[str] = None) -> Optional[Test]:
        test = self.get_test_by_id(test_id)
        if not test:
            return None
        if title:
            test.title = title
        self.session.add(test)
        self.session.commit()
        self.session.refresh(test)
        return test

    async def add_question_to_test(self, test_id: int, question: Question) -> Optional[Test]:
        test = self.get_test_by_id(test_id)
        if not test:
            return None
        question.test_id = test.id
        self.session.add(question)
        self.session.commit()
        self.session.refresh(test)
        return test

    async def remove_question_from_test(self, test_id: int, question_id: int) -> Optional[Test]:
        test = self.get_test_by_id(test_id)
        question = self.get_question_by_id(question_id)
        if not test or not question or question.test_id != test.id:
            return None
        question.test_id = None
        self.session.add(question)
        self.session.commit()
        self.session.refresh(test)
        return test

    async def add_user_to_test_takers(self, test_id: int, user_id: int) -> Optional[Test]:
        link = UserTestLink(user_id=user_id, test_id=test_id)
        self.session.add(link)
        self.session.commit()
        return self.get_test_by_id(test_id)
    
class QuestionRepository:
    """Handles CRUD operations for the Question model."""

    def __init__(self, session: Session):
        self.session = session
    
    async def create_question(self, text: str, correct_answer: str, choices: List[str], test_id: Optional[int]) -> Question:
        question = Question(text=text, correct_answer=correct_answer, choices=choices, test_id=test_id)
        self.session.add(question)
        self.session.commit()
        self.session.refresh(question)
        return question

    async def get_question_by_id(self, question_id: int) -> Optional[Question]:
        statement = select(Question).where(Question.id == question_id)
        return self.session.exec(statement).first()

    async def update_question(self, question_id: int, text: Optional[str] = None, correct_answer: Optional[str] = None, choices: Optional[List[str]] = None) -> Optional[Question]:
        question = self.get_question_by_id(question_id)
        if not question:
            return None
        if text:
            question.text = text
        if correct_answer:
            question.correct_answer = correct_answer
        if choices is not None:
            question.choices = choices
        self.session.add(question)
        self.session.commit()
        self.session.refresh(question)
        return question

    async def delete_question(self, question_id: int) -> bool:
        question = self.get_question_by_id(question_id)
        if not question:
            return False
        self.session.delete(question)
        self.session.commit()
        return True

class UserRepository:
    """Handles CRUD operations for the User model."""

    def __init__(self, session: Session):
        self.session = session

    async def create_user(self, email: str, password: str, name: str, lastname: str, role: str) -> User:
        user = User(email=email, password=password, name=name, lastname=lastname, role=role)
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)
        return user

    async def get_user_by_id(self, user_id: int) -> Optional[User]:
        statement = select(User).where(User.id == user_id)
        return self.session.exec(statement).first()

    async def update_user(self, user_id: int, email: Optional[str] = None, password: Optional[str] = None, name: Optional[str] = None, lastname: Optional[str] = None) -> Optional[User]:
        user = self.get_user_by_id(user_id)
        if not user:
            return None
        if email:
            user.email = email
        if password:
            user.password = password
        if name:
            user.name = name
        if lastname:
            user.lastname = lastname
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)
        return user

    async def add_course_to_user(self, user_id: int, course_id: int) -> Optional[User]:
        link = UserCourseLink(user_id=user_id, course_id=course_id)
        self.session.add(link)
        self.session.commit()
        return self.get_user_by_id(user_id)

    async def remove_course_from_user(self, user_id: int, course_id: int) -> Optional[User]:
        statement = select(UserCourseLink).where(UserCourseLink.user_id == user_id, UserCourseLink.course_id == course_id)
        link = self.session.exec(statement).first()
        if not link:
            return None
        self.session.delete(link)
        self.session.commit()
        return self.get_user_by_id(user_id)

    async def delete_user(self, user_id: int) -> bool:
        user = self.get_user_by_id(user_id)
        if not user:
            return False
        self.session.delete(user)
        self.session.commit()
        return True
