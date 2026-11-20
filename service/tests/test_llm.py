import pytest

import llm

REC = {"id": 1, "title": "CVE in libfoo", "url": "http://x", "content": "buffer overflow in libfoo"}


def fake(*replies):
    """chat() that returns replies in order and records prompts."""
    it, calls = iter(replies), []

    def chat(prompt):
        calls.append(prompt)
        return next(it)

    chat.calls = calls
    return chat


def test_parse_extracts_json_from_prose_and_fences():
    assert llm.parse_json('Sure!\n```json\n{"a": 1}\n```') == {"a": 1}


def test_parse_rejects_garbage():
    with pytest.raises(llm.LLMOutputError):
        llm.parse_json("no json here")


def test_label_is_normalised_and_validated():
    assert llm.validate_classification({"category": " Security ", "confidence": "0.9"})["category"] == "security"
    with pytest.raises(llm.LLMOutputError):
        llm.validate_classification({"category": "cooking", "confidence": 0.9})


def test_invalid_output_is_retried_with_error_fed_back():
    chat = fake("garbage", '{"category":"security","confidence":0.9}',
                '{"summary":"s","affected_product":"libfoo","severity":"high"}')
    r = llm.process(chat, REC)
    assert r["status"] == "ok" and r["extra"]["affected_product"] == "libfoo"
    assert "invalid" in chat.calls[1]  # retry prompt carries the error


def test_gives_up_to_fallback_after_max_attempts():
    r = llm.process(fake(*["nope"] * llm.MAX_ATTEMPTS), REC)
    assert r["status"] == "fallback" and r["category"] == "other"


def test_low_confidence_skips_extraction():
    chat = fake('{"category":"science","confidence":0.2}')
    r = llm.process(chat, REC)
    assert r["status"] == "needs_review" and len(chat.calls) == 1


def test_category_routes_to_its_own_extractor():
    chat = fake('{"category":"programming","confidence":0.9}', '{"summary":"s","main_subject":"rust"}')
    r = llm.process(chat, REC)
    assert r["extra"] == {"main_subject": "rust"}
    assert "main_subject" in chat.calls[1]
