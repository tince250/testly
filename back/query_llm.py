import os
from dotenv import load_dotenv
from groq import Groq
from utils import load_prompts

load_dotenv()
prompts = load_prompts('prompts.yaml')

client = Groq(
    api_key=os.getenv("GROQ_API_KEY"),
)

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
        model="llama3-8b-8192",
    )

    res = chat_completion.choices[0].message.content

    return res