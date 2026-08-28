# START-HERE.md — The prompt to give a new Claude session

Copy everything inside the box below and paste it as your first message to
Claude on a new machine (or a new conversation). It explains the project, the
documents, the skills, and how you want to work.

---

```
You are taking over development of my product. Read this whole message, then
follow it in order.

## The working agreement — this matters most

I am the founder and product owner. I am not a developer.
- I do NOT run terminal commands. You do everything yourself.
- I review by looking at screenshots and running software, never by reading
  test output or descriptions.
- Never tell me something works because the code compiled. Run it, open it,
  look at it, then tell me.
- When there is something to see, give me a URL or an image.
- I speak by voice, so my messages are long and have transcription errors.
  Read for intent. Ask only when a wrong guess would waste real work.

## The project

TenderIQ — an AI Tender Intelligence & Bid Management platform for companies
bidding on large tenders. First market: oil & gas, UAE and the GCC.

It is two separate products, and that separation is a hard rule:
- The PLATFORM (apps/platform): Payload 3 + Next.js. A working product on its
  own — people can run a whole tender workflow by hand today.
- The AI ENGINE (apps/ai-engine): a standalone Python/FastAPI service that
  reads tender documents and extracts requirements with verified citations.
  It runs WITHOUT the platform and must never import from it.

I have a hard deadline: investor-demo-ready by 15 September 2026.

## Step 1 — get the code

Clone https://github.com/ghanoubenz/bi-tender
Branch: claude/tender-platform-architecture-rhcmrw
Put it in my Documents folder.

## Step 2 — read the documents, in this order

Claude has no memory between sessions, so everything already decided is
written down in the repo. Read these BEFORE writing any code. If you skip
them you will redo work I have already paid for.

1. CONTEXT.md — START HERE. How I work, what the product is, the decisions
   already made that must not be re-litigated (we moved from Django to
   Payload deliberately), the mistakes already made and not to repeat, and
   exactly where things stand.
2. PLAN.md — the architecture, and in section 18 the complete end-user
   journey in my own words. That journey is the north star.
3. ROADMAP.md — the six milestones and the day-by-day countdown to
   September 15, plus what is explicitly out of scope until then.
4. PRODUCT_CONTRACT.md — the AI rules. These are binding, not advice.
   Never invent a tender fact; unknown stays unknown and gets flagged; the
   AI never makes the bid/no-bid decision; tenant data never crosses
   companies.
5. DESIGN.md — the design system. Tokens, the measured 4.5:1 contrast floor,
   the chart rules, and the honesty rules that outrank appearance.
6. DECISIONS.md — every significant technical decision with its reasoning
   (ADR format). Read before proposing to change any of them.
7. QUESTIONS.md — my answers to 30 discovery questions: market, users, what
   the AI may and may not do alone, integrations, pricing model.
8. HANDOFF.md — the codebase map, the rules you must not break, and a
   precisely specified task if you want somewhere to start.
9. SKILLS.md — the design skills and how to install them (see step 3).
10. ARCHITECTURE.md and README.md — background and how to run things.

When you have read them, tell me in a few lines what you understand the
product to be and what you think the next step is. If anything in the
documents contradicts the code, the code is the truth — tell me rather than
forcing the change through.

## Step 3 — install the design skills

The interface work is guided by four external design skills. They are NOT in
the repo (about 107MB) and are not dependencies — the rules we actually
adopted are written down in DESIGN.md. Install them anyway, outside the
project folder:

  mkdir -p ~/design-skills && cd ~/design-skills
  git clone --depth 1 https://github.com/Leonxlnx/taste-skill
  git clone --depth 1 https://github.com/emilkowalski/skills
  git clone --depth 1 https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
  git clone --depth 1 https://github.com/pbakaus/impeccable

What they are for:
- impeccable — the one that governs this product. Its "Operate" mode is
  written for task surfaces like dashboards and tables. Read
  reference/operate.md and reference/craft-floor.md before any design work.
- ui-ux-pro-max — for generating and critiquing a token system, and
  anti-pattern validation. Use it to critique, not to adopt its presets; we
  stay opinionated.
- emilkowalski/skills — animation and motion craft. Our motion budget is
  deliberately small, so this is rarely needed.
- taste-skill — landing pages and marketing sites. It explicitly excludes
  dashboards, so it does NOT apply to the product UI. Useful later for a
  marketing site.

Also use the dataviz skill built into Claude Code before writing any chart
code, and read DESIGN.md's chart section — it explains why some numbers are
deliberately NOT charts.

## Step 4 — get it running and show me

Set up apps/platform: copy .env.example to .env (it works as-is), install
dependencies, seed the demo data, start the dev server. It uses SQLite
locally, so no Docker and no database server are needed.

Then tell me:
- the URL to open and the login
- what I should see when I get there

Important: http://localhost:3000 is the product. http://localhost:3000/admin
is Payload's internal back office — that is NOT the product and I should not
be looking at it. The sidebar shows a build number at the bottom left; if I
ever say I cannot see a change, ask me what that build number says.

## Step 5 — how we work from here

- Develop locally. Do NOT push to GitHub unless I explicitly ask.
- Commit locally at every stable milestone with a clear message.
- After any visible change: run the app, look at it, screenshot it, show me.
- Keep CONTEXT.md, DECISIONS.md and ROADMAP.md up to date as we go, so the
  next session inherits everything the way you just did.

Start with step 1. Tell me when you have read the documents.
```
