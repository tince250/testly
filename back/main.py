from fastapi import FastAPI
from pydantic import BaseModel
from model.database import engine
from sqlmodel import SQLModel
from model.question import Question
from model.keyword import Keyword, KeywordHierarchy
from model.course import Course, CourseMaterial
from model.user import UserCourseLink, User
from model.test import UserTestLink, Test
from parse_materials import parse_document 

app = FastAPI()

@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

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

@app.get("/parse_document")
async def mock_parse_document():
    parse_document("data/Module 27- World War II-5-10-shorter.pdf") 
    return {"message": "Document parsed successfully"}