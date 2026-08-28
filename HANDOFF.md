# HANDOFF — Tender Intelligence Platform

**Paste this whole file into your AI assistant (ChatGPT, Codex, Claude, Cursor)
before asking it to work on this repo.** It is written to be self-contained:
an assistant with no prior context can read this and be productive.

Repo: `https://github.com/ghanoubenz/bi-tender`
Working branch: `claude/tender-platform-architecture-rhcmrw`

## READ THESE FIRST, IN THIS ORDER

Claude has no memory between sessions. Everything decided so far is in files —
read them before doing anything, or you will repeat work already paid for.

| File | What it holds |
|---|---|
| **CONTEXT.md** | **Start here.** How the founder works, what the product is, decisions already made and not to be re-litigated, mistakes already made, current state |
| **PLAN.md** | Architecture and the full end-user journey (§18) |
| **ROADMAP.md** | The six milestones and the September 15 deadline countdown |
| **PRODUCT_CONTRACT.md** | The AI rules that are binding, not advisory |
| **DESIGN.md** | The design system — tokens, contrast floor, chart rules, honesty rules |
| **DECISIONS.md** | ADRs: every significant technical decision with its reasoning |
| **QUESTIONS.md** | The founder's answers to 30 discovery questions — market, users, AI limits, integrations |
| **SKILLS.md** | Design skills used, and how to install them |

---

## 1. RUN THE SERVER FIRST

Do this before writing any code, and confirm it works.

```bash
git clone -b claude/tender-platform-architecture-rhcmrw https://github.com/ghanoubenz/bi-tender
cd bi-tender/apps/platform
cp .env.example .env        # works as-is, no editing needed
npm install
npm run seed                # creates the demo workspace
npm run dev                 # starts on http://localhost:3000
```

Open **http://localhost:3000** and sign in:

| Account | Password | Role |
|---|---|---|
| `demo@tenderiq.test` | `demo1234` | Bid manager |
| `viewer@tenderiq.test` | `demo1234` | Viewer (read-only) |

You should land on a dashboard showing 3 active tenders, a compliance gap and
a pipeline breakdown.

**Requirements:** Node 20.9 or newer (`node --version`). No Docker and no
database server — local development uses SQLite.

**If it does not start:** run `npm run doctor`. It checks Node version,
directory, dependencies, `.env` contents, database and port, and prints the
exact fix for each problem. Fix what it reports, then re-run.

Reset local data any time: `rm tender-platform.db && npm run seed`

Useful URLs once running:
- `/` dashboard · `/tenders` list · `/tenders/1?tab=requirements` the key screen
- `/admin` Payload's admin panel — **internal tool only, never the product**

---

## 2. WHAT THIS PRODUCT IS

An **AI Tender Intelligence & Bid Management platform**. Companies that bid on
large tenders (construction, oil & gas, infrastructure) use it to manage the
whole lifecycle: receive a tender package, understand what it requires, check
whether the company qualifies, and decide whether to bid.

It is built in two independent halves:

- **Phase A — the platform** (this app). A working product on its own: tenders,
  documents, requirements, compliance, companies, contacts, capabilities,
  checklists, tasks. People can run a full tender workflow by hand today.
- **Phase B — the Tender AI Engine** (`apps/ai-engine`, already built). A
  standalone FastAPI service that parses tender documents and extracts
  metadata and requirements with source citations. It runs **without** the
  platform and is callable by any external system (Salesforce, SAP, etc.).

The engine is **not yet connected** to this app. That is deliberate and comes
later. Everything the engine will produce already has a place to live.

---

## 3. TECH STACK

| Layer | Choice |
|---|---|
| Framework | **Payload 3.88** (headless CMS/app framework) embedded in **Next.js 16** (App Router) |
| Language | TypeScript |
| Styling | **Tailwind CSS v4** with CSS custom-property design tokens |
| Database | SQLite locally, Postgres in production — chosen automatically by the connection string |
| Auth & permissions | Payload built-in |
| Multi-tenancy | `@payloadcms/plugin-multi-tenant` |
| AI Engine (separate) | Python 3.11 + FastAPI |

---

## 4. RULES YOU MUST NOT BREAK

1. **Payload's `/admin` is an internal tool, never the customer product.**
   Everything a customer sees lives in `src/app/(frontend)`. Never link a
   customer to `/admin`.
2. **Never break tenant isolation.** Every query for business data must be
   scoped to the signed-in user's tenant. Use `tenantIdOf(user)` from
   `src/lib/payload.ts` and pass `where: { tenant: { equals: tenantId } }`.
   Data must never leak between customer companies.
3. **Evidence is mandatory and its shape is fixed.** Any fact extracted from a
   tender document (a requirement, a deadline, a certification) carries where
   it came from: document, page, clause, verbatim quote, method, confidence.
   `method: 'human'` when a person typed it, `'llm'` / `'rule'` when the AI
   engine produced it. **Do not change this shape** — it is what lets the AI
   engine drop in later without rebuilding any screen.
4. **Never invent data.** If something is unknown, show it as unknown and flag
   it for review. Never guess a value to make a screen look complete.
5. **The Bid / No-Bid decision is always made by a person**, recorded with a
   reason and who decided it. AI may recommend; it never decides.
6. **Do not connect the AI engine yet** unless explicitly asked. Do not add AI
   API calls to this app.
7. **Unbuilt features are shown honestly**, marked `soon`, never hidden and
   never a broken link. Never fake data to make something look finished.

---

## 5. WHERE THINGS ARE

```
apps/platform/                    <-- the app you work in
  src/
    payload.config.ts             collections registered, DB adapter, multi-tenancy
    collections/                  the data model, one file per collection
    fields/evidence.ts            shared evidence + review fields
    lib/payload.ts                getClient(), getCurrentUser(), tenantIdOf()
    lib/format.ts                 date/money/deadline/label helpers
    components/ui.tsx             Badge, Card, CardHeader, StatTile, EmptyState, ComingSoon
    components/Sidebar.tsx        navigation (defines which routes should exist)
    components/Topbar.tsx         page header
    components/RequirementsPanel.tsx   requirements list + evidence panel
    app/(frontend)/styles.css     ALL design tokens live here
    app/(frontend)/login/         login page
    app/(frontend)/(app)/         the signed-in application
      layout.tsx                  sidebar shell, redirects to /login if signed out
      page.tsx                    dashboard
      tenders/page.tsx            tender list
      tenders/[id]/page.tsx       tender workspace (tabbed)
  scripts/doctor.mjs              setup diagnostics
  src/seed/run.ts                 demo data

apps/ai-engine/                   Phase B, Python. Do not modify unless asked.
packages/contracts/               shared data contracts between platform and engine
apps/platform-legacy/             OLD Django version. Reference only. Do not extend.
apps/web-legacy/                  OLD frontend. Reference only. Do not extend.
```

---

## 6. DATA MODEL (13 collections)

`tenants` · `users` (roles: admin / bid_manager / contributor / viewer) ·
`media` · `companies` · `contacts` · **`tenders`** (the centre) ·
`tender-documents` · `requirements` · `capabilities` (kind: capability /
certification / project_reference / product / equipment) ·
`checklist-templates` · `tender-checklists` · `tasks` · `ai-jobs`

Read the actual field definitions in `src/collections/` before writing queries.
Types are generated in `src/payload-types.ts` — regenerate with
`npm run generate:types` after changing any collection.

---

## 7. DESIGN RULES

The product must look like premium enterprise software — think **Linear**,
**Notion**, **Twenty**. Not a CMS, not a generic dashboard template.

- **Use the existing tokens**, defined in `src/app/(frontend)/styles.css`:
  `--color-canvas`, `--color-surface`, `--color-border`, `--color-ink`,
  `--color-ink-soft`, `--color-ink-faint`, `--color-accent`,
  `--color-positive`, `--color-caution`, `--color-critical` (each with a
  `-soft` background variant). **Never hardcode a hex colour in a component.**
- **Reuse the primitives** in `src/components/ui.tsx` rather than writing new
  card/badge/table markup.
- Body text 13px, dense tables, 1px borders instead of shadows, generous
  whitespace, `tnum` class on any column of numbers.
- **No gradients, no glassmorphism, no purple "AI" styling, no emoji.**
- Every list needs a real empty state (use `<EmptyState>`), not a blank box.

**Copy the patterns in `src/app/(frontend)/(app)/tenders/page.tsx`** — it is
the reference implementation for a list screen.

---

## 8. YOUR TASK

Five links in the sidebar currently return **404**. Build them:

| Route | Collection | Columns to show |
|---|---|---|
| `/companies` | `companies` | Name, kind (client/prospect/competitor/partner), country, industry, number of tenders |
| `/contacts` | `contacts` | Full name, company, job title, email, phone |
| `/capabilities` | `capabilities` | Name, kind, category, expiry (certifications) or year+value (project references) |
| `/tasks` | `tasks` | Title, related tender, assignee, status, priority, due date |
| `/templates` | `checklist-templates` | Name, industry, tender type, number of sections and items |

Requirements for each page:

1. Create `src/app/(frontend)/(app)/<route>/page.tsx` as a **server component**.
2. Scope every query by tenant (rule 2 above).
3. Use `<Topbar>`, `<Card>`, `<Badge>`, `<EmptyState>` — no new primitives.
4. Follow the table layout and typography of the tenders list exactly.
5. Show a count in the Topbar subtitle, e.g. `12 companies`.
6. Sensible sort: alphabetical for companies/contacts/capabilities/templates;
   tasks by due date with overdue first.
7. Use `formatDate`, `formatMoney`, `formatDeadline` from `src/lib/format.ts`.
8. Add labels to `src/lib/format.ts` if you need new ones — do not scatter
   label maps across components.

**Definition of done:**
- `npx tsc --noEmit` passes with no errors
- `npm run build` succeeds
- Every route returns 200 while signed in, and shows the seeded demo data
- No sidebar link 404s any more
- You have **opened each page in a browser and looked at it** — do not report
  a screen as finished because it compiled

Do not add: creating/editing forms, AI features, new collections, new
dependencies, or a component library. List screens only.

---

## 9. AFTER THAT (do not start without asking)

1. Create and edit forms — add a tender, type in requirements with citations
2. Company Intelligence screens (capability detail, coverage view)
3. Connect the AI Engine to the tender workspace
4. Deploy to Vercel + Neon Postgres + Cloudflare R2

---

## 10. WORKING AGREEMENTS

- **Never say a screen works because the code compiled.** Run the app, open the
  page, confirm what it renders.
- Commit at working milestones with a clear message; push to the branch above.
- Small, focused changes. Do not refactor code you were not asked to touch.
- If something in this document conflicts with what you find in the code, the
  code is the truth — say so rather than forcing the change through.
