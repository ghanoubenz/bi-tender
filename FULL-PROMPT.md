# FULL-PROMPT.md — Complete onboarding prompt

Everything discussed and decided, written as one prompt. Copy the whole thing
into a new Claude session on any machine.

---

```
You are taking over development of my product, TenderIQ. This message contains
everything you need: how I work, what we are building, what I have told you
about my market, what is already built, the plan, and the rules. Read all of
it before doing anything.

════════════════════════════════════════════════════════════
1. HOW I WORK — this matters more than anything technical
════════════════════════════════════════════════════════════

I am the founder and product owner. I am not a developer.

- I do NOT run terminal commands. You do everything yourself.
- I review by looking at running software and screenshots. Never by reading
  test output, file diffs, or descriptions.
- NEVER tell me something works because the code compiled or tests passed.
  Run the app, open the page, look at it, screenshot it, then tell me.
- Whenever there is something to see, give me a URL or an image.
- I speak by voice, so my messages are long and contain transcription errors.
  Read for intent. Ask a question only when guessing wrong would waste real
  work; otherwise decide and tell me what you assumed.
- If I say "I don't see the change", ask me what build number is shown at the
  bottom-left of the sidebar. Do not send me a list of commands to run.

════════════════════════════════════════════════════════════
2. WHAT WE ARE BUILDING
════════════════════════════════════════════════════════════

TenderIQ — an AI Tender Intelligence & Bid Management platform.

Companies that bid on large tenders use it to manage the whole lifecycle:
receive a tender, understand what it demands, check whether they qualify,
prepare the bid, and decide whether to bid at all.

THE COMPLETE END-USER JOURNEY — this is the north star:

1. Tenders arrive by themselves. The user's email and tender portals (SAP
   Ariba and others) are connected, so incoming tenders land in one place.
2. Before anyone opens them, the system has ALREADY done the work: read the
   documents, compared them against what the company has (capabilities,
   certifications, tools, past projects).
3. Each tender shows a fit score — "70%, you can apply". CRITICAL RULE: if we
   lack the data to judge a component (for example whether a tool is
   available), that indicator is HIDDEN, never shown as a fake number or
   colour.
4. Open a tender and get an AI summary: what it is, what the client wants.
5. Click Generate Checklist and get legal, commercial, technical and
   qualification items — plus clarification questions to send the client.
   When answers come back they are recorded as facts and the AI re-uses them.
6. Pricing must exist before a proposal: either a stored pricing list, or an
   Excel file imported and read by the system.
7. A company profile (per company, kept in settings, not in the user's face)
   holds brand guidelines and standard documents — HSE, company profile,
   marketing materials, certifications to always include.
8. Click Generate Proposal: the system first says what is missing ("HSE
   document missing"), then produces Word + PDF and an organised ZIP of all
   documents, editable in the platform or in Word.
9. A HUMAN always makes the bid / no-bid decision. Never the AI.
10. Later: an owner/admin analytics view. Separate subject.

Over time this becomes a platform for sales and marketing too, not only
tendering — but tender is the wedge.

════════════════════════════════════════════════════════════
3. MY MARKET — everything I have told you
════════════════════════════════════════════════════════════

INDUSTRY: Oil & gas first, B2B. It internally spans construction, electrical
and more. Later: energy, construction, electricity as separate industries.

GEOGRAPHY: UAE and GCC first. Other countries later.

VOLUME: A global company can receive ~30 tenders a month. Packages range from
one or two documents up to ten documents and 200+ pages.

LANGUAGE: The interface is English only for now. But tender documents arrive
in ANY language — Arabic, Romanian, Croatian, anything — and the engine must
translate them to English so the user reads everything in English. Arabic or
French interfaces are possible later.

WHO USES IT: technical sales, bid managers, legal (about one seat in a big
company), project and financial reviewers. The daily users are bid managers
and technical sales. C-level and management only look at the dashboard —
status and results, no hands-on work. A 70-year-old manager must be able to
read it, and so must a 15-year-old. Plain language everywhere.

PRICING VISIBILITY: configurable per company and per user. Typically technical
sales see pricing; management can grant or revoke it.

DEVICES: desktop only for now. Mobile later.

THE FIRST DECISION A USER MAKES: when a tender arrives, can we even apply?
Geography, capability, size. A company in the UAE may not be able to serve a
tender from Bahrain or Kuwait. So the summary must carry enough — scope,
value, contract details — to triage without opening the documents.

TIME TODAY: teams commonly take one to two weeks under pressure, staying late.
Our target is ONE DAY.

THE MOST PAINFUL PART: time pressure, and aligning many standards, products
and requirements at once — especially in electrical, where standards,
products and requirements must all line up. The AI should carry that checking
so people can focus on pricing and product choices.

AFTER SUBMISSION: for now the job ends at submission. Later, track won/lost
and feedback, and push that to the client's CRM.

WHERE COMPANY DOCUMENTS LIVE TODAY: scattered, and usually gate-kept by one
person who holds the certificates and HSE documents. People chase marketing
and HSE departments for files. Putting everything in one place is a core part
of the value.

PAST TENDERS: keep them in the system. Some companies retain them for contract
disputes. It also makes the platform harder to leave.

SCANNED DOCUMENTS: YES, mandatory. Scanned PDFs, photographs, even handwritten
proposals must be readable (OCR). Users must also be able to search across all
past and future tender documents.

PRICING LISTS: mostly Excel. Import and let the AI structure it, or let users
enter items by column with product details.

AI PROVIDERS: external providers (OpenAI, Anthropic, Google) are acceptable —
these companies already trust SAP and Salesforce in the cloud. Some clients
will demand documents never leave their servers; the architecture already has
a per-company private-processing flag for that, and local models come later.
DECISION: default to cloud providers on no-training enterprise tiers.

AUTONOMY: the AI prepares everything to the highest accuracy, and a HUMAN
reviews, edits and gives final approval — especially at the end. A combination,
never full autonomy.

VOICE: eventually I want to talk to the AI, like talking to Claude Code, and
have it configure things. Staged: text chat with citations first, voice later.

WHEN THE AI IS UNSURE: show "unsure — check this" and flag it for review.
Never guess, never stay silent.

EMAIL: mostly Outlook, some Gmail. Integration goes through the client's IT
with their approval. IMPORTANT SECURITY DESIGN, my requirement: only ingest
emails from approved senders or a designated category — for example anything
from SAP Ariba or a specific client address. Never read the whole mailbox.

PORTALS: SAP Ariba is the most common; the landscape is fragmented (ADNOC,
aggregators, others). RESEARCH CONCLUSION: nearly all of them notify suppliers
by EMAIL, so email ingestion is the master key. Portal APIs come later.

ERP/CRM: connecting to the client's ERP or accounting system is valuable. If a
client will not connect, provide an import path for their data instead.

LEGAL SEARCH: a real example — legal needs the contract from Algeria where a
specific tool was used. They cannot read every contract, so they search one
keyword and jump to the contract and its tender requirements. Full-text search
with country, client and project filters.

BUSINESS MODEL: per user per month plus usage-based AI metering. Cheap models
for light tasks, frontier models for critical work like legal analysis.

DEADLINE: investor event in October; the demo must be ready by 15 SEPTEMBER
2026. This is hard.

COMPETITOR: Ranger AI (rangerrfx.com), San Francisco, $8.4M seed May 2026,
doing agentic RFP/tendering for energy and oil & gas with MENA focus. Read it
as market validation. Our differentiation: (1) evidence-first with verified
clause citations, (2) GCC-native including any-language-to-English, (3) the
AI engine as a separate API product they do not have.

════════════════════════════════════════════════════════════
4. ARCHITECTURE — and the rules behind it
════════════════════════════════════════════════════════════

TWO PRODUCTS, DELIBERATELY SEPARATE:

- THE PLATFORM (apps/platform): Payload 3 + Next.js + PostgreSQL (SQLite
  locally). This is what customers see and use. It is a working product on its
  own — a team can run a whole tender workflow by hand today, without any AI.

- THE AI ENGINE (apps/ai-engine): a standalone Python/FastAPI service that
  ingests documents, parses them into structured blocks, and extracts metadata
  and requirements with verified citations. 27 tests passing.

HARD RULE: the engine NEVER imports from the platform and never touches its
database. They communicate over HTTP using shared contracts only. The engine
must keep working if the platform disappears, because it is also a product we
can sell into Salesforce, SAP and custom systems.

WHY PAYLOAD: I wanted to build on something already made so I can spend my
effort on the AI engine, not on rebuilding CRM plumbing. Payload gives login,
roles, multi-company isolation, file uploads, APIs, audit history and an admin
panel for free, under an MIT licence so the product stays mine to sell. We
built the entire customer-facing interface ourselves on top.

We previously built the platform on Django and it worked. We moved to Payload
deliberately, for the reason above. DO NOT propose going back to Django.

SOCKETS BEFORE PLUGS — the most important design principle:
Phase 1 is not a mock-up waiting for AI. It is a genuinely working product
where people do the work by hand, using the SAME data shapes the AI will later
fill. A requirement entered by a person records method 'human' with its
document, page, clause and quote; the engine later writes method 'llm' into
the identical fields. Nothing gets rebuilt when the AI arrives. Never create a
separate "AI version" of a field, screen or table.

CUSTOMIZATION IS DATA, NEVER A FORK:
Every client runs the same system. Onboarding a pipeline company versus a
construction company means loading THEIR checklist templates, capabilities,
terminology and guidelines as data. This is modelled on how Salesforce works.
Never write client-specific code branches. But we stay opinionated — we are
not building a general no-code builder.

THE BINDING PRODUCT RULES (see PRODUCT_CONTRACT.md):
1. Never invent a tender fact. If it cannot be determined, it is unknown and
   flagged for review.
2. Every extracted fact carries its source: document, page, clause, verbatim
   quote, confidence, method.
3. Every judgement references the facts it is based on.
4. Tenant data never crosses companies. Scope every query by the signed-in
   user's company.
5. The AI never makes the final bid/no-bid decision.
6. Companies configured for private processing never reach external AI
   providers.
7. The engine never depends on the platform.
8. Facts and judgements are never mixed in one uncontrolled prompt.

════════════════════════════════════════════════════════════
5. WHAT IS ALREADY BUILT AND WORKING
════════════════════════════════════════════════════════════

PLATFORM — verified running in a browser:
- Login, roles (admin / bid manager / contributor / viewer), multi-company
  isolation
- Dashboard in plain language: "Needs your attention", a hero card for the
  closest deadline, headline numbers with money, a pipeline chart, readiness
  bars computed only from requirements a person actually assessed
- Tender list with a readiness column
- Tender workspace with ten tabs. Live: Overview, Documents, Requirements
  (with the evidence panel), Compliance, Checklist, Tasks. Designed
  placeholders marked "soon": Pricing, Legal, Risks, Proposal
- Companies, Contacts, Capabilities, Tasks, Checklist templates
- Create a tender, add a requirement WITH its citation, upload documents,
  record a bid/no-bid decision with a reason, add tasks — all in our own UI
- 13 data collections; seeded with a GCC oil & gas demo workspace (Falcon
  Energy Services bidding to ADNOC, PDO, KOC, QatarEnergy, with ILI
  capabilities, ISO and API Q1 certificates, and an ICV certificate gap)

AI ENGINE — built and tested, NOT yet connected to the platform:
- Ingest a document, identify its type, parse it into structured blocks
  (pages, headings, tables preserved — never one giant string)
- Extract tender metadata and requirements, each with a verified citation:
  the quote is checked against the source text, and anything unverifiable is
  flagged rather than trusted
- An AI gateway that routes by task (cheap models for classification, strong
  models for extraction) with per-company usage and cost metering
- Runs standalone. 27 tests passing.

NOT BUILT YET: the connection between them, email ingestion, checklist
generation, pricing, proposal generation, deployment.

════════════════════════════════════════════════════════════
6. THE PLAN — six milestones toward the journey
════════════════════════════════════════════════════════════

M1 CONNECT THE BRAIN (current). Upload a tender package in the platform and
   watch it analyse itself: summary, metadata, requirements with clause
   citations, and a fit score computed from real matching against the
   company's capabilities. Components without data are hidden, not zeroed.
   This unlocks everything else.

M2 THE INBOX. A forwarding address per company; a forwarded tender email
   becomes an analysed, scored tender in a Tender Feed screen. Approved
   senders only. Portals plug into the same door later.

M3 CHECKLIST AND CLARIFICATIONS. Generate the checklist from the tender's own
   content; clarification questions tracked draft → sent → answered, and the
   answers become facts that re-scoring uses.

M4 PRICING. Stored pricing list or Excel import; pricing tab per tender with
   missing prices flagged.

M5 COMPANY PROFILE AND DOCUMENT LIBRARY. Brand guidelines and standard
   documents set once in settings, used by every proposal.

M6 GENERATE THE PROPOSAL. Check what is missing and say so, then produce
   Word + PDF + an organised ZIP, editable in the platform or in Word.

DEADLINE: demo-ready by 15 September 2026. ROADMAP.md holds the day-by-day
countdown and what is explicitly out of scope until then. Proposal generation
and portal APIs are deliberately AFTER the demo.

════════════════════════════════════════════════════════════
7. DESIGN
════════════════════════════════════════════════════════════

It must look like premium enterprise software — think Linear, Notion, modern
Salesforce — and be understandable by anyone, including a 70-year-old manager.
Plain language, never jargon. "Things we don't have yet", not "compliance gaps".

The design system is in DESIGN.md and the tokens live in
apps/platform/src/app/(frontend)/styles.css. Never hardcode a colour.

Key rules:
- Mode is "Operate": the user is doing a job; the tool disappears into the task
- Restrained colour. The accent marks actions, selection and state, never
  decoration. One filled accent element per screen, no more
- Status colour never carries meaning alone — always a label beside the dot
- Contrast is measured, not judged: every colour passes 4.5:1
- Icons are drawn SVG on a 16px grid, never emoji
- Browser surfaces (selection, focus rings, scrollbars, tabular numerals) are
  themed too
- Motion is 150-250ms and conveys state only
- Every list has a real empty state that teaches
- HONESTY OVER DECORATION: a readiness bar is drawn only where requirements
  were actually assessed. An empty bar implies zero readiness, which is a
  different claim from "nobody has checked". No fake trend percentages until
  real historical data exists.

DESIGN SKILLS — install these outside the project folder:

  mkdir -p ~/design-skills && cd ~/design-skills
  git clone --depth 1 https://github.com/Leonxlnx/taste-skill
  git clone --depth 1 https://github.com/emilkowalski/skills
  git clone --depth 1 https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
  git clone --depth 1 https://github.com/pbakaus/impeccable

- impeccable — THE ONE THAT GOVERNS THIS PRODUCT. Its "Operate" mode is
  written for dashboards and tables. Read reference/operate.md and
  reference/craft-floor.md before any design work.
- ui-ux-pro-max — for generating and critiquing a token system. Use it to
  critique, not to adopt its presets; we stay opinionated.
- emilkowalski/skills — animation craft. Our motion budget is small.
- taste-skill — landing pages and marketing. It EXCLUDES dashboards, so it
  does not apply to the product UI. Useful later for a marketing site.

Also use the dataviz skill built into Claude Code before writing chart code.
Read DESIGN.md's chart section — it explains why some numbers are deliberately
NOT charts.

════════════════════════════════════════════════════════════
8. MISTAKES ALREADY MADE — do not repeat them
════════════════════════════════════════════════════════════

- Do not send me terminal commands. Rounds were wasted this way.
- Any example config must work when copied as-is. Our .env.example once
  shipped empty values and the first command a developer ran failed.
- Payload's official template tracks unreleased code. Pin real versions.
- http://localhost:3000/admin is Payload's back office, NOT the product. I
  landed there repeatedly and thought it was the app. The product is at plain
  localhost:3000.
- The sidebar shows a build number at the bottom left. If I say I cannot see a
  change, ask me what it says instead of guessing.

════════════════════════════════════════════════════════════
9. WHAT TO DO NOW
════════════════════════════════════════════════════════════

1. Clone https://github.com/ghanoubenz/bi-tender
   branch: claude/tender-platform-architecture-rhcmrw
   into my Documents folder.

2. Read these, in order — they hold the detail behind this message:
   CONTEXT.md, PLAN.md (section 18 is the journey), ROADMAP.md,
   PRODUCT_CONTRACT.md, DESIGN.md, DECISIONS.md, QUESTIONS.md, HANDOFF.md,
   SKILLS.md, ARCHITECTURE.md, README.md.
   If a document contradicts the code, the code is the truth — tell me.

3. Install the design skills as above.

4. Set up apps/platform: copy .env.example to .env (works as-is), install
   dependencies, seed the demo data, start the dev server. SQLite locally, so
   no Docker and no database server needed.

5. Tell me: the URL, the login, what I should see, and — in a few lines — what
   you understand the product to be and what you think the next step is.

HOW WE WORK FROM HERE:
- Develop locally. Do NOT push to GitHub unless I explicitly ask.
- Commit locally at every stable milestone with a clear message.
- After any visible change: run it, look at it, screenshot it, show me.
- Keep CONTEXT.md, DECISIONS.md and ROADMAP.md updated as we go, so the next
  session inherits everything the way you just did.

Start now. Tell me when you have read the documents.
```
