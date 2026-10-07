# KOMET

**KPI Observation, Monitoring and Evaluation Tool** — an analytics dashboard for Indonesian higher education institutions to track students, graduates, and the MBKM (_Merdeka Belajar – Kampus Merdeka_) program.

Built as a monorepo with **pnpm workspaces** and **Turborepo**.

---

## Tech Stack

| Layer       | Technologies                                                                |
| ----------- | --------------------------------------------------------------------------- |
| **Client**  | React 19, Vite 8, TailwindCSS 4, TanStack Query 5, Recharts 3, Lucide React |
| **Server**  | Express 5, Prisma ORM (MySQL), Redis, Zod 4, Winston logging                |
| **Shared**  | `@komet/shared` — common constants & formatters (dual ESM/CJS)              |
| **Tooling** | pnpm 12, Turborepo 2, ESLint 10, Prettier 3, Husky 9, lint-staged           |
| **Runtime** | Node.js ≥ 22                                                                |

---

## Prerequisites

| Requirement | Notes                                          |
| ----------- | ---------------------------------------------- |
| **Node.js** | ≥ 22                                           |
| **pnpm**    | Mandatory — npm and yarn are **not** supported |
| **MySQL**   | Any 8.x-compatible server                      |
| **Redis**   | Optional — used for rate limiting & caching    |

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

## Running Locally

```bash
pnpm dev
```

Turborepo starts both apps in parallel:

| App                  | URL                     |
| -------------------- | ----------------------- |
| Client (React SPA)   | `http://localhost:5173` |
| Server (Express API) | `http://localhost:3000` |

---

## Project Structure

```
Komet/
├── apps/
│   ├── client/              (@komet/client – React SPA)
│   │   ├── src/
│   │   │   ├── components/      Reusable UI: cards, charts, modals, tables, filters, layout
│   │   │   ├── modules/         Feature modules: overview, students, graduates, mbkm
│   │   │   ├── hooks/           Shared React hooks: useSummaryQuery, usePaginatedList, etc.
│   │   │   ├── services/        API client, query params
│   │   │   ├── config/          Env validation
│   │   │   ├── constants/       Navigation items (routes + menu + breadcrumbs), debounce values
│   │   │   └── utils/           Formatters, UI helpers
│   │   └── package.json
│   └── server/              (@komet/server – Express API)
│       ├── src/
│       │   ├── config/          Env validator, Prisma, Redis, SEVIMA API
│       │   ├── controllers/     Route handlers: students, graduates, mbkm, sync
│       │   ├── middlewares/     Auth, rate limiter, session, validator
│       │   ├── routes/          Express routers
│       │   ├── services/        Business logic by domain
│       │   └── utils/           Logger, error handler, academic utils
│       ├── prisma/              Schema + migrations
│       ├── tests/               Vitest unit tests
│       └── package.json
├── packages/
│   └── shared/              (@komet/shared – common utilities)
│       └── src/                 Constants, formatters (dual ESM/CJS)
├── turbo.json
├── pnpm-workspace.yaml
├── eslint.config.mjs
├── .prettierrc
└── package.json
```

---

## Available Scripts

### Root (runs across workspaces via Turborepo)

| Command             | Description                                 |
| ------------------- | ------------------------------------------- |
| `pnpm dev`          | Start client and server in development mode |
| `pnpm build`        | Build all packages                          |
| `pnpm test`         | Run tests across workspaces                 |
| `pnpm lint`         | Lint all packages                           |
| `pnpm format`       | Format all files with Prettier              |
| `pnpm format:check` | Check formatting without writing            |

### Per-workspace

| Command                                   | Description                         |
| ----------------------------------------- | ----------------------------------- |
| `pnpm --filter @komet/client dev`         | Start the client dev server only    |
| `pnpm --filter @komet/server dev`         | Start the API server with nodemon   |
| `pnpm --filter @komet/server test`        | Run server unit tests (Vitest)      |
| `pnpm --filter @komet/server db:generate` | Generate Prisma client              |
| `pnpm --filter @komet/server db:migrate`  | Deploy Prisma migrations            |
| `pnpm --filter @komet/server db:push`     | Push schema changes to the database |

---

## Environment Variables

Environment files live inside each app directory — they are **not** in the repository root.

| App    | File               | Template                   |
| ------ | ------------------ | -------------------------- |
| Client | `apps/client/.env` | `apps/client/.env.example` |
| Server | `apps/server/.env` | `apps/server/.env.example` |

Copy the `.env.example` file in each app and fill in the required values (database URL, API keys, etc.) before starting the application.

---

## License

ISC
