import json
import os
from typing import List
from dotenv import load_dotenv
from groq import Groq
from utils import load_prompts

load_dotenv()
prompts = load_prompts('prompts.yaml')

client = Groq(
    api_key=os.getenv("GROQ_API_KEY"),
)

MODEL = "llama-3.1-8b-instant"

def build_llm_messages(version: str, message: str, course: str) -> list:
    """
    Fetch the appropriate prompt version and format the LLM messages.
    """
    if version not in prompts:
        raise ValueError(f"Prompt version '{version}' not found in the loaded prompts.")
    
    system_prompt = prompts[version]['system']
    user_prompt = prompts[version]['user'].format(message=message, course=course)

    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

def query_llm(message: str, course:str = "History", version:str = "v3") -> str:
    messages = build_llm_messages(version, message, course)

    chat_completion = client.chat.completions.create(
        messages=messages,
        model=MODEL,
    )

    res = chat_completion.choices[0].message.content

    return res

def generate_distractor_topics(course: str, existing_topics: List[str], count: int) -> List[str]:
    """Ask the LLM for `count` plausible-but-incorrect topic names for the given course."""
    prompt = prompts["distractors"]
    messages = [
        {"role": "system", "content": prompt["system"]},
        {"role": "user", "content": prompt["user"].format(
            course=course, existing_topics=", ".join(existing_topics), count=count
        )},
    ]

    chat_completion = client.chat.completions.create(messages=messages, model=MODEL)
    content = chat_completion.choices[0].message.content

    start, end = content.find("["), content.rfind("]") + 1
    if start == -1 or end == 0:
        return []

    topics = json.loads(content[start:end])
    return [topic for topic in topics if isinstance(topic, str)]