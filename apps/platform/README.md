# Tender Intelligence — Platform (Phase A)

Payload 3 + Next.js + PostgreSQL. Contains the customer-facing product UI,
the platform API, and Payload's admin panel (internal staff only, at `/admin`).

## Run it locally

Requires Node 20.9+ (check with `node --version`). No Docker, no database
server — local development uses SQLite.

```bash
cd apps/platform
cp .env.example .env      # works as-is, no editing needed
npm install
npm run seed              # creates the demo workspace
npm run dev
```

Then open http://localhost:3000/admin and sign in:

| Account | Password | Role |
|---|---|---|
| `demo@tenderiq.test` | `demo1234` | Bid manager |
| `viewer@tenderiq.test` | `demo1234` | Viewer (read-only) |

You should see 6 tenders. Open **Water Treatment Plant — Sohar** → Requirements
to see six requirements, each citing the clause and page it came from.

> `/admin` is the **internal** tool, not the product. The customer-facing UI
> lives under `src/app/(frontend)` and is built during A1.

## Useful commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the app on :3000 |
| `npm run seed` | Create the demo workspace (skips if it already exists) |
| `npm run generate:types` | Regenerate `src/payload-types.ts` after schema changes |
| `npm run generate:importmap` | Regenerate the admin import map after adding UI components |
| `npm run build` | Production build |

Reset local data at any time: `rm tender-platform.db && npm run seed`

## Database

The adapter is chosen by the connection string, nothing else changes:

- `file:./tender-platform.db` → SQLite (local development)
- `postgres://...` → Postgres (staging and production)
