# QUESTIONS.md — Founder Discovery Questionnaire

Purpose: the founder answers these (any order, one by one, voice or text).
The answers + the platform research + PLAN.md §18 (end-user journey) get
merged into the definitive product plan. Record answers inline under each
question as they arrive; unanswered questions get stated defaults.

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
Q2. Tenders per month, typical package size (30-page RFQ vs 300-page ITT)?
Q3. First countries/markets? (currencies, date formats, portals)
Q4. Document languages (English/Arabic/mixed)? Arabic RTL UI needed, or later?

## B. People
Q5. Roles present in one company + headcount per company?
Q6. The main daily user (2h/day person) — who?
Q7. The 70-year-old user — view/approve only, or working in it?
Q8. Who may see pricing/money; who must not?
Q9. Mobile needed year one, or desktop-only?

## C. Daily journey
Q10. New tender arrives — who looks first, what one decision do they make?
Q11. Today's time from "tender received" → "we know if we can bid"?
Q12. Most hated part of the current process?
Q13. After submission — done, or track won/lost/why/feedback?

## D. Documents & data
Q14. Where do company documents live today (SharePoint/Drive/laptops/paper)?
Q15. Are past tenders/proposals available to feed in (last ~20)?
Q16. Scanned/photographed docs in scope, or all digital?
Q17. Pricing lists today — real Excel? Shape (items/units/rates, one or many sheets)?

## E. AI boundaries
Q18. Documents to external AI providers over API acceptable? Any
     "never leaves our servers" clients now/later?
Q19. What may AI do completely alone vs needing human approval?
     (summarize / score / draft clarification / SEND clarification / ...)
Q20. Chat assistant ("what's the penalty clause?") — demo must-have or later?
Q21. When unsure: silent / "unsure, check this" / guess with warning?
     (Recommendation and current rule: "unsure, check this".)

## F. Connections
Q22. Company email: Outlook/M365 or Gmail? (decides first inbox integration)
Q23. Actual tender portals used today; which ONE brings most tenders?
Q24. Existing ERP/accounting to integrate eventually (SAP/Oracle/Odoo/none)?

## G. Legal module
Q25. One real example of legal searching for specific wording — what, where, why?
Q26. Legal search over tender docs only, or also own contracts (contract library)?

## H. Business
Q27. Charging model gut feeling — per user / per company / per tender analysed?
Q28. Who else builds — laptop Claude, ChatGPT, human devs?
Q29. Real date/event for investor demo, or "when strong"?
Q30. First audience — investors or a paying pilot?

## Platform lessons folded into the plan (from research)
1. Salesforce: metadata-driven customization — tenants configure fields,
   screens, rules as data; one engine serves all. We extend configurability
   (templates, terminology, categories, weights) instead of ever forking.
2. Salesforce: kernel vs tenant-content separation → our platform/engine
   split + data-driven templates evolve independently.
3. Odoo: shared master data across modules — company intelligence entered
   once (capabilities, certifications, projects, pricing) feeds scoring,
   compliance, proposals, and later sales/marketing modules.
