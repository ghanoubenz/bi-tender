# ROADMAP.md

## Current — Phase 0/1: Foundations + Slice 1
- [x] Architecture decided (ARCHITECTURE.md, DECISIONS.md)
- [x] Monorepo structure, Docker dev environment
- [x] Contracts package (Pydantic v1 contracts + JSON Schema export)
- [x] Platform skeleton: tenants, users, tenders, documents, engine client
- [x] AI Engine skeleton: ingest/jobs API, parsing→blocks, metadata extraction, AI gateway (mock provider in dev)
- [x] Web skeleton: tender list/create, upload, status, metadata + evidence panel
- [ ] Real-provider extraction quality pass on fixture tenders
- [ ] End-to-end demo on a real ITT package

## Next — Phase 2: Requirements + Evidence Viewer
- Requirement extraction (categories, mandatory flags, evidence)
- Document viewer with block/evidence highlighting
- Needs-review queue
- Parsing hardening: scanned PDFs (OCR), ZIP packages, large docs

## Later
- Phase 3: Company Intelligence (minimal) + Compliance Matrix
- Phase 4: Risk, Fit Score, Bid/No-Bid decision workflow
- Phase 5: RAG assistant, quotas & cost dashboards, onboarding, deploy runbook
- Then: email/API ingestion integration → CRM/ERP connectors → SSO → local models
