"""LLM logic: parse, validate, retry, route by category, branch on confidence.

Kept free of Kafka/Postgres so it can be unit-tested with a fake `chat` function.
"""
import json
import os
import re

CATEGORIES = ["security", "ai_ml", "programming", "business", "science", "other"]
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.6"))
MAX_ATTEMPTS = 3

# Category routing: each category gets its own extraction step and fields.
# A field is (name, allowed values or None for free text).
EXTRACTORS = {
    "security": [("affected_product", None), ("severity", ["low", "medium", "high", "unknown"])],
    "ai_ml": [("model_or_tool", None)],
}
DEFAULT_EXTRACTOR = [("main_subject", None)]


class LLMOutputError(Exception):
    pass


def parse_json(text):
    """Small models wrap JSON in prose or code fences: take the first {...} block."""
    m = re.search(r"\{.*\}", text or "", re.DOTALL)  # shortcut: greedy match, fails on 2 objects
    if not m:
        raise LLMOutputError("no JSON object found")
    try:
        obj = json.loads(m.group(0))
    except json.JSONDecodeError as e:
        raise LLMOutputError(f"bad JSON: {e}")
    if not isinstance(obj, dict):
        raise LLMOutputError("JSON is not an object")
    return obj


def validate_classification(obj):
    cat = str(obj.get("category", "")).strip().lower()
    if cat not in CATEGORIES:
        raise LLMOutputError(f"category {cat!r} not in {CATEGORIES}")
    try:
        conf = float(obj.get("confidence"))
    except (TypeError, ValueError):
        raise LLMOutputError("confidence missing or not a number")
    if not 0 <= conf <= 1:
        raise LLMOutputError("confidence outside 0..1")
    return {"category": cat, "confidence": conf}


def validate_extraction(obj, fields):
    out = {}
    summary = str(obj.get("summary", "")).strip()
    if not summary:
        raise LLMOutputError("summary missing")
    out["summary"] = summary
    for name, allowed in fields:
        v = str(obj.get(name, "")).strip()
        if allowed:
            v = v.lower()
            if v not in allowed:
                raise LLMOutputError(f"{name} {v!r} not in {allowed}")
        elif not v:
            raise LLMOutputError(f"{name} missing")
        out[name] = v
    return out


def call_json(chat, prompt, validate):
    """Ask, parse, validate. On invalid output retry with the error fed back."""
    msg, last = prompt, None
    for _ in range(MAX_ATTEMPTS):
        raw = chat(msg)
        try:
            return validate(parse_json(raw))
        except LLMOutputError as e:
            last = e
            msg = f"{prompt}\n\nYour previous answer was invalid ({e}). Reply with ONLY a valid JSON object."
    raise LLMOutputError(f"gave up after {MAX_ATTEMPTS} attempts: {last}")


def _context(rec):
    body = rec.get("content") or "(page could not be fetched; use the title only)"
    return f"Title: {rec['title']}\nURL: {rec['url']}\n\nPage text:\n{body[:3000]}"


def process(chat, rec):
    """Return the result dict for one enriched record. `chat(prompt) -> str`."""
    ctx = _context(rec)

    # Step 1: classify
    try:
        c = call_json(
            chat,
            f"Classify this Hacker News story.\n{ctx}\n\n"
            f'Reply with JSON: {{"category": one of {CATEGORIES}, "confidence": number 0..1}}',
            validate_classification,
        )
    except LLMOutputError as e:
        return {"category": "other", "confidence": 0.0, "status": "fallback", "extra": {"error": str(e)}}

    # Branch on confidence: skip the second (costly) call and flag for a human.
    if c["confidence"] < CONFIDENCE_THRESHOLD:
        return {**c, "status": "needs_review", "summary": None, "extra": {}}

    # Step 2: category-specific extraction
    fields = EXTRACTORS.get(c["category"], DEFAULT_EXTRACTOR)
    spec = ", ".join(f'"{n}": ' + (f"one of {a}" if a else "string") for n, a in fields)
    try:
        e = call_json(
            chat,
            f"This story is about {c['category']}.\n{ctx}\n\n"
            f'Reply with JSON: {{"summary": "one sentence", {spec}}}',
            lambda o: validate_extraction(o, fields),
        )
    except LLMOutputError as err:
        return {**c, "status": "fallback", "summary": None, "extra": {"error": str(err)}}

    summary = e.pop("summary")
    return {**c, "status": "ok", "summary": summary, "extra": e}
