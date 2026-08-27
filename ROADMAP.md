# ROADMAP.md

## Current — Phase 2 complete: Requirements + Evidence Viewer
- [x] Requirement extraction with categories, mandatory flags and evidence
- [x] Engine `POST /api/v1/tenders/extract-requirements` + requirement listing/filters
- [x] Platform requirement mirror with human review workflow (audited)
- [x] Requirements table UI: category filter, needs-review queue, accept/reject
- [x] Evidence viewer: citation → source block, quote highlighted in context
- [ ] Scanned-PDF OCR + ZIP tender packages
- [ ] Live-LLM extraction quality pass with eval fixtures on real tenders

## Next — Phase 3: Company Intelligence (minimal) + Compliance Matrix
- CompanyProfile / Capability / Certification / ProjectReference CRUD
- Match engine: requirements x capabilities -> ComplianceResult
- Compliance matrix UI with gap highlighting and evidence on both sides

## Later
- Phase 4: Risk, Fit Score, AI assessment, Bid/No-Bid intelligence
- Phase 5: RAG assistant, quotas & cost dashboards, onboarding, deploy runbook
- Then: email/API ingestion integration -> CRM/ERP connectors -> SSO -> local models

## Completed
- Phase 0: architecture, contracts, dev environment, CI
- Phase 1: tender -> upload -> parse -> evidence-backed metadata -> UI
