# HN story triage

Pipeline: Hacker News `newstories` -> **Redpanda Connect** (dedupe, fetch item, filter, project, fetch linked page, route) -> topic `hn.enriched` -> **Python service** (LLM classify -> category-specific extraction, retries, confidence gate) -> Postgres `results` + topic `hn.results` -> web page / JSON.

## Run

Needs Docker. No API keys: it uses a local Ollama model (`qwen2.5:1.5b`, ~1 GB download on first run).

```bash
docker compose up --build
```

- Page: http://localhost:8000/  (auto-refreshes; first results appear after the model downloads, about a minute or two)
- Diagrams (same as below, rendered in the app): http://localhost:8000/#diagrams
- JSON: http://localhost:8000/results?status=needs_review&limit=50
- Optional offline seed data (4 stories, no internet needed for the LLM step): `docker compose --profile seed run --rm seed`
- Hosted model: copy `.env.example` to `.env` and set `LLM_BASE_URL`, `LLM_MODEL`, `LLM_API_KEY` (any OpenAI-compatible endpoint).
- UI dev with hot reload (needs Node 20+): `cd frontend && npm install && npm run dev` (proxies `/results` to :8000)
- Tests: `cd service && pip install pytest && pytest`

## Layout

| Path | What |
|---|---|
| `connect/pipeline.yaml` | all Connect logic |
| `service/llm.py` | parsing, validation, retries, routing, confidence branch (pure, unit-tested) |
| `service/app.py` | Kafka worker + FastAPI (serves the built UI at `/`) |
| `frontend/` | React + Tailwind + shadcn/ui triage page; built inside the service image, no local Node needed |
| `db/schema.sql` | Postgres schema |
| `seed/stories.jsonl` | sample enriched records |

## How it fits together

Data flow (renders as a diagram on GitHub):

```mermaid
flowchart TD
    HN[(Hacker News API)] -->|"newstories + item, every 30s"| C
    PAGE[(Linked web page)] -->|"enrich: fetch text"| C
    C["Redpanda Connect<br/>dedupe, filter, project,<br/>enrich, route"]
    C -->|has URL| E[[topic hn.enriched]]
    C -->|no URL| S[[topic hn.skipped]]
    E --> W["Python worker (llm.py)<br/>classify, retry,<br/>confidence gate, extract"]
    W <-->|"chat completions"| O{{"Ollama<br/>or hosted LLM"}}
    W -->|upsert| PG[(Postgres results)]
    W --> R[[topic hn.results]]
    W -->|unparseable message| D[[topic hn.dlq]]
    PG --> API["FastAPI<br/>GET /results + serves UI"]
    API --> UI["Browser: React triage page"]
```

Decision logic inside the worker (`service/llm.py`):

```mermaid
flowchart TD
    A[enriched story] --> B["classify: category + confidence<br/>(bad output: retry up to 3x,<br/>error fed back to the model)"]
    B -->|3 failures| F[status: fallback]
    B -->|valid| G{"confidence<br/>at least 0.6?"}
    G -->|no| N[status: needs_review<br/>extraction skipped]
    G -->|yes| X{category}
    X -->|security| X1[affected product + severity]
    X -->|ai_ml| X2[model or tool]
    X -->|other categories| X3[main subject]
    X1 --> V["validate<br/>(bad output: retry up to 3x)"]
    X2 --> V
    X3 --> V
    V -->|valid| OK[status: ok]
    V -->|3 failures| F
```

Frontend components (`frontend/src/`):

```mermaid
flowchart LR
    APP["App.tsx<br/>holds filter + selection state"]
    APP --> H1[useResults<br/>polls /results every 15s]
    APP --> H2[useWide<br/>screen width]
    APP --> H3[useArrowKeys<br/>Up/Down navigation]
    APP --> FL[filters.ts<br/>applyFilters: pure logic]
    APP --> HD[Header<br/>search, sort, updated]
    APP --> MF[MobileFilters<br/>dropdowns, phones]
    APP --> SB[Sidebar<br/>filter buttons, desktop]
    APP --> RT[ResultsTable<br/>story list]
    APP --> DP[DetailPanel<br/>pane or bottom sheet]
    DP --> DT[Detail<br/>summary, confidence, fields]
    RT --> PT[parts.tsx<br/>Dot, StatusIcon]
    SB --> PT
    DT --> PT
    H1 -->|rows| APP
    FL -->|visible rows| APP
```

## Behaviour worth knowing

- Dedupe is an in-memory Connect cache (24h) keyed on item id; the Postgres upsert on `id` makes restarts and replays safe.
- Pages that block the fetch (403 etc.) continue without content; the LLM then works from the title and logs a Connect error.
- `status`: `ok`, `needs_review` (confidence below 0.6, extraction skipped), `fallback` (model never produced valid output after 3 tries).
- If Ollama or Postgres is down, the worker retries the same message and does not commit its offset, so nothing is lost.

## Write-up

TODO (write this yourself, without AI, per the exercise): Tradeoffs, Surprises and production risks, Why this matters.
