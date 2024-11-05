from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

@app.get("/")
async def read_root():
    return {"message": "Hello, World!"}

# Define a sample data model
class Item(BaseModel):
    name: str
    description: str | None = None
    price: float
    tax: float | None = None

# Create a POST route with JSON response
@app.post("/items/")
async def create_item(item: Item):
    item_dict = item.dict()
    item_dict["total_price"] = item.price + (item.tax or 0)
    return item_dict
