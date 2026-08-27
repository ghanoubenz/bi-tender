# Tender Intelligence

AI Tender Intelligence & Bid Management Platform — a web platform customers use
directly, powered by an independent **Tender AI Engine** that any external
system (Salesforce, SAP, Outlook, custom software) can also call via API.

- `ARCHITECTURE.md` — full architecture & build plan (read this first)
- `DECISIONS.md` — architecture decision log
- `ROADMAP.md` — current / next / later
- `PRODUCT_CONTRACT.md` — rules the AI must never violate

## Layout

```
apps/web        Next.js customer frontend (our UI — never an admin framework)
apps/platform   Django + DRF platform API (tenants, users, tenders, workflow)
apps/ai-engine  FastAPI AI engine (parsing, extraction, evidence, gateway) — platform-independent
packages/contracts  Pydantic contracts — the ONLY shared code
infra           docker-compose + Dockerfiles
```

## Quick start (full stack)

```bash
make dev        # postgres+pgvector, redis, minio, ai-engine :8001, platform :8000, web :3000
```

Sign in at http://localhost:3000 with `demo` / `demo1234` (seeded automatically).
Create a tender, upload a PDF/DOCX/XLSX, watch metadata + evidence appear.

By default the engine runs in `mock` gateway mode (deterministic rule-based
extraction, no external AI calls). For live LLM extraction:

```bash
pip install -e "apps/ai-engine[live]"
ENGINE_GATEWAY_MODE=live OPENAI_API_KEY=... make dev
```

## Local development without Docker

```bash
make venv       # venv with contracts + engine + platform (editable)
make test       # all backend tests

# terminal 1 — engine
cd apps/ai-engine && ../../.venv/bin/uvicorn engine.main:app --port 8001

# terminal 2 — platform
cd apps/platform && ../../.venv/bin/python manage.py migrate && \
  ../../.venv/bin/python manage.py seed_dev && \
  ../../.venv/bin/python manage.py runserver 8000

# terminal 3 — web
cd apps/web && npm install && npm run dev
```

## Engine API (external systems)

The engine is a standalone product surface. Auth: `Authorization: Bearer <service token>`
plus `X-Tenant-ID`. See `apps/ai-engine/engine/api/` and `/docs` (OpenAPI) on :8001.

```
POST /api/v1/tenders/ingest      multipart file → 202 JobStatus
GET  /api/v1/jobs/{id}           job state + result (metadata with evidence)
GET  /api/v1/documents/{id}/blocks   parsed structure for evidence viewing
```
