from http.client import HTTPException
from dtos.user_dtos import UserLogin, UserRegistration
from model.user import User, UserRole
from repositories import UserRepository
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_async_engine(DATABASE_URL, echo=True)

async_session_maker = sessionmaker(
    bind=engine, expire_on_commit=False, class_=AsyncSession
)

async def create_user(user: UserRegistration) -> User:
    async with async_session_maker() as session:
        repo = UserRepository(session)
        existing_user = await repo.get_user_by_email(user.email)

        if existing_user:
            return None
        
        role = UserRole.STUDENT
        if user.role == "professor":
            role = UserRole.PROFESSOR

        new_user = await repo.create_user(email=user.email, password=user.password, name=user.name, lastname=user.lastname, role=role)

        return new_user

async def login(user: UserLogin) -> User:
    async with async_session_maker() as session:
        repo = UserRepository(session)
        db_user = await repo.get_user_by_email(user.email)

        if not db_user or db_user.password != user.password:
            return None

        return db_user