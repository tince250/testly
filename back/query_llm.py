import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY"),
)

def query_llm(message: str) -> str:
    chat_completion = client.chat.completions.create(
        messages=[
             {
            "role": "system",
            "content": "You are a education specialist assistant. Your task is to extract keywords, their definitons and relations to other kewords from the given course materials. Each course has its hierarhical structure in a form of graph, where each node is a keyword that has (name, definition, children nodes). Children nodes are nodes that are in 'sub-topic' relation to the parent node. Return list of keyword nodes as a JSON array."
            },
            {
                "role": "user",
                "content": f"Extract keywords from this document: {message}",
            }
        ],
        model="llama3-8b-8192",
    )

    res = chat_completion.choices[0].message.content

    return res