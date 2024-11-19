import os
from parse_keywords import parse_keywords
from dotenv import load_dotenv
from llama_parse import LlamaParse
from llama_index.core import SimpleDirectoryReader, Document, VectorStoreIndex

from query_llm import query_llm

load_dotenv()

API_KEY = os.getenv("LLAMA_CLOUD_API_KEY")

extensions = {
    "text": ".txt",
    "markdown": ".md"
}

def parse_document(doc_path: str, result_type: str = "text") -> None:
    """Parses a document and processes keywords and their hierarchy."""
    parser = LlamaParse(
        language="en",
        parsing_instruction="You are parsing educational materials.",
        result_type=result_type  # "markdown"/"text"
    )

    file_extractor = {
        "default": parser
    }

    documents = SimpleDirectoryReader(input_files=[doc_path], file_extractor=file_extractor).load_data()

    combined_markdown = "\n\n".join([doc.text for doc in documents if isinstance(doc, Document)])

    res = query_llm(combined_markdown)
    print(res)
    parse_keywords(res)

#parse_document("data/cs110-lecture-1-shorter.pdf")