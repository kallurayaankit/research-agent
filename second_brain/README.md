# B-Ram

A personal, local-first knowledge space for notes, PDFs, code snippets, and bookmarks. Built with FastAPI, SQLite FTS5, and a lightweight browser interface. No frontend build step, account, or cloud API key is required.

**Public browser edition:** the new static build uses private IndexedDB storage, offline installation, a connections map, optional in-browser MiniLM embeddings, and experimental browser AI with source-excerpt fallback. See [deployment and advanced features](DEPLOYMENT.md). The instructions below describe the Python/SQLite edition; its frontend still needs no build step.

## Run on your computer

Requires Python 3.12. From this directory:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app:app --host 127.0.0.1 --port 8000
```

On Windows, activate with `.venv\Scripts\activate` and use `python` instead of `python3`. Open `http://127.0.0.1:8000` in your browser. Keep the server bound to loopback: this is a single-user app without authentication. Use it on a trusted machine, not an exposed public server.

In the prepared Codex workspace, dependencies are installed at `/workspace/second-brain-venv`:

```bash
cd /workspace/research-agent/second_brain
/workspace/second-brain-venv/bin/python -m uvicorn app:app --host 127.0.0.1 --port 8000
```

The original research-agent application is separate and unchanged. This app does not use Tavily.

## Local AI (optional)

Install [Ollama](https://ollama.com), start its service, then run:

```bash
ollama pull llama3.2:3b
ollama pull nomic-embed-text
```

In B-Ram, open **Settings & backup → Build index**. Notes are split into overlapping passages, embedded via Ollama, and stored in SQLite. Rebuild after adding or editing items; only pending passages are embedded. Full-text search works immediately without Ollama. Semantic search compares local vectors; hybrid search combines lexical and vector ranks. For a personal library, exact vector scans keep the system simple; very large collections will need an approximate vector index.

**Ask B-Ram** retrieves up to five sources and passes excerpts to the chat model. Answers display numbered source buttons that open the original item. Each question is independent; chat history is displayed only for the current page session and is not sent as conversation context or persisted. Answers are model-generated, and citation accuracy must be checked against the sources. No tool execution is enabled.

Configure before starting the server:

| Variable | Default | Purpose |
| --- | --- | --- |
| `BRAM_DATA_DIR` | `second_brain/data` | SQLite storage directory |
| `BRAM_OLLAMA_URL` | `http://127.0.0.1:11434` | Ollama server; use a local address for private processing |
| `BRAM_CHAT_MODEL` | `llama3.2:3b` | Chat model |
| `BRAM_EMBED_MODEL` | `nomic-embed-text` | Embedding model |

Only the configured Ollama endpoint receives your retrieved text. Model installation downloads weights; the app itself uses no CDN, telemetry, web scraping, or remote AI provider. In Codex Cloud, “local” means the cloud workspace, not your personal computer. Run this app on your own computer to keep documents there.

## Your library

- Capture and edit notes, code, and bookmarks; tag items and filter by type or tag.
- Import UTF-8 Markdown, text, and common code files, or text-based PDFs. Originals are retained. PDF OCR is not included. Files are limited to 20 MB, PDFs to 500 pages, and extracted content to one million characters.
- Bookmark content consists of your URL and notes. Pages are not fetched automatically.
- Search by words, semantic similarity, or hybrid retrieval. Semantic modes require a built index and a working embedding model. Items awaiting indexing still appear in full-text search.
- Daily review schedules items after 1, 3, 7, 14, and 30 days. “Revisit tomorrow” resets the interval.
- Export a JSON backup containing documents, original attachments, tags, and review state. Restore validates the whole backup before adding missing UUIDs, and preserves existing items. Vectors are regenerated after restoration. Backups up to 100 MB can be restored through the UI; larger libraries can be backed up with SQLite's backup API.
- Automatic sync, conflict resolution, OCR, and persistent multi-turn chat are future work. Backup/restore provides manual transfer, not two-way synchronization.

SQLite stores the library in `data/bram.sqlite3`, ignored by Git. To move a live database, use the app's export or SQLite's backup API; do not copy just the main database file while WAL writes are active. Exported backups are unencrypted and should be kept private.

Keyboard shortcuts: **N** captures an item; **/** focuses library search. Example notes are added only when you choose “Explore with a few example notes.”

## Development and validation

```bash
pip install -r requirements-dev.txt
python -m pytest -q
```

Tests use temporary databases and mock Ollama for deterministic retrieval/chat coverage. They cover document persistence, FTS updates and deletion, PDF/text import, original attachments, review scheduling, atomic/idempotent backup restoration, vector indexing, search ranking, source selection, validation, and browser-origin protection. Mocked tests do not establish model quality or live Ollama availability.

Architecture: `app.py` owns storage, retrieval, and HTTP endpoints. `static/` is the responsive UI. SQLite stores documents, FTS records, chunk vectors, original files, and review schedules. The API schema is available at `/openapi.json`. The app accepts localhost requests only and ships no CDN-dependent documentation UI.

The browser smoke script needs Chromium and a disposable server (it creates example items). Start a separate process with `BRAM_DATA_DIR=/tmp/bram-smoke-data python -m uvicorn app:app --port 8001`, then run `BRAM_TEST_URL=http://127.0.0.1:8001 python tests/browser_smoke.py`. Set `CHROMIUM_PATH` if your Chromium executable is not `/usr/bin/chromium`. Screenshots are written to `/tmp/bram-artifacts` by default.
