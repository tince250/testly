from model.keyword import Keyword, KeywordHierarchy
import json

def parse_keywords(json_string: str) -> None:
    """Parses keywords and their hierarchical relationships."""
    json_start = json_string.find("[")
    json_end = json_string.rfind("]") + 1
    if json_start == -1 or json_end == -1:
        raise ValueError("JSON array not found in the response.")

    json_string = json_string[json_start:json_end]
    data = json.loads(json_string)

    keywords = {}
    current_id = 1

    def process_keyword(item, parent_id=None):
        """Recursively processes a keyword and its children."""
        nonlocal current_id

        keyword = Keyword(
            id=current_id,
            name=item["name"],
            definition=item["definition"],
            parent_id=parent_id
        )
        keywords[item["name"]] = keyword
        current_id += 1

        for child in item.get("children", []):
            process_keyword(child, keyword.id)

    for item in data:
        process_keyword(item)

    print("Keywords:")
    for keyword in keywords.values():
        print(keyword)
