# ROADMAP.md

The product is built toward one end-user journey, in the founder's words
(full detail: PLAN.md §18):

> Tenders arrive by themselves (email, portals like SAP Ariba). Before anyone
> opens them, the system has already read the documents and checked them
> against what the company has. Each tender shows a fit score — and if we
> lack the data to judge something, that indicator is hidden, never faked.
> Open a tender: AI summary. Generate a checklist: legal, commercial,
> technical, plus clarification questions for the client — answers become
> facts the AI re-uses. Pricing comes from the stored list or an imported
> Excel. A company profile holds brand guidelines and standard documents.
> Generate the proposal: the system says what is missing, then produces
> Word + PDF + an organized ZIP — editable in the platform or in Word.
> The human always makes the bid / no-bid decision.

## Done
- Platform foundation: Payload 3 + Next.js, 13 collections, multi-tenancy,
  evidence-first data model (fixed shape: document/page/clause/quote/method/
  confidence), seeded demo workspace, `npm run doctor`
- Product UI: login, plain-language dashboard ("Needs your attention",
  readiness bars computed from genuinely assessed requirements), tender list,
  tender workspace (overview / documents / requirements+evidence panel /
  compliance / checklist / tasks, honest `soon` placeholders)
- AI Engine (standalone `apps/ai-engine`, 27 tests): ingest → parse to
  blocks → metadata + requirement extraction with verified citations;
  AI gateway with task routing and per-tenant metering

## ⏰ HARD DEADLINE: investor-demo-ready by SEPTEMBER 15, 2026
(Investor event in October. Set 2026-08-28 — 18 days.) Everything below is
sequenced against this date. Demo story: "A tender arrives by email; before
anyone opens it, TenderIQ has read all 200 pages — any language — scored it
against what the company actually has, and prepared the checklist; a human
reviews the evidence and decides. One day instead of two weeks."

Demo countdown (days from 2026-08-28):
- D1–4   M1 Connect the engine + translation step + OCR fixture
- D5–7   Tender Feed + inbound-email ingestion (approved senders only)
- D8–9   Checklist generation (engine → editable → save as template)
- D10–11 Ask-the-tender chat, text, with clause citations
- D12–13 Deploy (Vercel+Neon+Railway) · pricing-visibility roles · C-level view
- D14–16 Demo hardening: real oil&gas fixture package, rehearsed script
- D17–18 Buffer
OUT until after Sept 15 (shown as designed placeholders + roadmap): proposal
generation, pricing Excel import, voice assistant, Outlook deep integration,
portal APIs, CRM sync, contract library, Arabic UI.
Founder to provide: Anthropic API key (live extraction), a real tender
package as demo fixture, hosting accounts (~D12).

## Milestone 1 — Connect the brain  ← CURRENT
Upload a tender package in the platform and watch it analyse itself.
- Platform → engine client (HTTP + contracts only, unchanged boundary)
- Document upload in the workspace → engine ingest → status shown honestly
- Extracted metadata + requirements (method `llm`/`rule`) land in the same
  collections humans fill today; evidence panel unchanged
- Fit score v1: requirements × capabilities matching; components without
  data are hidden, not zeroed; score shows what it is based on
- Verify: upload the fixture ITT → summary, requirements with clause
  citations and a score appear without typing anything

## Milestone 2 — The inbox (tenders arrive by themselves)
- Per-tenant forwarding address; inbound email → attachments become
  documents → tender created → analysed → scored
- Tender Feed screen: every arrived tender with score + one-line summary,
  one click to open; "can't judge yet" state when data is missing
- Portals (SAP Ariba, Etimad, …) plug into the same ingestion API later

## Milestone 3 — Checklist + clarifications
- Generate checklist from the tender's own content (legal / commercial /
  technical / qualification / submission)
- Clarifications: generated questions, tracked draft → sent → answered;
  answers stored as facts (method `human`) that re-scoring uses

## Milestone 4 — Pricing
- Company pricing list: entered in the platform or imported from Excel
  (engine already parses XLSX to tables)
- Pricing tab per tender: items, quantities, units, missing prices flagged

## Milestone 5 — Company profile & document library
- Per-tenant, in settings: brand guidelines, standard documents (HSE,
  company profile, marketing materials), certifications to always include
- Set once, used by every proposal

## Milestone 6 — Generate the proposal
- Preconditions checked and told plainly ("HSE document missing")
- Output: Word + PDF + organized ZIP of all documents
- Editable in the platform or in Word; regeneration keeps human edits safe

## Later
- Founder/admin analytics view (separate subject, by request)
- Portal connectors, SSO, on-prem bundle, local models
- Public engine API for Salesforce/SAP-style clients (engine is already
  independent; this is packaging, auth scopes and docs)
