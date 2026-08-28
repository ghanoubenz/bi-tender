# QUESTIONS.md — Founder Discovery Questionnaire

Purpose: the founder answers these (any order, one by one, voice or text).
The answers + the platform research + PLAN.md §18 (end-user journey) get
merged into the definitive product plan. ANSWERED 2026-08-28. Answers recorded inline as `A:`. Defaults applied where
the founder deferred are marked `DEFAULT:`.

Context already decided, do NOT re-ask:
- Tenancy is by company, users under each company (built and tested).
- Customization is data-driven per company (templates, capabilities,
  terminology, guidelines) — never a code fork per client. Salesforce-style
  metadata-driven configuration is the model.
- Evidence-first AI, human bid/no-bid decision, honest "no data" states —
  fixed rules in PRODUCT_CONTRACT.md.
- End-user journey north star: PLAN.md §18 / ROADMAP.md.

## A. Company & first customer
Q1. Customer #1 — founder's own company or outside client? Exact industry?
     A: Oil & gas first (B2B). It internally spans construction/electrical; later expand to energy, construction as industries.
Q2. Tenders per month, typical package size (30-page RFQ vs 300-page ITT)?
     A: Global companies up to ~30 tenders/month. Size varies: 1–2 docs up to ~10 documents / 200+ pages.
Q3. First countries/markets? (currencies, date formats, portals)
     A: UAE + GCC first; other countries later.
Q4. Document languages (English/Arabic/mixed)? Arabic RTL UI needed, or later?
     A: UI English-only for now. Documents in ANY language (Arabic, Romanian, Croatian, …) must be auto-translated to English by the engine. Arabic/French UI possible later.

## B. People
Q5. Roles present in one company + headcount per company?
     A: Technical sales, bid managers, legal (~1 seat in big companies), project/financial reviewers. They may pull data onward into their CRM/ERP.
Q6. The main daily user (2h/day person) — who?
     A: Bid manager + technical sales are the daily users.
Q7. The 70-year-old user — view/approve only, or working in it?
     A: C-level/management — dashboard-only viewing (status, results). No hands-on work.
Q8. Who may see pricing/money; who must not?
     A: Pricing visibility configurable per company and per user. Typically technical sales see pricing; management can grant/revoke.
Q9. Mobile needed year one, or desktop-only?
     A: Desktop only for now; mobile later.

## C. Daily journey
Q10. New tender arrives — who looks first, what one decision do they make?
     A: First look = can we even apply (geography, capability, size)? The summary must carry enough (pricing hints, contract details) to make the go/no-go triage. Dashboard must tell them everything.
Q11. Today's time from "tender received" → "we know if we can bid"?
     A: Varies; commonly 1–2 weeks under pressure (teams staying late). Target with the system: ~1 day.
Q12. Most hated part of the current process?
     A: Time pressure + aligning many standards, products and requirements (electrical especially). AI should carry that checking; humans focus on pricing and product choices.
Q13. After submission — done, or track won/lost/why/feedback?
     A: Job done at submission for V1. Later: won/lost + feedback, connected onward to CRM.

## D. Documents & data
Q14. Where do company documents live today (SharePoint/Drive/laptops/paper)?
     A: Scattered; often gate-kept by one person (certs, HSE, marketing materials). One organized place is a core value proposition.
Q15. Are past tenders/proposals available to feed in (last ~20)?
     A: Keep past tenders in the system (some companies retain them for contract disputes). Also a retention/lock-in mechanism.
Q16. Scanned/photographed docs in scope, or all digital?
     A: YES — scanned and photographed documents, even handwritten proposals, must be readable (OCR). Plus: search across all past/future tender documents.
Q17. Pricing lists today — real Excel? Shape (items/units/rates, one or many sheets)?
     A: Mostly Excel; import + AI understanding required. Alternatively manual entry in columns per product/details.

## E. AI boundaries
Q18. Documents to external AI providers over API acceptable? Any
     A: External providers acceptable (companies already trust SAP/Salesforce cloud). Some will demand on-prem. DECISION: default = cloud on no-training enterprise API tiers; per-tenant private-processing flag (already in schema) routes to local models later.
     "never leaves our servers" clients now/later?
Q19. What may AI do completely alone vs needing human approval?
     A: AI prepares everything to the highest accuracy; human reviews/edits and gives final approval, especially at the end. Combination model.
     (summarize / score / draft clarification / SEND clarification / ...)
Q20. Chat assistant ("what's the penalty clause?") — demo must-have or later?
     A: Yes — eventually voice (ElevenLabs/OpenAI-style, like talking to Claude Code) where the assistant configures things. Staged: text chat with citations first; voice later.
Q21. When unsure: silent / "unsure, check this" / guess with warning?
     DEFAULT (founder deferred): show "unsure — check this" and flag for review. Matches Q19 and PRODUCT_CONTRACT.
     (Recommendation and current rule: "unsure, check this".)

## F. Connections
Q22. Company email: Outlook/M365 or Gmail? (decides first inbox integration)
     A: Mostly Outlook (some Gmail). Integration via IT approval. KEY SECURITY DESIGN from founder: only ingest emails from approved senders/categories (e.g. Ariba, specific client addresses) — never read the whole mailbox.
Q23. Actual tender portals used today; which ONE brings most tenders?
     A: SAP Ariba most common; many fragmented portals (ADNOC, aggregators like TendersArabia/MEtenders). Wants broad connectivity eventually. RESEARCH CONCLUSION: nearly all notify by email → email ingestion is the master key; portal APIs later.
Q24. Existing ERP/accounting to integrate eventually (SAP/Oracle/Odoo/none)?
     A: ERP/accounting connection valuable (pull their data). If no connection allowed, provide an import path for ERP data.

## G. Legal module
Q25. One real example of legal searching for specific wording — what, where, why?
     A: Example — find the Algeria contract where a specific tool was used: keyword search across contracts/tenders → jump to contract details + tender requirements. Full-text search with country/client/project filters.
Q26. Legal search over tender docs only, or also own contracts (contract library)?
     DEFAULT (founder unsure): contract library = later phase.

## H. Business
Q27. Charging model gut feeling — per user / per company / per tender analysed?
     A: Per user/month + usage-based AI metering. Tiered models: cheap models for light tasks, frontier (Anthropic) for critical work like legal. (Gateway task-routing + per-tenant metering already built.)
Q28. Who else builds — laptop Claude, ChatGPT, human devs?
     A: Built with Claude only.
Q29. Real date/event for investor demo, or "when strong"?
     A: HARD DEADLINE — investor event in October; demo-ready by SEPTEMBER 15 (answered Aug 28: 18 days).
Q30. First audience — investors or a paying pilot?
     DEFAULT (founder unsure): investors first, per Q29.

## Platform lessons folded into the plan (from research)
1. Salesforce: metadata-driven customization — tenants configure fields,
   screens, rules as data; one engine serves all. We extend configurability
   (templates, terminology, categories, weights) instead of ever forking.
2. Salesforce: kernel vs tenant-content separation → our platform/engine
   split + data-driven templates evolve independently.
3. Odoo: shared master data across modules — company intelligence entered
   once (capabilities, certifications, projects, pricing) feeds scoring,
   compliance, proposals, and later sales/marketing modules.

## Competitor note (researched 2026-08-28)
Ranger AI (rangerrfx.com, San Francisco): agentic platform for industrial
RFP/tendering — Energy, Oil & Gas, MENA focus. $8.4M seed May 2026 (Bonfire
Ventures + 25madison, Inovia, Panache). Claims 50% faster tendering; 1,000+
projects / $3B value; clients incl. Farabi Petrochemical, Celeros Flow.
Read: market validated. Differentiation to hold: (1) evidence-first with
verified clause citations, (2) GCC-native incl. any-language→English,
(3) the engine as an independent API product.
