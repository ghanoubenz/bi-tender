# CONTEXT.md — What was decided, and why

**Read this first if you are a Claude session picking up this project.** Claude
has no memory between sessions, so this file is the memory. It records the
reasoning behind the code, the course-corrections already made, and how the
founder wants to work. Not doing so means repeating mistakes he has already
paid for.

Order to read: **CONTEXT.md** (this) → PLAN.md → ROADMAP.md →
PRODUCT_CONTRACT.md → DESIGN.md → DECISIONS.md (ADRs) → QUESTIONS.md.

---

## 1. Who this is for and how he works

The founder is a **non-developer domain expert** in GCC oil & gas tendering.
He is the product owner and reviewer, not an operator of tools.

**Working agreement, stated by him directly:**
> "I don't do anything you tell me about commands. I only review. The rest you
> do — everything."

That means:
- **Do not send him terminal commands.** Do the work yourself and report.
- **Show, don't tell.** He judges from screenshots and running software, not
  from descriptions or test output.
- **Never say something works because it compiled.** Run it, look at it.
- Give him a URL or an image wherever possible.

He speaks by voice, so his messages arrive as long transcriptions with
transcription noise. Read for intent; ask when a reading would change the work
materially, otherwise decide and say what you assumed.

## 2. What the product is

**TenderIQ — AI Tender Intelligence & Bid Management**, for companies bidding
on large tenders. First market: **oil & gas, UAE + GCC**. B2B.

The complete end-user journey he described is recorded verbatim in
**PLAN.md §18**. In short: tenders arrive by themselves (email, portals like
SAP Ariba) → the system has already read them and scored them against what the
company has → open one and get a summary → generate a checklist and
clarification questions → pricing → generate the proposal (Word/PDF/ZIP) →
**a human always makes the bid/no-bid decision.**

Two products, deliberately separate:
- **Phase A, the platform** (`apps/platform`) — Payload 3 + Next.js. A working
  product on its own; people can run a full tender workflow by hand today.
- **Phase B, the AI Engine** (`apps/ai-engine`) — standalone FastAPI service,
  27 tests passing. Parses documents and extracts requirements with verified
  citations. **Runs without the platform** and is callable by any external
  system (Salesforce, SAP). This independence is a hard architectural rule.

**The engine is not yet connected to the platform.** That is Milestone 1.

## 3. Course-corrections already made — do not re-litigate

**Django → Payload.** The platform was first built on Django + DRF and worked
(13 tests green). The founder then directed a rebuild on Payload 3 + Next.js,
because he wants to spend his effort on the AI engine, not on rebuilding CRM
plumbing. The Django version survives at `apps/platform-legacy` as a reference
and is deleted once Payload reaches parity. **Do not propose returning to
Django.** The AI engine and contracts survived the pivot untouched — which is
exactly what the platform/engine boundary was for.

**Sockets before plugs.** Phase 1 is not a mock-up waiting for AI. It is a
genuinely working product where people do the work by hand, using the *same
data shapes* the AI will later fill. A human-entered requirement records
`method: 'human'`; the engine later writes `method: 'llm'` into the identical
fields. **Nothing gets rebuilt when the AI arrives.** Never introduce a
separate "AI version" of a field, screen or table.

**Customization is data, never a fork.** Every client runs the same system.
Onboarding a pipeline company vs a construction company means loading their
checklist templates, capabilities and terminology as *data*. Modelled on
Salesforce's metadata-driven architecture. **Never write client-specific code
branches.** But also: we stay opinionated — no general no-code builder.

**Honesty over decoration.** A real bug found and fixed: tenders with nothing
assessed showed an empty progress bar, which silently claims *0% ready* — a
different statement from *nobody has checked*. Those now say so in words. The
founder stated this rule himself: if we lack the data to judge something, hide
the indicator rather than fake it.

## 4. Hard deadline

**Investor-demo-ready by 15 September 2026** (investor event in October; set
28 August 2026). ROADMAP.md carries the day-by-day countdown and the explicit
out-of-scope list. Anything proposed must answer: does this make the September
15 demo stronger?

## 5. Competitor

**Ranger AI** (rangerrfx.com) — San Francisco, $8.4M seed May 2026, agentic
RFP/tendering platform for energy and oil & gas, MENA focus. Read it as market
validation, not a threat. Our differentiation, in order:
1. **Evidence-first** — every fact carries page, clause and verbatim quote,
   validated against the source. Hard to retrofit; central to trust in a
   domain where a missed requirement disqualifies a bid.
2. **GCC-native** — including any-language-in → English-out.
3. **The engine as a separate API product** they do not appear to have.

## 6. Things that wasted time — avoid repeating

- **The founder's laptop is not reachable from a cloud session.** Several
  rounds were lost sending him localhost commands. If work must be visible to
  him, either deploy it or publish a preview; do not ask him to run a server.
- **`.env.example` shipped with empty values**, so the first command a new
  developer ran failed with "missing secret key". Any example config must work
  when copied as-is.
- **Payload's official template tracks unreleased code.** It shipped
  `workspace:*` dependencies, `createFolderField`/`createTagField` and
  `generatePayloadViewport`, none of which exist in the released 3.88. Pin real
  versions and regenerate the import map.
- **`/admin` is Payload's back office, not the product.** He landed there
  repeatedly and thought it was the app. There is now a labelled banner and a
  build stamp in the sidebar (`src/lib/version.ts`) — bump it whenever a change
  should be visible, so "I don't see the change" is a one-second check.

## 7. Where things stand

Working and verified in a browser: login; dashboard (plain-language, hero
deadline card, honest readiness bars, pipeline chart); tender list with
readiness; tender workspace with ten tabs and the evidence panel; companies,
contacts, capabilities, tasks, templates; create tender, add requirement with
citation, upload document, record bid/no-bid decision, add task. Seeded with a
GCC oil & gas demo workspace (Falcon Energy Services bidding to ADNOC, PDO,
KOC, QatarEnergy).

Not built: the AI engine connection, email ingestion, checklist generation,
pricing, proposal generation, deployment. See ROADMAP.md.

## 8. Standing rules

1. Evidence-first: never invent a tender fact; unknown stays unknown and gets
   flagged (PRODUCT_CONTRACT.md is binding).
2. The AI never makes the bid/no-bid decision.
3. Tenant isolation is absolute — scope every query by the signed-in user's
   company.
4. The AI Engine never imports from the platform. Contracts + HTTP only.
5. Unbuilt features are shown honestly as `soon`, never hidden, never faked.
6. Commit at every stable milestone with a real message. Push when asked.
