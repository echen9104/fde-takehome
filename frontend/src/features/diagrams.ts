// Keep in step with the mermaid blocks in README.md (same diagrams, copied because the Docker build only sees frontend/).
export const DIAGRAMS = [
  {
    title: 'System flow',
    note: 'How data moves from Hacker News to the browser. Connect prepares it, the Python worker adds the AI result.',
    code: `flowchart TD
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
    API --> UI["Browser: React triage page"]`,
  },
  {
    title: 'LLM decision logic',
    note: 'What service/llm.py does with each story: classify, retry, gate on confidence, extract by category.',
    code: `flowchart TD
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
    V -->|3 failures| F`,
  },
  {
    title: 'Frontend components',
    note: 'How the pieces in frontend/src fit together. App.tsx owns the state.',
    code: `flowchart LR
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
    FL -->|visible rows| APP`,
  },
]
