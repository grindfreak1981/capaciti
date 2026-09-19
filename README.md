# Capaciti — Manufacturing Capacity Marketplace (Phase 1 MVP)

A B2B marketplace that matches buyers' manufacturing requirements against
suppliers' machine **capability** and published **availability** — not just
a supplier directory. Initial market: Slovenia, CNC milling and CNC turning.

> "Which supplier has the technical capability to manufacture this job AND
> has capacity available within the required timeframe?"

## Stack

- **Next.js 14** (App Router) + **TypeScript**, React 18
- **PostgreSQL** via **Prisma** (migrations, relational constraints, indexes)
- Server Actions for all mutations, one Route Handler for authenticated file
  downloads
- **Zod** for input and domain-schema validation
- Auth: bcrypt password hashing + signed JWT session cookie (`jose`), no
  third-party auth provider
- **Vitest** for unit + integration tests
- Tailwind CSS for a plain, industrial B2B UI

No ORM-agnostic abstraction layers, no microservices, no state management
library — this is a single modular monolith.

## Architecture

```
src/
  domain/                  # Framework-free business logic
    processes/              # Per-process capability/requirement schemas
      milling.ts             #   CNC_MILLING: axis count, travel X/Y/Z
      turning.ts              #   CNC_TURNING: diameter, length, bar, live tooling
      registry.ts             #   process code -> ProcessDefinition lookup
    matching/                # The matching engine (pure, unit-tested)
      engine.ts               #   scoring + compatibility per machine
      capability-fit.ts       #   axis / envelope / diameter / length checks
      availability-fit.ts     #   weekly capacity vs. delivery window
      weeks.ts                #   ISO week helpers
    auth/                    # Password hashing, session token issue/verify
    files/                   # Upload validation + storage abstraction
  lib/                      # App-facing glue (Next.js-aware)
    auth.ts                  # getCurrentUser / requireUser / requireCompany
    authorization.ts          # assertOwnsCompanyResource (pure, tested)
    matching-service.ts        # DB-backed wrapper around the matching engine
    prisma.ts, schemas.ts, process-meta.ts, ...
  app/                      # Routes, pages, server actions
    actions/                  # "use server" mutations (auth, companies, machines, rfqs)
    api/files/[fileId]/       # Authenticated, ownership-checked file download
    dashboard/, machines/, rfqs/, admin/, companies/new/, login/, register/
  components/               # Shared UI (forms, badges, match cards, grid)
prisma/
  schema.prisma             # Data model
  seed.ts                   # Demo data (see below)
```

### Why this shape supports new processes/countries without a redesign

- **Manufacturing processes are rows, not an enum baked into the schema.**
  `ManufacturingProcess` is a normalized table (`code`, `name`). Adding
  laser cutting, bending, welding, etc. later is a seed insert plus one new
  file under `src/domain/processes` — nothing else changes.
- **Process-specific technical data lives in one validated JSON column**,
  not a wide table of nullable CNC-specific fields. `Machine.capabilities`
  and `Rfq.requirements` are `jsonb`, but every read/write goes through the
  matching `zod` schema for that process's code
  (`domain/processes/registry.ts`) — so the data is never truly
  unstructured, just per-process instead of per-column.
- **Forms are generated from `FieldSpec[]` metadata**
  (`ProcessFieldsInput.tsx`), not hand-built per process, so a new process
  automatically gets a working create/edit form.
- **Country is a plain field on `Company`** (ISO alpha-2). Nothing assumes
  Slovenia; it's just the seeded data.
- **The matching engine takes plain data in, plain data out** — it has no
  Prisma/Next.js import, so it's trivially unit-testable and could run
  outside a request (e.g. a future batch/notification job) unchanged.

### Matching engine

`matchRfqAgainstMachine(rfq, machine, now)` in
`src/domain/matching/engine.ts` evaluates, in order:

1. **Process match** (gate) — short-circuits if the machine doesn't perform
   the RFQ's process, since capability schemas differ per process.
2. **Material** (gate) — a machine with *no* declared materials is
   rejected, not assumed compatible.
3. **Dimensional/axis fit** (gate) — milling checks axis count and part
   envelope against machine travel, trying every orientation of the part
   (a part can be rotated on the table); turning checks diameter and
   length against machine capacity.
4. **Batch size** (gate, if the machine declares limits).
5. **Availability** (gate) — enumerates every ISO week between now and the
   required delivery date. `FULL` never produces a match. A week with **no
   published data** is treated as unknown, not as available. `AVAILABLE`
   ranks above `LIMITED`.

A requirement the buyer left blank (e.g. no required axis count) is
scored as a neutral pass with an explicit "not specified" reason — never
silently treated as a hard requirement, and never silently ignored either.

The score (0–100, deterministic) and the full list of
pass/fail reasons are persisted per RFQ×machine as a `MatchResult` row, so
"why did/didn't this match" is always inspectable later, not just at
request time.

## Getting started

Requires PostgreSQL 14+ running locally (or update `DATABASE_URL`).

```bash
npm install
cp .env.example .env        # then edit DATABASE_URL / SESSION_SECRET
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open http://localhost:3000.

### Demo accounts (from `npm run db:seed`, password `Password123!`)

| Role     | Email                         | Company                  |
|----------|--------------------------------|---------------------------|
| Supplier | demo.supplier@capaciti.dev     | Demo Precision d.o.o.     |
| Buyer    | demo.buyer@capaciti.dev        | Buyer Example d.o.o.      |
| Admin    | admin@capaciti.dev             | —                          |

The seed creates:

- A **DMG Mori DMU 50** (5-axis milling, 650×520×475mm travel, Aluminium/
  Steel/Stainless) with `AVAILABLE` capacity this week.
- A **Haas Mini Mill** (3-axis, small travel, Steel only, `FULL` this week)
  — deliberately unable to satisfy the demo RFQ, to demonstrate rejection.
- A **Mazak Quick Turn 250** (CNC turning) showing the second seeded
  process.
- An **open RFQ** ("Aluminium mounting bracket, 50 pcs") already matched:
  log in as the supplier or buyer and open the RFQ / machine to see the
  ranked result and its reasons.

## Testing

```bash
npm test
```

47 tests across:

- Process capability/requirement schema validation (milling, turning)
- Matching engine: dimensional fit (with part rotation), axis compatibility,
  material matching (including "no materials declared" rejection), batch
  size bounds, `FULL` exclusion, unknown-availability handling, and
  `AVAILABLE` > `LIMITED` ranking
- Uploaded file validation (extension allowlist, size limits, empty files)
- Form-input coercion edge cases (e.g. a blank optional number field must
  not be coerced to `0`)
- Authorization boundaries (`assertOwnsCompanyResource`, including the
  admin bypass)
- An integration test against a real Postgres database
  (`capaciti_test`): supplier creates a machine and publishes availability,
  buyer submits an RFQ, the matching engine runs exactly as the app runs
  it, the result is persisted, and cross-company ownership checks are
  verified on the created records.

The integration test expects a second database, `capaciti_test`, with the
same migrations applied:

```bash
createdb capaciti_test
DATABASE_URL="postgresql://.../capaciti_test" npx prisma migrate deploy
```

## Security notes

- All company-scoped mutations (machines, availability, RFQs) go through
  `assertOwnsCompanyResource`, enforced server-side in every server action
  and route handler — the frontend hiding a button is never the only
  protection.
- Uploaded technical files are stored outside `public/`, keyed by a random
  UUID, and are only ever served through `/api/files/[fileId]`, which
  checks the requester's company against the RFQ's owning company (or
  admin) before streaming the file. There is no publicly guessable URL to
  a file.
- Passwords are hashed with bcrypt (cost 12); sessions are a signed,
  httpOnly, `SameSite=Lax` JWT cookie carrying only a user id — role and
  company are always re-read from the database, never trusted from a
  stale claim.

## Explicitly out of scope (Phase 1)

Billing/subscriptions/credits, commission handling, ERP/MES integrations,
AI quotation, automatic STEP geometry analysis, real-time chat, logistics,
escrow, invoicing, mobile apps, and automatic price estimation are not
implemented. The data model (e.g. `Company.companyType = BOTH`, a
`Material`/`ManufacturingProcess` reference schema, a storage abstraction
for files) is deliberately built so none of the above requires a schema
redesign later.
