# DECISIONS.md — Architecture Decision Log

Format: newest first. Each decision states context, decision, and consequence.
Reversing a decision requires a new entry, not an edit.

---

## ADR-010 · 2026-08-27 — Docker Compose deployment for V1
Single VM + compose for SaaS V1; the identical bundle is the on-prem story.
No Kubernetes until scale demands it.

## ADR-009 · 2026-08-27 — Own AI Gateway module wrapping LiteLLM SDK
We route by *task* (ocr_cleanup, classification, extraction, reasoning,
embedding) to configured models via the LiteLLM Python SDK inside the engine.
We do NOT deploy the LiteLLM proxy: usage metering, quotas, per-tenant cost and
privacy routing are our margin/trust logic and stay in our code. Consequence:
provider swap = config change; we own the metering tables.

## ADR-008 · 2026-08-27 — Docling for parsing; no AGPL dependencies
PyMuPDF rejected (AGPL) for a proprietary product. Docling (MIT) is primary
parser for PDF/DOCX/scans with layout + table structure; openpyxl for XLSX;
pypdf as lightweight fallback. All parser output normalizes to DocumentBlock.

## ADR-007 · 2026-08-27 — pgvector, no separate vector database
RAG lives in Postgres (`ai_engine` DB) with pgvector. Tenant filtering stays in
one place. Revisit only if retrieval latency/scale proves it necessary.

## ADR-006 · 2026-08-27 — Multi-tenancy: shared DB + tenant_id + Postgres RLS
Both databases. Application-level tenant scoping PLUS RLS policies as defense
in depth. Schema-per-tenant and DB-per-tenant rejected for SaaS (migration
fan-out); dedicated-DB remains available as an enterprise/on-prem tier because
the schema doesn't change.

## ADR-005 · 2026-08-27 — One Postgres server, two databases
`platform` and `ai_engine` are separate databases on one server: real data
independence (engine can be lifted out with its DB), zero extra ops in V1.
Neither service ever connects to the other's database.

## ADR-004 · 2026-08-27 — Contracts package is the only shared code
`packages/contracts` (Pydantic v2) is the single dependency both services
share. JSON Schemas are exported from it; TypeScript types for the web app are
generated from those schemas. No other cross-service imports, ever.

## ADR-003 · 2026-08-27 — Frontend: Next.js + TypeScript + Tailwind/shadcn
Customer-facing UI is fully ours. Django Admin exists for internal ops only and
is never exposed to customers. React/Vite rejected (we want file-based routing,
server rendering for doc-heavy views); Vue rejected (smaller enterprise
component ecosystem, team leverage lower).

## ADR-002 · 2026-08-27 — AI Engine: standalone FastAPI service
Hard requirement: engine survives without the platform. FastAPI + Pydantic v2 +
SQLAlchemy/Alembic + own Celery worker. No platform imports; HTTP + contracts
only; authenticated by service tokens with explicit `X-Tenant-ID`.

## ADR-001 · 2026-08-27 — Platform foundation: Django 5 + DRF (API-only)
Re-evaluated from zero against Frappe, Payload, pure FastAPI, Laravel, Rails,
NestJS, Supabase, Corteza, NocoBase (see ARCHITECTURE.md §4). Django wins on:
proprietary-friendly licensing, batteries (auth, ORM, migrations, admin,
audit via simple-history), Postgres maturity, 5–10-year maintainability,
developer availability, and staying in Python next to the AI ecosystem.
We accept writing our own UI (we wanted that anyway) and running Celery.
