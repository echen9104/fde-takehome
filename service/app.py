"""Worker (topic -> LLM -> Postgres + topic) and read API in one process."""
import json
import os
import threading
import time

import httpx
import psycopg
from confluent_kafka import Consumer, Producer
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from psycopg.types.json import Jsonb

import llm

BROKERS = os.getenv("BROKERS", "redpanda:9092")
DB = os.getenv("DATABASE_URL", "postgresql://app:app@postgres:5432/app")
LLM_URL = os.getenv("LLM_BASE_URL", "http://ollama:11434/v1")
LLM_MODEL = os.getenv("LLM_MODEL", "qwen2.5:1.5b")
LLM_KEY = os.getenv("LLM_API_KEY", "ollama")  # set to a real key + LLM_BASE_URL for a hosted model

UPSERT = """
INSERT INTO results (id, title, url, by, posted_at, category, confidence, status, summary, extra)
VALUES (%(id)s, %(title)s, %(url)s, %(by)s, %(time)s, %(category)s, %(confidence)s, %(status)s, %(summary)s, %(extra)s)
ON CONFLICT (id) DO UPDATE SET category = EXCLUDED.category, confidence = EXCLUDED.confidence,
  status = EXCLUDED.status, summary = EXCLUDED.summary, extra = EXCLUDED.extra, processed_at = now()
"""


def chat(prompt):
    r = httpx.post(
        f"{LLM_URL}/chat/completions",
        headers={"Authorization": f"Bearer {LLM_KEY}"},
        json={"model": LLM_MODEL, "temperature": 0, "response_format": {"type": "json_object"},
              "messages": [{"role": "user", "content": prompt}]},
        timeout=180,
    )
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"]


def handle(rec, producer):
    out = llm.process(chat, rec)  # httpx errors propagate: caller retries, offset not committed
    row = {**rec, **out, "extra": Jsonb(out["extra"])}
    with psycopg.connect(DB) as conn:  # shortcut: connection per message, use a pool if throughput matters
        conn.execute(UPSERT, row)
    producer.produce("hn.results", key=str(rec["id"]),
                     value=json.dumps({**rec, **out, "content": None}))
    producer.flush()


def worker():
    consumer = Consumer({"bootstrap.servers": BROKERS, "group.id": "llm-worker",
                         "auto.offset.reset": "earliest", "enable.auto.commit": False})
    producer = Producer({"bootstrap.servers": BROKERS})
    consumer.subscribe(["hn.enriched"])
    while True:
        msg = consumer.poll(1.0)
        if msg is None or msg.error():
            continue
        try:
            rec = json.loads(msg.value())
        except ValueError:
            producer.produce("hn.dlq", value=msg.value())  # unparseable: park it, do not block the topic
            consumer.commit(msg)
            continue
        while True:  # at-least-once: retry the same message until dependencies are back
            try:
                handle(rec, producer)
                break
            except (httpx.HTTPError, psycopg.OperationalError) as e:
                print(f"dependency down ({e!r}), retrying in 5s", flush=True)
                time.sleep(5)
        consumer.commit(msg)


app = FastAPI()


@app.on_event("startup")
def start():
    threading.Thread(target=worker, daemon=True).start()


@app.get("/results")
def results(status: str | None = None, limit: int = 100):
    q = "SELECT id, title, url, posted_at, category, confidence, status, summary, extra FROM results"
    args = []
    if status:
        q += " WHERE status = %s"
        args.append(status)
    q += " ORDER BY processed_at DESC LIMIT %s"
    with psycopg.connect(DB) as conn, conn.cursor(row_factory=psycopg.rows.dict_row) as cur:
        cur.execute(q, args + [limit])
        return cur.fetchall()


# Built React app (see service/Dockerfile). Mounted last so /results wins.
app.mount("/", StaticFiles(directory="static", html=True), name="static")
