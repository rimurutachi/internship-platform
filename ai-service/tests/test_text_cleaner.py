import pytest
from utils.text_cleaner import clean_text, tokenize, get_text_length

def test_clean_text():
    assert clean_text("Hello World!") == "hello world"
    assert clean_text("This is a Test... 123") == "this is a test... 123"
    assert clean_text("Symbols: @#$%^&*()") == "symbols "

def test_tokenize():
    assert tokenize("Hello World!") == ["hello", "world"]
    assert tokenize("This is a test") == ["this", "is", "a", "test"]

def test_get_text_length():
    assert get_text_length("Hello World!") == 2
    assert get_text_length("") == 0
    assert get_text_length("Just one") == 2
