# KOMET

**KPI Observation, Monitoring and Evaluation Tool** — an analytics dashboard for
Indonesian higher education institutions. KOMET turns the student, graduate, and
MBKM (_Merdeka Belajar – Kampus Merdeka_) records held by SEVIMA into the
indicators a faculty or study program needs to monitor intake, retention, and
graduate outcomes.

Built as a monorepo with **pnpm workspaces** and **Turborepo**.

---

## What it does

KOMET has three data modules. All three share the same filter system (academic
year, faculty, study program, jenjang, cohort) and the same rule: **a default
year comes from the data that exists, never from the calendar year.**

### Student Data (`/students`)

- Active student count with the current status scope
- International student share
- New-student intake for the selected academic year
- New-student decline against the previous 1–5 years
- Filterable student table with a per-student detail modal

### Graduates (`/graduates`)

- Total graduates
- Average GPA on a 4.00 scale
- On-time graduation rate against the standard study duration
- Study success (final evaluation)
- GPA distribution and per-cohort trends
- Filterable graduate table with a detail modal

### MBKM (`/mbkm`)

- Total participants, split into running and completed
- Eligible students (active, semester 7)
- MBKM participation rate
- Unique partner (_mitra_) count
- Activity, study program, and status distributions
- Filters for faculty, study program, activity type (BKP), activity status, and
  period; search by NIM, name, or partner
- Filterable participant table with a detail modal

### Data synchronization

- Pulls students, graduates, and MBKM data from the SEVIMA SIS API into MariaDB
- Manual sync per module or for all modules at once, with live progress
- Keeps the last five sync runs with per-module status
- A failed sync never deletes existing data
- Filter options and summaries refetch after a successful sync

### Access control

- Data routes require an HttpOnly session cookie issued by
  `POST /api/session/student`
- Sync routes require the sync credential (`x-api-key` or `Bearer`)
- Rate limits are applied per session identity and per IP
- Error responses only use messages from a server-side allowlist

Details, including the full route protection matrix, are in
`docs/ARCHITECTURE.md`.

---

## Tech stack

| Layer       | Technologies                                                                          |
| ----------- | ------------------------------------------------------------------------------------- |
| **Client**  | React 19, Vite 8, TailwindCSS 4, TanStack Query 5, React Router 7, Recharts 3         |
| **Server**  | Express 5, Prisma 7 (MariaDB 10.11, driver adapter), Redis (optional), Zod 4, Winston |
| **Shared**  | `@komet/shared` — ESM modules with subpath exports                                    |
| **Testing** | Vitest 5, Testing Library                                                             |
| **Tooling** | pnpm 12, Turborepo 2, ESLint 10, Prettier 3, Husky 9, GitHub Actions                  |
| **Runtime** | Node.js ≥ 24 (LTS)                                                                    |

---

## Prerequisites

| Requirement | Notes                                                                 |
| ----------- | --------------------------------------------------------------------- |
| **Node.js** | ≥ 24 LTS                                                              |
| **pnpm**    | Mandatory — npm and yarn are **not** supported                        |
| **MariaDB** | 10.11 LTS or newer. Prisma configures it through its `mysql` provider |
| **Redis**   | Optional — used for rate limiting and session storage                 |

---

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/fadjriarii/KOMET.git
cd Komet

# 2. Install dependencies
pnpm install

# 3. Configure environment variables
cp apps/client/.env.example apps/client/.env
cp apps/server/.env.example apps/server/.env
# Edit both .env files with your database credentials and settings

# 4. Set up the database
pnpm --filter @komet/server db:generate
pnpm --filter @komet/server db:push
```

---

## Running locally

```bash
pnpm dev
```

Turborepo starts both apps in parallel:

| App                  | URL                     |
| -------------------- | ----------------------- |
| Client (React SPA)   | `http://localhost:5173` |
| Server (Express API) | `http://localhost:3000` |

### Presenting from a laptop

For temporary public access, use one origin instead of forwarding the client
and API separately. Build the client with a relative API base, then let Express
serve both:

```bash
pnpm --filter @komet/client build:presentation
SERVE_CLIENT=true NODE_ENV=production ALLOW_MEMORY_STORES=true \
  pnpm --filter @komet/server start
```

Open the public `/students` URL. In this mode Express serves the SPA, the API,
and gzip compression from port `3000`, so the browser never calls
`localhost:3000` and cookies keep working. Expose only port `3000` through
Cloudflare Tunnel (`cloudflared tunnel --url http://localhost:3000`) or your
forwarding tool; a tunnel is preferable to raw router port-forwarding because
it provides HTTPS and a stable public edge. Set `TRUST_PROXY=1` when the tunnel
forwards the original client IP.

Do not run Vite's development server for the presentation: it compiles modules
on demand. The production build above is the fast path.

---

## Data flow

```
SEVIMA SIS API
      │  manual sync (POST /api/sync/*)
      ▼
Sync controllers ──► MariaDB (Prisma)
                          │  aggregation queries
                          ▼
                    Service layer ──► REST API ──► React client
                          │                        (TanStack Query)
                          └──► Redis (rate limit, sessions; optional)
```

The SEVIMA API is the source of truth. KOMET stores a local copy so dashboard
requests never depend on the external API's availability or response time.

---

## Project structure

```
Komet/
├── apps/
│   ├── client/                 (@komet/client – React SPA)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── common/      cards, charts, dashboard, feedback, filters, modals, tables, ui
│   │   │   │   └── layout/      Navbar, Sidebar
│   │   │   ├── modules/         students, graduates, mbkm, errors
│   │   │   ├── hooks/           Query keys, dashboard filters, debounce, tab transition
│   │   │   ├── services/        API client, query params, filter factory, sync
│   │   │   ├── utils/           KPI labels/scopes, pagination, query sanitizer, theme
│   │   │   ├── constants/       Navigation, debounce, cache policy
│   │   │   ├── config/          Env validation
│   │   │   ├── assets/          Logos and static images
│   │   │   ├── App.jsx
│   │   │   └── main.jsx
│   │   ├── scripts/             Bundle-budget check
│   │   └── tests/               Vitest + Testing Library
│   └── server/                 (@komet/server – Express API)
│       ├── src/
│       │   ├── app.js           Express app assembly
│       │   ├── server.js        Env, Redis, routes, listen
│       │   ├── config/          Env validator, Prisma, Redis, SEVIMA API, CORS, logging
│       │   ├── routes/          root, students, graduates, mbkm, sync
│       │   ├── controllers/     Route handlers + sync/ ETL (mappers, writers, lookup)
│       │   ├── services/        students/, graduates/, mbkm/, sync/
│       │   ├── middlewares/     Auth, session, rate limiter, validator, sync guard
│       │   └── utils/           academic/, syncJob/, error catalog, logger, helpers
│       ├── prisma/              Schema + one-off SQL data fixes
│       ├── scripts/             Contract check + query counter
│       ├── tests/unit/          Vitest unit tests
│       └── public/              Landing page + static assets
├── packages/
│   └── shared/                 (@komet/shared – shared ESM modules)
│       ├── src/                 constants, formatters, academicYear, contracts, filterUtils
│       └── tests/
├── docs/                       ARCHITECTURE.md, ENGINEERING.md, adr/
├── .github/workflows/ci.yml    CI: runs `pnpm verify`
├── task/                       Active implementation tasks
├── turbo.json
├── pnpm-workspace.yaml
├── eslint.config.mjs
├── .prettierrc
├── DESIGN.md                   UI direction and design tokens
└── package.json
```

---

## Available scripts

### Root (runs across workspaces via Turborepo)

| Command             | Description                                 |
| ------------------- | ------------------------------------------- |
| `pnpm dev`          | Start client and server in development mode |
| `pnpm build`        | Build all packages                          |
| `pnpm test`         | Run tests across workspaces                 |
| `pnpm lint`         | Lint all packages                           |
| `pnpm format`       | Format all files with Prettier              |
| `pnpm format:check` | Check formatting without writing            |
| `pnpm verify`       | Run format, lint, tests, and build in order |

### Per-workspace

| Command                                           | Description                         |
| ------------------------------------------------- | ----------------------------------- |
| `pnpm --filter @komet/client dev`                 | Start the client dev server only    |
| `pnpm --filter @komet/client build:presentation`  | Build with same-origin `/api`       |
| `pnpm --filter @komet/client check:bundle`        | Check the client bundle budget      |
| `pnpm --filter @komet/server dev`                 | Start the API server with nodemon   |
| `pnpm --filter @komet/server test`                | Run server unit tests (Vitest)      |
| `RUN_DB_TESTS=1 pnpm --filter @komet/server test` | Also run live-database assertions   |
| `pnpm --filter @komet/server check:contracts`     | Verify API response contracts       |
| `pnpm --filter @komet/server count:queries`       | Report query counts for a request   |
| `pnpm --filter @komet/server db:generate`         | Generate Prisma client              |
| `pnpm --filter @komet/server db:push`             | Push schema changes to the database |

`apps/server/prisma/schema.prisma` is the only schema source — there is no
migration history. Run `db push` after changing it, and run the one-off SQL in
`apps/server/prisma/data/` manually only when restoring an older dump.

---

## Environment variables

Environment files live inside each app directory — they are **not** in the
repository root.

| App    | File               | Template                   |
| ------ | ------------------ | -------------------------- |
| Client | `apps/client/.env` | `apps/client/.env.example` |
| Server | `apps/server/.env` | `apps/server/.env.example` |

Only `VITE_*` variables belong in the client: they are bundled into the browser
build and are public. Database credentials, `SESSION_SECRET`, `SYNC_API_KEY`,
and the SEVIMA keys belong only in `apps/server/.env`.

---

## Documentation

| Document                 | Purpose                                     |
| ------------------------ | ------------------------------------------- |
| `docs/ARCHITECTURE.md`   | System design, module boundaries, data flow |
| `docs/ENGINEERING.md`    | Engineering standards and review checklist  |
| `docs/adr/`              | Accepted technical decisions                |
| `CONTRIBUTING.md`        | Setup, branch and merge request workflow    |
| `SECURITY.md`            | Vulnerability reporting and personal data   |
| `CHANGELOG.md`           | User-visible changes                        |
| `THIRD_PARTY_NOTICES.md` | Third-party dependency licenses             |

Filter options are derived from synced data. Default-year behavior is documented
in `docs/adr/0001-data-driven-default-academic-year.md`.

---

## License

Proprietary Software License — All Rights Reserved.

Copyright © 2026 Universitas Bio Scientia Internasional Indonesia (i3L
University). This software is proprietary; non-public versions are confidential.
No license or right is granted except as expressly authorized in writing by the
copyright holder. A publicly viewable copy of this repository grants no license
to use, copy, or modify the code.

[LICENSE](LICENSE) is bilingual; the Indonesian version prevails. See
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for third-party dependency
licenses. Permission requests must be made in writing through the official
contact channels listed at https://i3l.ac.id.
