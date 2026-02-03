import re

def clean_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r'[^\w\s\.]', '', text)
    return text

def tokenize(text: str) -> list:
    cleaned = clean_text(text)
    words = cleaned.split()
    return words

def get_text_length(text: str) -> int:
    return len(tokenize(text))