# PLAN.md — Tender Intelligence: Phase A/B Implementation Plan

Status: **Approved plan, pre-implementation** · Updated: 2026-08-27
Audience: any Claude session (cloud or laptop) or developer joining this repo.
Read this file first. Then `ARCHITECTURE.md`, `DECISIONS.md`, `ROADMAP.md`,
`PRODUCT_CONTRACT.md`.

---

## 0. Where the project stands right now

The repo currently contains work from an earlier architecture iteration
(Django platform). The current directive **replaces the Django platform layer
with Payload 3 + Next.js**; the AI Engine and contracts are unchanged.

| Component | Status | Disposition |
|---|---|---|
| `apps/ai-engine` (FastAPI) | ✅ Built + 27 tests green. Ingest → block parsing → evidence-validated metadata + requirement extraction, AI gateway (task routing, metering), jobs, tenant isolation | **KEEP — this is Phase B1/B2, already delivered** |
| `packages/contracts` (Pydantic + JSON Schema) | ✅ Built + 7 tests green | **KEEP** |
| `apps/platform` (Django + DRF) | ✅ Works, 13 tests green | **RETIRE at A2** — until then it is the working reference for engine-sync logic, review-state preservation, decision audit |
| `apps/web` (plain-CSS Next.js) | ✅ Works | **REPLACE** — superseded by the new Payload+Next.js app with a real design system |
| Docs (`ARCHITECTURE.md` etc.) | Written for the Django iteration | Update as A0 lands |

Two commits exist on branch `claude/tender-platform-architecture-rhcmrw`.
**⚠ If GitHub push is still failing (403 / Claude GitHub App not installed),
pushing this work is the first task of any session. See §16.**

---

## 1. Architecture Decision (CONFIRMED)

- **Phase A**: Payload 3 + Next.js + PostgreSQL — one Next.js application
  containing Payload (admin at `/admin`, internal only), the customer UI, and
  the platform API.
- **Phase B**: independent FastAPI Tender AI Engine (already built).

Payload verification (2026-08): MIT license (irrevocable; product stays
proprietary); Figma acquired Payload June 2025 but the MIT repo is unchanged
and v3 actively maintained (v4 in development); official Postgres adapter
(`@payloadcms/db-postgres`); built-in auth + API keys; collection/field-level
access control; official `@payloadcms/plugin-multi-tenant`; uploads with S3
storage adapters; REST + GraphQL + typed Local API; native Jobs Queue;
self-hosting is the standard path. **No blocker. Proceed.**

Hard rules (unchanged, enforced by tests):
1. No Payload imports in the AI Engine; no cross-database queries. Contracts + HTTP only.
2. Phase A runs fully with `ENGINE_GATEWAY_MODE=mock`.
3. Phase B test suite runs with no platform present.
4. Evidence-first AI per `PRODUCT_CONTRACT.md` (never guess; unknown → needs review; judgements cite fact ids).
5. Bid/No-Bid decision is human and audited.

## 2. Architecture Diagram

```
                              CUSTOMER / INVESTOR → app.<product>.com
                                      │
      ┌───────────────────────────────▼────────────────────────────────┐
      │   PHASE A — apps/platform (ONE Next.js app, hosted on Vercel)  │
      │   Customer UI (design system) · Payload (auth/tenants/RBAC/    │
      │   collections/uploads/jobs) · /admin internal-only             │
      │              │ engine-client (HTTPS + contracts only)          │
      └──────────────┼─────────────────────────────────────────────────┘
        Neon Postgres│(platform DB)      Cloudflare R2 (documents)
                     │ service token + X-Tenant-ID
      ┌──────────────▼─────────────────────────────────────────────────┐
      │  PHASE B — apps/ai-engine (FastAPI on Railway)                 │
      │  api.<product>.com — callable WITHOUT Phase A                  │
      │  ingest · parse→blocks · extract · evidence-validate ·         │
      │  checklist gen · compliance · risk · Q&A · jobs                │
      │  AI GATEWAY: task routing · retries · per-tenant metering      │
      └───────┬──────────────┬─────────────────────────────────────────┘
       Neon Postgres         └ LiteLLM SDK → OpenAI · Anthropic · Gemini
       (ai_engine + pgvector)             → local models (later)

      FUTURE CLIENTS of the same engine API: Salesforce · SAP · Oracle ·
      Dynamics · Outlook/M365 · SharePoint · Gmail · portals · custom ERP/CRM
```

## 3. Payload Data Model

**V1 (11 collections):**
`tenants` (branding, terminology, settings) · `users` (auth; roles
admin/bid-manager/contributor/viewer) · `companies` (client+competitor flag) ·
`tenders` (**the center**: stage, deadline, decision+who/when/why, ai_metadata
contract payload) · `tender-documents` (upload collection; engine ids,
ingestion status) · `requirements` (mirror of engine facts + review workflow
state — engine owns facts, platform owns workflow) · `checklist-templates` ·
`tender-checklists` (instance per tender; AI-proposed flags) · `capabilities`
(one collection, `kind: capability|certification|project-reference`) ·
`tasks` · `ai-jobs` (mirror for the dashboard AI panel).

**Later:** contacts, compliance-items (B4), clarifications (B5),
pricing-sheets (B6), legal-findings (B7), proposals (B8), activities,
integrations.

## 4. Platform Information Architecture

Sidebar (full vision visible day one; unbuilt modules are designed
"coming soon" states, never broken links):

- **Overview**: Dashboard
- **Intelligence**: Tender Feed · My Tenders (Opportunities later)
- **Tenders**: list → **Tender Workspace** tabs: Overview · Documents ·
  Checklist · Requirements · Compliance · Risks · Q&A · Decision
  (+ designed placeholders: Pricing · Legal · Clarifications · Proposal ·
  Submission · Activity)
- **Company**: Companies · Capabilities · Certifications · References
- **AI**: Assistant · Checklist Builder · Analysis Jobs
- **Manage**: Tasks · Templates · Team (Analytics later)
- **Settings**: Workspace · Users & Roles · Branding (Integrations later)

## 5. Design Direction

Linear/Twenty-class enterprise SaaS, not CMS-class. Design tokens FIRST
(spacing scale, type scale on Inter/Geist, neutral slate palette + one
restrained accent + semantic status colors, 1px borders over shadows, high
density). Tailwind + shadcn/ui customized — never default theme. Signature
interactions: split tender workspace with sticky **evidence panel** (click any
AI statement → source page, quote highlighted); honest staged AI-processing
states; designed empty states that sell the vision. No gradients, no
glassmorphism, no AI-sparkle. Review test for every screen: *would this look
at home in a Linear screenshot?* See §15 for the design skills to install.

## 6. Deployment & Environments  ⬅ NEW

**Principle:** `git push → working online version`. Every major feature is
verifiable by the founder at a real URL, never only in a dev container.

| Concern | Decision | Why |
|---|---|---|
| **Source control** | GitHub `ghanoubenz/bi-tender` = canonical. Branches: `main` = production, `develop` = integration, `feat/*` = feature branches → PR previews | Simple, standard, preview-per-PR |
| **Phase A hosting** | **Vercel** (root directory `apps/platform`) | Native Next.js/Payload; automatic preview deployment per push/PR; production on `main` |
| **Phase B hosting** | **Railway** (Dockerfile deploy of `apps/ai-engine`) | Container-friendly, no request timeout limits (long parsing jobs), private env vars, simple pricing; Render is the fallback if flat pricing preferred |
| **PostgreSQL** | **Neon** — two databases: `platform`, `ai_engine` (pgvector enabled) | Serverless Postgres, generous free tier, **branch-per-preview pairs with Vercel previews** (each preview gets an isolated DB branch), works for both A and B |
| **Object storage** | **Cloudflare R2** via `@payloadcms/storage-s3` (S3-compatible) | Zero egress fees — the engine (Railway) repeatedly fetches documents cross-cloud, so egress cost matters; not locked to Vercel; on-prem later swaps to MinIO with the same S3 API |
| **Local development** | localhost + Docker compose where useful (Postgres/MinIO), or Neon dev branch. Engine in `mock` gateway mode by default | |
| **Preview/staging** | Vercel preview URL per PR + Neon DB branch; engine: shared staging service on Railway (`api-staging`) | Founder tests every feature here before merge |
| **Production** | `app.<product>.com` (Vercel, `main` only) + `api.<product>.com` (Railway, deploys on `main`) | Investor demo environment — only merged, verified changes reach it |
| **CI/CD** | GitHub Actions: contracts+engine+platform tests + web build on every push (exists, extend for Payload app). Vercel/Railway auto-deploy on push; production promotes only from `main` | |
| **Secrets** | Vercel/Railway env var dashboards + GitHub Actions secrets. `.env.example` documents every variable. Provider AI keys live ONLY in the engine. Never committed | |
| **Health/observability** | `/health` on both services (exists on engine; add to platform); Vercel + Railway built-in logs; Sentry free tier when first external user arrives — no more DevOps than this | |

**Manual verification process (binding rule):** a customer-facing feature is
"complete" only when: (1) automated tests pass, (2) it is deployed to a
preview URL, (3) the plan's *"Verify:"* step for that feature has been given
to the founder (exact URL + steps + expected result), and (4) the founder has
confirmed it. "Tests passed" alone never closes a visible feature.

**Flow:** feature branch → push → CI + Vercel preview (+ Neon branch) →
founder tests at preview URL → merge to `main` → production auto-deploy.

**Engine independence proof in production:** `https://api.<product>.com/api/v1/...`
must answer a curl with a service token, with Phase A completely uninvolved.
Security when public: service tokens per client, per-tenant rate limits,
request size caps, CORS locked down, no unauthenticated AI endpoints ever.

## 7. Phase A Plan

**A0 — Foundation, Design System & Deployment (2–3 sessions)**
Objective: Payload app scaffolded, design tokens real, **CI/CD live**.
- **Gate (see §16): GitHub push must work before A0 starts.**
- Repo: `apps/platform` (new Payload+Next.js app), branch strategy
  (`main`/`develop`/`feat/*`), CI extended.
- Deployment: Vercel project + preview deployments + production config; Neon
  (2 DBs, pgvector); R2 bucket + storage adapter; Railway service for the
  engine; env var management; deployment docs (`docs/DEPLOYMENT.md`);
  `/health` on both services; error logging.
- Payload: Postgres adapter, multi-tenant plugin, all §3 collections, access
  control, seed script (demo tenant, users, 6 tenders, companies, checklist
  template, tasks).
- Frontend: design tokens, Tailwind+shadcn, app shell (sidebar, topbar),
  core primitives (badge, table, card, tabs).
- **Verify:** open the Vercel preview URL → log in as demo user → branded
  shell + seeded data; `https://api-staging.../health` returns ok from curl.

**A1 — Investor-Grade Shell (3–4 sessions)**
Every navigation destination polished on seeded/sample data: Dashboard,
Tender list, full Tender Workspace with all tabs (requirements/compliance/
checklist sample data + working evidence panel), Companies, Capabilities,
Tasks, Templates, AI Jobs, Settings. Playwright walkthrough of demo path.
**Verify:** click through the entire §13 demo script on the preview URL —
it looks like a company, not a project.

**A2 — Real Platform Core (2–3 sessions)**
Real auth/roles enforced; tender+company CRUD; uploads to R2; tasks; audit via
Payload versions. Django platform retired here (delete `apps/platform`-django
+ `apps/web` after parity check).
**Verify:** create a second tenant + user on preview; log in as each; prove
zero crossover; viewer role cannot edit.

**A3 — Live AI Pipeline (2–3 sessions)**
Engine-client (port of proven Django sync logic) as Payload jobs; ingestion →
metadata → requirements mirror with review-state preservation; evidence panel
against real engine blocks; audited Bid/No-Bid.
**Verify:** on preview, upload fixture ITT → staged processing → metadata
fills → requirements appear → click clause 7.3.2 → source highlighted →
accept/reject → No-Bid with reason → audited.

## 8. Phase B Plan

- **B1 AI Foundation: ✅ done** (remaining: ZIP packages, scanned-PDF OCR via
  docling, storage-key ingest from R2).
- **B2 Requirement Extraction: ✅ done** (remaining: live-LLM quality pass +
  eval fixtures on real tenders).
- **B3 Checklist Builder** (after A1): `POST /api/v1/checklists/generate` —
  engine proposes sections/items from parsed structure + requirement
  categories; platform renders → human edits → saves as reusable template.
  The agent configures **data, never schema**.
- **B4 Company Intelligence + Compliance**: capability contracts; match engine
  → per-requirement ComplianceResult (compliant/partial/gap/unknown +
  rationale + fact ids); compliance matrix UI replaces sample data.
- **B5 Q&A + Risks**: pgvector RAG with citations (`grounded:false` surfaced
  honestly); Layer-2 risk items referencing fact ids.
- **B6 Pricing** → **B7 Legal** (always clause-cited; never presented as
  legal advice) → **B8 Proposal** (structure + preparation only).

## 9. API Contract (A ↔ B)

Live today at `/api/v1` (service token + `X-Tenant-ID`, async jobs + polling,
idempotency keys, `{code,message,details}` errors, Pydantic contracts with
exported JSON Schemas → TS types):
`POST /tenders/ingest` · `POST /tenders/extract-requirements` ·
`GET /jobs/{id}` · `GET /tenders/{ref}/requirements` ·
`GET /documents/{id}/blocks`.
B3–B5 add: `POST /checklists/generate` · `POST /compliance/analyze` ·
`POST /risks/analyze` · `POST /query`. Later: job-completion webhooks (kills
polling), OAuth2 client-credentials, per-key scopes/quotas.

## 10. Multi-Tenancy

`@payloadcms/plugin-multi-tenant`: tenant field on every collection; access
control filters every operation by the user's tenant; super-admin via internal
`/admin` only. R2 keys `tenants/{id}/…`, verified. Engine already
tenant-scoped with isolation tests. Postgres RLS added at the
enterprise/on-prem milestone. On-prem later = compose bundle (Payload app +
engine + Postgres + MinIO), tenant count 1.

## 11. Configuration / Templates

Configurable (data, per tenant): branding, terminology map, tender stages,
checklist templates, capability categories, scoring weights (B4+), enabled
modules, AI profile (model tier, private-processing flag), approvals.
Fixed (product opinion): evidence model, Layer-1/2 separation, workflow shape,
compliance semantics, tenant isolation, human decision.
**Line: we expose vocabulary, weights and process steps — never data-model
semantics or AI-behavior guarantees. No no-code builder.**

## 12. Investor MVP Definition

Must really work: login/roles, dashboard on real data, tender CRUD, upload,
real engine pipeline (parse → metadata → requirements with verified evidence),
evidence viewer, review queue, checklist (template + AI-proposed), audited
Bid/No-Bid, tenant isolation, **live at app.<product>.com**.
May be mocked/sample: compliance matrix + matching (until B4), risks (until
B5 for real), Q&A canned (until B5), Pricing/Legal/Proposal/Analytics
placeholders, integrations page.
Never mocked deceptively: anything presented as "extracted from this
document" genuinely comes from it.

## 13. Demo Script (~8 min)

1. Login → branded dashboard (30s) — "an operating platform, not a chat window."
2. Tour an existing tender workspace (1m).
3. Create tender, upload real ITT PDF + BoQ XLSX → staged processing (1m).
4. Metadata fills → click deadline → **source page, sentence highlighted** (1m).
5. Requirements: categorized, mandatory flags, clause refs; evidence click;
   needs-review queue; accept one (1.5m) — "the AI never guesses."
6. Checklist: AI-proposed, edit, save as template (1m).
7. Compliance matrix + gaps + risk panel (1m; sample data, said plainly if asked).
8. Ask assistant "What is the bid validity?" → cited answer (30s).
9. Human No-Bid with reason → audited (30s).
10. "Everything you saw is one client of an independent API" → show
    api.<product>.com OpenAPI docs; curl it live (30s).

## 14. Risks (8)

1. Platform layer built twice (Django→Payload) — contained: engine/contracts survive; A0–A3 must be disciplined.
2. Payload direction under Figma — MIT + plain Postgres + engine boundary cap the risk; v4 migration watched.
3. Design bar under-delivery — tokens-first A0, Linear-screenshot test, design skills (§15).
4. Extraction quality on messy real tenders — eval fixtures, review loop, vetted demo documents.
5. Demo credibility — one hallucinated extraction kills the thesis; evidence validation is non-negotiable.
6. Scope gravity (12 workspace tabs) — placeholders are a feature.
7. Tenant leakage — isolation tests mandatory in CI on both sides.
8. LLM cost/latency live — routing + metering exist; quotas before any pilot.

## 15. Recommended Skills to Install  ⬅ NEW

Install in this repo (`.claude/skills/` or via `npx skills add <repo>`), so
every Claude session working here benefits:

| Skill | Source | Use for | Priority |
|---|---|---|---|
| **ui-ux-pro-max** | github.com/nextlevelbuilder/ui-ux-pro-max-skill | A0 design-system generation + anti-pattern validation (50+ styles, 161 palettes, 57 font pairings). Use it to *generate and critique* our token system; we stay opinionated (§5) — no glassmorphism presets | **High — before A0 frontend work** |
| **frontend-design** (Anthropic) | anthropics/skills marketplace | Steers output away from generic "AI aesthetic" toward distinctive production UI; complements the above during A1 screen building | **High** |
| **web-artifacts/dataviz discipline** | built-in `dataviz` skill (already available) | Dashboard stat tiles, compliance/analytics charts — consistent, accessible chart system | Medium — at A1 dashboard |
| **nextjs-app-router-patterns / nextjs-best-practices** | community (claudeskills.info directory) | Payload 3 lives in the App Router; keeps server/client component boundaries and caching idiomatic | Medium — A0/A1 |
| **Karpathy behavioral skill** | community (most-starred behavioral skill) | Enforces: verify assumptions, minimal diffs, no unrelated changes, validate before execution — useful guardrail for laptop sessions | Medium |
| **security-review** | built-in (already available) | Run before exposing api.<product>.com publicly and before the investor demo | High — end of A2 |
| **code-review / simplify** | built-in (already available) | Before each milestone merge to `main` | Medium |

Skills to skip: generic "SaaS boilerplate generators" (fight our architecture),
anything that scaffolds its own auth/db (Payload owns that), no-code UI
builders (we are opinionated by design).

## 16. GitHub-First Rule (BINDING)

We already lost-risked work in an ephemeral container. Therefore:
1. Before A0 implementation: confirm `git push` works to
   `ghanoubenz/bi-tender` (Claude GitHub App installed / GitHub reconnected
   in claude.ai settings).
2. Push the existing branch `claude/tender-platform-architecture-rhcmrw`
   (contains Phases 0–2 + this plan).
3. Confirm the remote branch shows the commits and `git status` is clean.
4. GitHub is canonical from then on; commit + push at every stable milestone.
5. **If GitHub access is unavailable: STOP. Do not produce substantial new
   work that exists only in a disposable environment.**

## 17. Build Order (execute in exactly this order)

1. **Gate**: GitHub push works; existing branch pushed (§16).
2. **A0** — Payload scaffold + collections + multi-tenant + seed + design
   tokens + app shell **+ Vercel/Neon/R2/Railway wired + preview deploys**.
3. **A1** — investor shell, all screens on sample data (install design skills first).
4. **A2** — real auth/tenants/RBAC/CRUD/uploads; retire Django + old web app.
5. **A3** — live engine pipeline in the workspace.
6. **B1/B2 completion** — ZIP + OCR ingest, live-LLM extraction pass + evals.
7. **B3** — checklist generation + template save.
8. **MVP hardening** — Playwright demo suite, seed polish, security-review,
   demo runbook → **investor-ready milestone** (production promoted).
9. **B4** — compliance matrix real. 10. **B5** — Q&A + risks real.
11. Then B6 → B7 → B8, webhooks, first external integration (email/API ingestion).

---

### Working agreements for any session picking this up
- Never claim a visible feature is done without the founder verifying it at a
  preview/production URL (see §6 manual verification process).
- Keep `DECISIONS.md` (ADRs), `ROADMAP.md` (current/next/later),
  `PRODUCT_CONTRACT.md` (inviolable AI rules) up to date.
- Commit at stable milestones; push always; run the actual app before
  reporting; every feature report includes a "Verify:" block with exact URL,
  steps, and expected result.

---

## 18. The End-User Journey (North Star — added after founder session)

This section records the founder's description of how the product must work
for the end user. Every milestone in ROADMAP.md serves this journey.

1. **Tenders arrive by themselves.** The user's email and tender portals
   (e.g. SAP Ariba) are connected; incoming tenders land in one place.
2. **The system has already done the job** before anyone opens them: parsed
   the documents, compared them against the company's data (capabilities,
   certifications, tools/equipment, past projects).
3. **Fit score per tender** — "70%, you can apply". Honesty rule: a score
   component with no underlying data (e.g. tool availability unknown) is
   hidden entirely, never shown as a fake number or colour.
4. **Open a tender → AI summary**: what it is, what the client wants.
5. **Generate checklist** → legal, commercial, technical items, plus
   clarification questions for the client. Answers to clarifications are
   recorded as facts and the AI re-uses them in its analysis.
6. **Pricing** must exist before proposal generation: either the stored
   pricing list, or an Excel import the system reads and structures.
7. **Company profile** (per tenant, kept in settings, not in the user's
   face): brand guidelines, standard documents (HSE, company profile,
   marketing materials), certifications to always include.
8. **Generate proposal**: the system first says what is missing, then
   produces Word + PDF and an organized ZIP of all documents; editable in
   the platform or in Word.
9. **The human decides** bid / no-bid — always (PRODUCT_CONTRACT rule 5).
10. Admin/owner view is a separate, later subject.

Customization stance, restated plainly: every client runs the same system.
Onboarding a pipeline client vs a construction client means loading their
templates, products, capabilities and guidelines as data — never writing a
separate code version per client.
