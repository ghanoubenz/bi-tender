# Tender Intelligence Platform — Architecture & Build Plan

Status: **Adopted** · Date: 2026-08-27 · Owner: Lead Architect
This document is the product's architectural constitution. Changes go through `DECISIONS.md`.

---

## 1. Final Product Architecture

Two products, designed together, technically independent:

1. **Tender Web Platform** — the commercial SaaS customers log into. Owns users,
   tenants, tenders, workflow, collaboration, configuration, billing-facing
   concerns. It is the *first client* of the AI Engine — never its host.
2. **Tender AI Engine** — a standalone service exposing a versioned HTTP API
   (`/api/v1/tenders/...`). It knows nothing about platform users, sessions, or
   UI. It receives documents + tenant identity + contracts, and returns
   evidence-backed intelligence. If the platform disappears, the engine still
   works and can be called by Salesforce, SAP, Outlook flows, or custom software.

```
 CUSTOMER ──► WEB (Next.js) ──► PLATFORM API (Django/DRF) ──► AI ENGINE API (FastAPI)
                                                                    │
                                                              AI GATEWAY (task routing)
                                                                    │
                                                    OpenAI · Anthropic · Gemini · (local later)

 INTEGRATION LAYER (later) ──► same AI ENGINE API
   Salesforce · SAP · Dynamics · Oracle · Outlook/email · tender portals
```

Hard rules:
- The AI Engine has **zero imports from the platform** and no access to the
  platform database. Communication is HTTP + shared contracts only.
- Contracts live in `packages/contracts` (Pydantic = source of truth, JSON
  Schema exported, TypeScript types generated for the web app).
- Every AI output is **evidence-first**: facts carry source document, page,
  clause, quote, confidence; judgements reference the fact IDs they used.
- Tenant identity travels with every engine call; engine data is partitioned by
  `tenant_id` with Postgres RLS.

## 2. Technology Decision

| Concern | Decision |
|---|---|
| Platform foundation | **Django 5 + Django REST Framework** (API-only; Django Admin internal ops tool only) |
| Backend language | Python 3.11 (both services) |
| Frontend | **Next.js (App Router) + TypeScript + Tailwind + shadcn/ui** |
| Database | **PostgreSQL 16** — one server, two databases: `platform`, `ai_engine` (pgvector in `ai_engine`) |
| AI Engine | **FastAPI + Pydantic v2**, own Celery worker |
| AI Gateway | **Own gateway module inside the engine, wrapping the LiteLLM Python SDK** (task-based routing, usage/cost tracking ours) |
| Queue | **Redis + Celery** (separate queues/brokers per service; shared Redis instance in dev) |
| Object storage | **S3-compatible** (MinIO in dev, S3/R2/on-prem MinIO in prod) |
| Document parser | **Docling (MIT)** for PDF/DOCX/scans with layout+tables; openpyxl for XLSX; pypdf fallback |
| OCR | Docling OCR pipeline (RapidOCR/Tesseract backends) |
| Vector/RAG | **pgvector** in the `ai_engine` database. No vector SaaS. |
| Deployment | **Docker Compose** on a single VM for V1; on-prem = same compose bundle |

## 3. Why This Stack

- **Django wins the platform** because a B2B workflow product is 80% accounts,
  permissions, audit, files, and CRUD-with-rules — Django ships mature answers
  (auth, ORM, migrations, admin for internal ops, `django-simple-history` for
  audit) under MIT/BSD licenses, keeping our product fully proprietary.
- **FastAPI wins the engine** because the engine is contract-driven async I/O:
  Pydantic contracts *are* the API, and the AI ecosystem (LiteLLM, docling,
  instructor-style structured output) is Python-native.
- **One language (Python) across both services** maximizes hiring, code review,
  and shared tooling, while the HTTP boundary keeps them independent.
- **Next.js** gives us a premium enterprise UI we fully own — no Django Admin,
  Frappe Desk, or Payload Admin ever shown to customers.
- **Postgres for everything** (relational + vector + full-text) removes three
  infrastructure technologies from V1; Redis and S3 are the only additions.
- **Shared DB + tenant_id + RLS** is the standard for this size of B2B SaaS:
  cheap to operate, safe (defense in depth), and compatible with later
  schema-per-tenant or dedicated-DB enterprise tiers and on-prem bundles.
- **Own AI Gateway module (not the LiteLLM proxy server)** keeps routing,
  quotas, per-tenant cost tracking, and margin logic in our code with no extra
  deployable, while still getting 100+ providers via the SDK.
- **Docling over PyMuPDF** avoids AGPL contamination in a proprietary product
  and is the strongest MIT-licensed option for layout- and table-preserving
  extraction, which is exactly where tender requirements live.

## 4. Alternatives Rejected

| Option | Why rejected |
|---|---|
| Frappe | Product = Desk UI + metadata engine; fighting it to own our UI/UX; MariaDB-first; high upgrade risk |
| Payload | CMS-shaped, TypeScript-only backend; splits us from the Python AI ecosystem; weak workflow/RBAC for B2B ops |
| Pure FastAPI platform | Rebuilds auth/admin/migrations/audit Django already ships; chosen where it's strongest (the engine) |
| Laravel / Rails | Solid frameworks, but a PHP/Ruby platform + Python AI engine is a two-ecosystem tax with no offsetting win |
| NestJS | Same polyglot tax, fewer batteries than Django for accounts/audit/admin |
| Supabase-as-backend | BaaS coupling for core product logic; self-host stack is heavy; we need a real application layer anyway |
| Corteza / NocoBase | Low-code platforms → generic-no-code trap, upgrade risk, no full UI ownership; we are an opinionated product |
| PyMuPDF | AGPL — incompatible with proprietary distribution without paid license |
| Pinecone/Qdrant/Weaviate | pgvector covers V1 scale; one less system, tenant isolation stays in one place |
| Kubernetes/Kafka/Elasticsearch | Not needed for V1 scale; compose + Postgres FTS suffice |

## 5. System Diagram

```
┌────────────────────────── Browser ──────────────────────────┐
│                 Next.js Web App (apps/web)                  │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS (session/JWT)
┌──────────────────────────────▼──────────────────────────────┐
│           PLATFORM  (apps/platform · Django + DRF)          │
│  tenants · users · RBAC · tenders · documents · workflow    │
│  audit · configuration · engine-client (HTTP)               │
│        │ Celery worker (platform queue)                     │
└───┬────┴───────────────┬────────────────────────────────────┘
    │ Postgres:platform  │ S3 presigned/document keys
    │ Redis              │ HTTP + service token + X-Tenant-ID
┌───▼────────────────────▼────────────────────────────────────┐
│          AI ENGINE  (apps/ai-engine · FastAPI)              │
│  ingestion · parsing(docling) · extraction · compliance     │
│  match · scoring · RAG(pgvector) · jobs                     │
│  AI GATEWAY: task routing, retries, fallback, cost metering │
│        │ Celery worker (engine queue)                       │
└───┬────┴──────────┬─────────────────────────────────────────┘
    │ Postgres:     │            ┌ OpenAI
    │ ai_engine     └── LiteLLM ─┼ Anthropic
    │ (pgvector)        SDK      ├ Gemini
    │ Redis · S3                 └ local models (later)
```

## 6. Repo Structure

```
bi-tender/
  apps/
    web/          # Next.js customer frontend
    platform/     # Django + DRF platform API
    ai-engine/    # FastAPI AI engine + Celery worker
  packages/
    contracts/    # Pydantic contracts (source of truth) + JSON Schema export
  infra/          # docker-compose, Dockerfiles, init scripts
  docs/           # ADR-style docs, API notes
  Makefile        # dev entrypoints (make dev, make test, ...)
```

## 7. Core Data Model (V1 only)

Platform DB (`platform`):
- `Tenant(id, name, slug, settings)`
- `User(id, tenant, email, role)` — roles: admin, bid_manager, contributor, viewer
- `Tender(id, tenant, reference, title, client_name, country, deadline, status, decision, metadata_json)`
- `TenderDocument(id, tenant, tender, filename, content_type, size, storage_key, kind, ingestion_status, engine_document_id)`
- `AuditLog` via django-simple-history on Tender/TenderDocument

Engine DB (`ai_engine`) — all rows carry `tenant_id`, RLS enforced:
- `EngineDocument(id, tenant_id, external_ref, filename, storage_key, status, page_count)`
- `DocumentBlock(id, document, page, block_type[paragraph|table|heading|cell], section_path, text, bbox, order)`
- `ExtractedFact(id, tenant_id, document, kind[metadata|requirement], payload_json, evidence_json, confidence, needs_review)`
- `Chunk(id, tenant_id, document, text, metadata_json, embedding vector)`
- `Job(id, tenant_id, type, status, input_json, result_json, error)`
- `UsageRecord(id, tenant_id, job, model, task, input_tokens, output_tokens, cost_usd)`

Company Intelligence (V1 minimal, platform DB):
- `CompanyProfile(tenant, description)` · `Capability(tenant, category, name, details)` ·
  `Certification(tenant, name, issuer, valid_until)` · `ProjectReference(tenant, client, scope, value, year, country)`

## 8. AI Engine Architecture

```
apps/ai-engine/engine/
  api/            # FastAPI routers: ingest, analyze, extract, compliance, score, query, jobs
  ingestion/      # file identification, ZIP unpack, storage fetch
  parsing/        # docling adapter → Document/Section/Clause/Page/Table/Row/Cell blocks
  extraction/     # metadata + requirement extraction (structured LLM calls, Layer 1)
  evidence/       # evidence assembly + validation (quote must exist in source block)
  compliance/     # requirement × capability matching → compliance matrix (Layer 2)
  scoring/        # risk, fit score, bid readiness (Layer 2, references Layer-1 fact ids)
  rag/            # chunking, embeddings, pgvector retrieval, citations
  gateway/        # AI Gateway: task→model routing table, retries, fallback, cost metering
  jobs/           # Celery tasks + job state machine
  db/             # SQLAlchemy models, Alembic migrations, RLS session handling
```

Layer separation is enforced in code: `extraction/` may only produce facts with
evidence; `compliance/` and `scoring/` consume fact IDs and may not invent facts.

## 9. Contracts Between Platform and AI

Defined in `packages/contracts` (Pydantic v2, versioned `v1`):

- `TenderDocumentInput` — storage_key/bytes ref, filename, content_type, external_ref
- `TenderMetadata` — client, project, country, deadline, scope, submission info… every field `Optional`, each with `EvidenceReference` list; unknown ⇒ null + flag
- `ExtractedRequirement` — id, text, category (technical/commercial/legal/qualification/documentation/submission), mandatory?, evidence, confidence, needs_review
- `EvidenceReference` — document_id, filename, page, section_path, clause, quote, method, confidence
- `ComplianceResult` — per-requirement status (compliant/partial/gap/unknown), matched capability ids, rationale, evidence refs
- `RiskResult` — risk items with severity, category, based_on_fact_ids
- `ScoreResult` — fit_score, bid_readiness, component scores, based_on_fact_ids
- `QuestionAnswerResult` — answer, citations (chunk/evidence refs), confidence
- `JobStatus` — id, type, state (queued/running/succeeded/failed), progress, result ref

Engine API v1 (all under `/api/v1`, service-token auth + `X-Tenant-ID`):

```
POST /tenders/ingest               → JobStatus       (parse + index a document)
POST /tenders/extract-metadata     → JobStatus
POST /tenders/extract-requirements → JobStatus
POST /tenders/compliance           → JobStatus
POST /tenders/score                → JobStatus
POST /tenders/query                → QuestionAnswerResult (sync)
GET  /jobs/{id}                    → JobStatus (+result)
GET  /documents/{id}/blocks        → parsed structure (for evidence viewer)
```

## 10. Document Processing Pipeline

1. **Receive** — platform uploads file to S3, calls `/ingest` with storage key.
2. **Identify** — magic-bytes + extension → pdf | scanned-pdf | docx | xlsx | zip | email; ZIPs unpack into child documents.
3. **Parse** — Docling produces layout-aware structure; XLSX via openpyxl sheet→table blocks; born-digital PDF text extracted directly, scanned pages routed to OCR.
4. **Normalize** — everything becomes `DocumentBlock` rows (page, section_path, block_type, table cells preserved as rows/cells). A 300-page tender is never one string.
5. **Index** — chunking (block-aware, tables kept intact) → embeddings → pgvector with metadata (tenant, document, page, section).
6. **Extract** — structured LLM passes over relevant blocks: metadata first, then requirements, each output validated against contracts and against source text (quote must exist in the referenced block or the fact is flagged).
7. **Persist + report** — facts stored with evidence; job completes; platform polls/receives result.

## 11. Evidence Architecture

- Evidence is a first-class stored object, not prompt output prose:
  `ExtractedFact.evidence_json = [EvidenceReference]`, each pointing at a
  concrete `DocumentBlock` id + page + quote.
- Validation on write: quote substring-matched (whitespace-normalized) against
  the block text; failure ⇒ `needs_review = true`, confidence capped.
- Layer 2 outputs (risk, score, compliance rationale) store `based_on_fact_ids`
  — the UI can walk judgement → facts → blocks → highlighted source page.
- The web document viewer fetches `/documents/{id}/blocks` to render the source
  and highlight the evidence span when a citation is clicked.
- No unsupported guessing: absent evidence ⇒ field is null and flagged.

## 12. Company Intelligence Model

V1 (deliberately basic): CompanyProfile + Capabilities + Certifications +
ProjectReferences, entered manually in the platform. The match engine compares
`ExtractedRequirement`s against these via the same structured-LLM + rules path
and outputs `ComplianceResult`s.

Future: ingest company documents through the same parsing pipeline (datasheets,
certificates, past bids) so Company Intelligence becomes evidence-backed too;
vendor approvals, equipment, resources, per-country registrations; learned
capability graph. The contract shapes (`CapabilityRecord`, match inputs) are
designed now so this grows without breaking the API.

## 13. Multi-Tenancy

**Decision: shared database + `tenant_id` column + PostgreSQL row-level
security, in both databases.**

- Application layer always filters by tenant (middleware sets tenant context).
- RLS policies on every tenant-owned table as defense-in-depth: a missed WHERE
  clause returns nothing rather than another tenant's data.
- S3 keys are prefixed `tenants/{tenant_id}/...`; engine verifies the prefix
  matches the caller's `X-Tenant-ID`.
- pgvector queries always carry the tenant filter (indexed).
- Enterprise later: the same schema supports dedicated-database or on-prem
  single-tenant deployment (compose bundle with tenant count = 1) without code
  changes. Schema-per-tenant rejected: migration fan-out pain at SaaS scale.

## 14. Client Configuration

Configurable (per tenant, data-driven): branding (logo/colors), terminology
overrides, tender stages/statuses, custom fields on Tender, scoring weights,
AI profile (model tier, private-processing flag), capability model fields,
required approvals, enabled modules, report templates.

Fixed (product opinion, not configurable): the evidence model, the
Layer-1/Layer-2 separation, the core workflow (ingest → extract → comply →
decide), the compliance matrix semantics, tenant isolation, the decision being
human. **The line:** we expose configuration of *vocabulary, weights, and
process steps*; we never expose configuration of *data model semantics or AI
behavior guarantees*. No no-code builder.

## 15. Public API Strategy

V1 (engine): service-token (per-integration API key) auth, `X-Tenant-ID`,
URL versioning (`/api/v1`), async jobs with polling, idempotency keys on
ingest, structured error model `{code, message, details}`, basic per-tenant
rate limits. Only the six tender endpoints + jobs.

Future: OAuth2 client-credentials, webhooks for job completion, per-key scopes
and quotas, OpenAPI-published SDKs, event log for integration debugging.
First integration when needed: **generic email/API ingestion** (an inbox or
webhook that accepts a tender package and creates a tender) — it exercises the
public API exactly as Salesforce/SAP will later, with no vendor coupling.

## 16. Security Foundation

- **Tenant isolation**: tenant_id + RLS + S3 prefix checks + tenant-scoped JWT/session claims; cross-service calls carry tenant explicitly and are verified.
- **Encryption**: TLS everywhere; S3 SSE at rest; Postgres disk encryption at the infra layer.
- **Secrets**: env-injected (compose `.env` in dev, secret manager in prod); never in the repo; provider keys live only in the engine.
- **Permissions**: platform RBAC (admin/bid_manager/contributor/viewer) enforced in DRF permissions; engine trusts only service tokens, never end users.
- **Audit**: django-simple-history on business objects + append-only audit log for decisions (Bid/No-Bid) and permission changes; engine jobs + usage records are the AI audit trail.
- **Source documents**: private buckets, presigned short-lived URLs, no public objects; document access authorized per tender per role.
- **AI provider privacy**: per-tenant AI profile — tenants flagged `private_processing` are only routed to approved endpoints (later: local models); provider calls send document excerpts, never tenant identity; no-training API tiers only. This rule lives in the gateway, one place.

## 17. V1 Build Plan

**Phase 0 — Foundations (this session)**
Objective: repo, contracts, dev environment, conventions.
Backend: monorepo scaffold, Django + FastAPI skeletons, Postgres×2 + Redis + MinIO compose, migrations, service auth.
AI: contracts package, gateway skeleton with routing table + mock provider.
Frontend: Next.js scaffold, design tokens, API client.
Tests: contract round-trip tests, health checks, CI-runnable `make test`.
DoD: `docker compose up` gives login-less dev environment with all services healthy; contracts importable from both services.

**Phase 1 — Slice 1: Tender → Upload → Ingest → Metadata** ✅ delivered
Objective: the first vertical slice works end-to-end.
Backend: Tender/TenderDocument models + API, S3 upload, engine client, ingestion trigger + status.
AI: identification, parsing to blocks, metadata extraction with evidence, jobs.
Frontend: tender list/create, upload, processing status, metadata panel with evidence display.
Tests: parse fixture PDFs (born-digital + scanned + DOCX + XLSX), evidence validation, API tests.
DoD: upload a real ITT PDF → see extracted client/deadline/scope with clickable evidence.

**Phase 2 — Slice 2: Requirements + Evidence viewer** ✅ delivered
Requirements extraction with categories and evidence; document viewer with block highlighting; requirements table UI; needs-review queue.
DoD: 300-page tender yields categorized requirement list, every row opens its source.

**Phase 3 — Slice 3: Compliance Matrix + Company Intelligence (minimal)**
Capability/certification/reference CRUD; match engine; compliance matrix UI with gap highlighting.
DoD: matrix shows compliant/partial/gap/unknown per requirement with rationale.

**Phase 4 — Slice 4: Risk + Fit Score + Bid/No-Bid**
Layer-2 scoring referencing fact ids; risk panel; Bid/No-Bid decision workflow (human, audited); AI assessment summary.
DoD: complete killer workflow demonstrable start to finish.

**Phase 5 — Hardening for first customers**
RAG Q&A assistant, quotas/cost dashboards, RBAC polish, onboarding, backup/restore, deployment runbook.

## 18. First Product Demo

Live, on a real tender package: create tender "Water Treatment Plant — Oman",
drag in a 200-page ITT PDF + BoQ XLSX + a scanned addendum. Watch processing
status. Metadata card fills in (client, deadline, bond, scope) — click the
deadline, the source page opens with the sentence highlighted. Open
Requirements: ~80 extracted, categorized, each with clause + quote. Open
Compliance Matrix: green/amber/red against the demo company's capabilities,
gaps flagged ("ISO 14001 required — not on file"). Risk panel: mobilization
21 days vs. company history 35–45 days ⇒ HIGH, click-through to both facts.
Fit score + AI assessment. Human clicks **No-Bid** with reason — audited.

## 19. Biggest Risks

1. Extraction quality on messy real tenders (scans, tables, appendices) — mitigate with block-level parsing, eval fixtures, needs-review loop.
2. Evidence validation too strict/too loose → trust damage — invest early, measure.
3. LLM cost per tender blows margins — task routing, caching, per-tenant metering from day one.
4. Parsing long documents = slow jobs — async everywhere, page-level progress.
5. Scope creep toward 20 modules before slice 1 is excellent — roadmap discipline.
6. Tenant data leakage — RLS + tests that prove isolation, from Phase 0.
7. Provider/API churn — gateway abstraction, contracts versioned.
8. Docling edge cases — pypdf/openpyxl fallbacks, format-specific fixtures.

## 20. What NOT to Build Yet

Kubernetes, Kafka, microservice mesh, Elasticsearch/OpenSearch, separate vector
DB, data warehouse, billing platform, mobile/native apps, Salesforce/SAP/
Dynamics connectors, SSO (design for it, don't build it), no-code customization,
multi-region, real-time collaboration, the 15 modules beyond the killer
workflow, local model serving, LiteLLM proxy deployment, GraphQL.

## 21. Final Execution Recommendation

- **Start by building:** Phase 0 foundations — monorepo, contracts, Docker dev env, service skeletons.
- **First vertical slice:** Create Tender → upload package → parse → extract metadata with evidence → display.
- **First AI capability:** evidence-backed tender metadata extraction over block-parsed documents.
- **First customer-facing screen:** Tender workspace (upload + processing status + metadata card with clickable evidence).
- **First external API:** `POST /api/v1/tenders/ingest` + `GET /api/v1/jobs/{id}` on the engine.
- **First integration:** generic email/API tender-package ingestion (when Phase 5 arrives) — it proves the public API path all CRM/ERP integrations will use.
- **The most important technical rule we must never break:** *the AI Engine never depends on the platform, and no AI statement exists without traceable evidence — facts carry sources, judgements carry fact IDs, and anything unverifiable is flagged for a human, never invented.*
