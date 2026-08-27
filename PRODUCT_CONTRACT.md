# PRODUCT_CONTRACT.md — Rules the product must never violate

These are product guarantees. Code review blocks any change that breaks one.

1. **Never invent tender facts.** Every Layer-1 fact is extracted from source
   documents. If it cannot be determined reliably, the value is null/unknown
   and flagged `needs_review` — never guessed.
2. **Always preserve source evidence.** Every extracted fact stores document,
   page, section/clause, quote, confidence, and extraction method. Evidence is
   validated against the actual source text on write.
3. **Every evaluation traces back to evidence.** Layer-2 outputs (risk, fit
   score, compliance rationale, assessments) must reference the Layer-1 fact
   IDs they are based on. No free-floating judgements.
4. **Tenant data never crosses boundaries.** Every tenant-owned row carries
   tenant_id, RLS is enabled, storage keys are tenant-prefixed and verified,
   retrieval queries are tenant-filtered. No cross-tenant caches or prompts.
5. **AI does not make the final Bid/No-Bid decision.** The AI recommends; a
   human decides, and the decision is audited with who/when/why.
6. **Private-processing tenants never reach external AI providers.** The AI
   Gateway enforces routing policy per tenant; a tenant configured for
   private/local processing is only served by approved endpoints. This check
   lives in the gateway and cannot be bypassed by callers.
7. **The AI Engine never depends on the platform.** No platform imports, no
   platform DB access. Contracts + HTTP only. The engine must remain usable by
   any external system.
8. **Facts and judgements are never mixed in one uncontrolled prompt.**
   Extraction (Layer 1) and evaluation (Layer 2) are separate, auditable steps.
