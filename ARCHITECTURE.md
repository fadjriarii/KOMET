# KOMET Architecture

> **KPI Observation, Monitoring and Evaluation Tool** — A university analytics dashboard for tracking academic KPIs, student outcomes, and program performance.

---

## 1. Monorepo Structure

```
Komet/
├── apps/
│   ├── client/          # @komet/client — React 19 SPA frontend
│   └── server/          # @komet/server — Express 5 REST API
├── packages/
│   └── shared/          # @komet/shared — Shared utilities and constants
├── pnpm-workspace.yaml
├── turbo.json
├── package.json
├── eslint.config.mjs
├── .prettierrc
├── .prettierignore
├── .npmrc
├── .husky/pre-commit
└── .gitignore
```

### `apps/client` — @komet/client

React 19 single-page application built with Vite 8 and TailwindCSS 4. Renders the analytics dashboard UI: charts, tables, filters, and KPI visualizations. Communicates with the server exclusively via REST API calls.

### `apps/server` — @komet/server

Express 5 REST API backend. Uses Prisma ORM for MySQL database access and optional Redis for rate limiting and caching. Handles authentication, data synchronization with external APIs, and serves aggregated statistics to the client.

### `packages/shared` — @komet/shared

Shared utilities and constants consumed by both client and server. Provides dual ESM/CJS exports so it works in the client's module environment and the server's CommonJS environment. Contains only logic that is genuinely duplicated across both codebases.

### Why This Structure

- **Separation of concerns.** Frontend and backend are independent applications with different runtimes, build pipelines, and deployment targets. Keeping them in separate `apps/` directories makes these boundaries explicit.
- **Independent deployability.** Each app can be built, tested, and deployed on its own. A frontend-only change doesn't require rebuilding or redeploying the server.
- **Code sharing via workspace protocol.** The `packages/` directory holds internal libraries consumed through pnpm's `workspace:*` protocol — no publishing to a registry, no version management overhead, just direct source references resolved at install time.

---

## 2. Configuration Files

### `pnpm-workspace.yaml`

Defines the workspace package locations (`apps/*`, `packages/*`). All dependencies are managed from the root — a single `pnpm install` at the repo root resolves and hoists everything. Individual apps don't need their own install step.

### `turbo.json`

Turborepo task runner configuration. Defines the task dependency graph and caching behavior:

| Task    | Cache   | Persistent | Dependencies | Outputs   |
| ------- | ------- | ---------- | ------------ | --------- |
| `dev`   | `false` | `true`     | —            | —         |
| `build` | `true`  | `false`    | `^build`     | `dist/**` |
| `lint`  | `true`  | `false`    | —            | —         |
| `test`  | `true`  | `false`    | —            | —         |

- **`dev`** disables caching (`cache: false`) and sets `persistent: true` because dev servers are long-running processes, not cacheable outputs.
- **`build`** depends on `^build` (caret prefix), meaning a package's build runs only after all its workspace dependencies have built. Build outputs in `dist/**` are cached by Turborepo.
- **`lint`** and **`test`** run independently with caching enabled.

### `package.json` (root)

Workspace orchestrator. Does not contain application code — its scripts proxy to Turborepo (`turbo run dev`, `turbo run build`, etc.). Key fields:

- **`devDependencies`**: `turbo`, `eslint`, `prettier`, `husky`, `lint-staged` — tooling shared across the entire repo.
- **`packageManager`**: Pins `pnpm@12.9.1` via Corepack to ensure all contributors use the same package manager version.
- **`lint-staged`** config: runs `prettier --write` and `eslint --fix` on staged `.js/.jsx/.cjs/.mjs` files; runs `prettier --write` on staged `.json/.md/.yaml/.yml` files.

### `eslint.config.mjs`

Root-level ESLint flat config (ESM format). Provides baseline linting rules for any JavaScript file in the repository. Each app extends or overrides this with its own `eslint.config.mjs` that adds app-specific rules — React plugins for the client, Node.js globals for the server. See [File Placement Decisions](#c-eslint--root--per-app) for rationale.

### `.prettierrc`

Shared Prettier configuration applied across the entire monorepo:

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "endOfLine": "lf"
}
```

Prettier auto-discovers this file by walking up the directory tree, so every workspace inherits it without any additional config.

### `.prettierignore`

Excludes generated and non-source files from formatting: `node_modules`, `dist`, `coverage`, `.turbo`, `pnpm-lock.yaml`, and `prisma` (generated client code).

### `.npmrc`

pnpm settings. Uses `onlyBuiltDependencies` to allowlist packages that are permitted to run build scripts (Prisma packages). This is a security measure — only explicitly approved packages can execute post-install scripts, reducing the attack surface from supply-chain compromises.

### `.husky/pre-commit`

Git pre-commit hook that runs `lint-staged` before every commit. This enforces formatting and linting standards automatically — code that doesn't pass Prettier and ESLint cannot be committed.

---

## 3. File Placement Decisions

### A. `.gitignore` — ROOT ONLY (single source of truth)

One comprehensive `.gitignore` at the repository root prevents rule duplication and conflicting patterns across sub-folders. Git applies parent `.gitignore` rules to all children automatically.

Having separate `.gitignore` files in each `apps/` directory caused overlapping rules (`node_modules`, `.env`, `logs` were duplicated 3×) and maintenance burden — updating an ignore pattern meant editing multiple files. A single root file eliminates this.

### B. `.env` — PER APP (`apps/client/.env`, `apps/server/.env`)

Each application has a fundamentally different security scope:

- **Client `.env`** contains ONLY public-safe variables prefixed with `VITE_` (these are embedded into the browser bundle by Vite and visible to end users).
- **Server `.env`** contains secrets: `DATABASE_URL`, API keys, `SESSION_SECRET`, Redis connection strings.

Merging them into a single root `.env` would risk exposing server secrets via Vite's automatic env injection — any variable matching the `VITE_` prefix gets bundled into client code, and a misconfigured prefix or accidental rename could leak credentials. Keeping them separate enforces the principle of least privilege.

Both `.env` files are gitignored by the root `.gitignore`. Only `.env.example` files (with placeholder values) are committed to the repository.

### C. ESLint — ROOT + PER APP

The root `eslint.config.mjs` provides base rules for any JS file in the repo (consistent error-level rules, Prettier integration). But each app has different linting needs:

- **Client** needs React-specific plugins (`react-hooks`, `react-refresh`) with `browser` globals and ESM `sourceType`.
- **Server** needs Node.js globals with CommonJS `sourceType` and different environment assumptions.

Each app's ESLint config tailors rules to its runtime environment while inheriting shared formatting rules from the root.

### D. Prettier — ROOT ONLY

Formatting is style, not semantics. One `.prettierrc` ensures consistent code style across the entire monorepo regardless of which app or package a file belongs to. There is no reason for the client and server to format code differently. Prettier auto-discovers the nearest config by walking up the directory tree, so a single root file covers everything.

### E. Prisma — INSIDE `apps/server/`

The database schema (`schema.prisma`), migrations, and generated Prisma client live inside `apps/server/`. The database is a server-only concern — the client never accesses MySQL directly. Placing Prisma at the root would imply the schema is shared across apps, which it is not.

---

## 4. Shared Package Design (`@komet/shared`)

### Dual Exports

The shared package provides both ESM and CJS entry points via conditional exports in its `package.json`:

```json
{
  "exports": {
    ".": {
      "import": "./src/index.js",
      "require": "./src/index.cjs"
    }
  }
}
```

This is necessary because the client uses `type: "module"` (ESM imports) while the server uses `type: "commonjs"` (require calls). The conditional exports field lets Node.js and bundlers resolve the correct format automatically.

### Contents

- **Shared constants**: Pagination defaults, HTTP status codes, student status enums — values that must stay consistent between client display logic and server validation.
- **Shared formatters**: `formatNumber` (id-ID locale), `formatPercentage` — formatting functions used identically in both server responses and client rendering.

### Why Not More Shared Code

Frontend and backend have fundamentally different concerns. Over-sharing creates tight coupling — changes to a "shared" module can break both apps simultaneously and force coordinated deployments, defeating the purpose of the monorepo's separation.

Only truly duplicated logic belongs in `@komet/shared`: if the same function with the same behavior exists (or would need to exist) in both codebases, it moves to the shared package. Everything else stays in its respective app.

### Consumption

Workspaces consume `@komet/shared` via the `workspace:*` protocol in their `package.json`:

```json
{
  "dependencies": {
    "@komet/shared": "workspace:*"
  }
}
```

No publishing to npm, no version bumps — pnpm resolves it directly from the local `packages/shared/` directory.

---

## 5. Data Flow

```
┌──────────────────┐
│  SEVIMA SIS API   │  (External source of truth)
│  (Students,       │
│   Graduates,      │
│   MBKM data)      │
└────────┬─────────┘
         │ HTTP (sync endpoints)
         ▼
┌──────────────────┐     ┌─────────┐
│  Sync Controllers │────▶│  MySQL   │
│  (upsert logic)   │     │ (Prisma) │
└──────────────────┘     └────┬────┘
                              │ query
                              ▼
                     ┌──────────────────┐
                     │  Service Layer    │
                     │  (business logic, │
                     │   aggregation)    │
                     └────────┬─────────┘
                              │
                              ▼
                     ┌──────────────────┐     ┌─────────┐
                     │  Controllers /    │◀───▶│  Redis   │
                     │  Express Routes   │     │(optional)│
                     └────────┬─────────┘     └─────────┘
                              │ REST API
                              │ (HttpOnly session cookie auth)
                              ▼
                     ┌──────────────────┐
                     │  React Client     │
                     │  (TanStack Query) │
                     └──────────────────┘
```

### Flow Description

1. **SEVIMA SIS API** is the authoritative source of truth for student records, graduate data, and MBKM (Merdeka Belajar Kampus Merdeka) participation.

2. **Sync controllers** pull data from SEVIMA via HTTP and upsert it into the local MySQL database through Prisma. This decouples dashboard performance from the external API's availability and response time.

3. **Dashboard endpoints** query the local MySQL database for aggregated statistics — graduation rates, KPI metrics, enrollment trends — through a service layer that encapsulates business logic.

4. **Express routes** expose these aggregations as REST endpoints. Authentication uses HttpOnly session cookies (not localStorage tokens) to prevent XSS-based credential theft.

5. **Redis** (optional) provides rate limiting for API endpoints and caching for expensive aggregation queries. The server operates without Redis but benefits from it under load.

6. **React client** fetches data via TanStack Query, which handles request deduplication, background refetching, and cache invalidation. The UI renders charts, tables, and KPI cards from the API responses.
