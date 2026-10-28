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
│   └── shared/          # @komet/shared — ESM modules shared by both apps
├── docs/
│   ├── ARCHITECTURE.md  # System design and module boundaries
│   ├── ENGINEERING.md   # Standards and review checklist
│   ├── SKILLS.md        # Agent skill installation
│   └── adr/             # Accepted technical decisions
├── .github/workflows/   # CI (runs `pnpm verify`)
├── task/                # Active implementation tasks (committed)
├── requirements/        # Local source material — git-ignored, contains PII
├── AGENTS.md            # Canonical instructions for AI agents
├── DESIGN.md            # UI direction for the existing design system
├── pnpm-workspace.yaml
├── turbo.json
├── package.json
├── eslint.config.mjs
├── .prettierrc / .prettierignore
├── .npmrc
├── .husky/pre-commit
└── .gitignore
```

Local-only tool directories (`.agents/`, `.codex/`, `.gemini/`, `.qoder/`,
`.opencode/`, `ai-context/`, `graphify-out/`) are git-ignored and are not part
of the deployed system.

### `apps/client` — @komet/client

React 19 single-page application built with Vite 8 and TailwindCSS 4. Renders
the analytics dashboard UI: charts, tables, filters, and KPI visualizations.
Communicates with the server exclusively via REST API calls.

| Path                     | Contents                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------ |
| `src/components/common/` | `cards`, `charts`, `dashboard`, `feedback`, `filters`, `modals`, `tables`, `ui`      |
| `src/components/layout/` | `Navbar`, `Sidebar`                                                                  |
| `src/modules/students/`  | `components/`, `hooks/`, `pages/`, `services/`, `studentQueries.js`                  |
| `src/modules/graduates/` | `components/`, `hooks/`, `pages/`, `services/`, `utils/`, `graduateQueries.js`       |
| `src/modules/mbkm/`      | `components/`, `hooks/`, `pages/`, `services/`, `mbkmQueries.js`                     |
| `src/modules/errors/`    | `ErrorPage.jsx` and the error-state catalog                                          |
| `src/hooks/`             | Query keys, dashboard filters, debounced search params, modal origin, tab transition |
| `src/services/`          | `apiClient`, query-param builder, filter-service factory, sync service               |
| `src/utils/`             | KPI labels/scopes/subtitles, pagination, query sanitizer, theme, UI helpers          |
| `src/constants/`         | Navigation, debounce values, cache policy                                            |
| `src/config/`            | `envValidator.js` (fails fast on a missing `VITE_API_BASE_URL`)                      |
| `src/assets/`            | Logos and static images imported by the UI                                           |
| `scripts/`               | `check-bundle.mjs` (bundle budget)                                                   |
| `tests/`                 | Vitest + Testing Library suites                                                      |

There is no `overview` module; the dashboard root is assembled from the students,
graduates, and MBKM modules.

### `apps/server` — @komet/server

Express 5 REST API backend. Uses Prisma ORM for MariaDB database access and
optional Redis for rate limiting and caching. Handles authentication, data
synchronization with the SEVIMA API, and serves aggregated statistics.

| Path               | Contents                                                                                                                                       |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app.js`       | Express app assembly (helmet, cors, parsers, routes)                                                                                           |
| `src/server.js`    | Bootstrap: env validation, Redis, route registration, listen                                                                                   |
| `src/routes/`      | `rootRoutes`, `studentsRoutes`, `graduatesRoutes`, `mbkmRoutes`, `syncRoutes`, `index`                                                         |
| `src/controllers/` | `students`, `graduates`, `mbkm` handlers + `sync/` ETL (`createSyncHandler`, mappers, writers, sevima lookup)                                  |
| `src/services/`    | Per-domain aggregation: `students/`, `graduates/`, `mbkm/`, `sync/`, plus `filterOptionsSource`, `sessionStore`, `studentDeduplicationService` |
| `src/middlewares/` | `auth`, `studentSession`, `syncAuth`, `syncGuard`, `sessionIdentity`, `rateLimiter`, `validator`                                               |
| `src/config/`      | `envValidator`, `prisma`, `redis`, `sevimaApi`, `corsPolicy`, `accessLog`, `slowQueryLog`                                                      |
| `src/utils/`       | `academic/`, `syncJob/`, `errorCatalog`, `errorHandler`, `logger`, pagination, percentage, trend helpers                                       |
| `prisma/`          | `schema.prisma` (only schema source) and `data/` for one-off SQL fixes                                                                         |
| `prisma.config.ts` | Prisma 7 config: schema path and datasource URL (CLI no longer reads `.env` itself)                                                            |
| `tests/unit/`      | Vitest suites mirroring `src/`                                                                                                                 |
| `scripts/`         | `check-contracts.js` and `count-queries.js`                                                                                                    |
| `public/`          | Landing page and vendored static assets                                                                                                        |

### `packages/shared` — @komet/shared

Shared ESM modules consumed by both client and server. Contains only logic that
is genuinely duplicated across both codebases: constants, formatters,
academic-year rules, response contracts, and filter query builders.

### Why This Structure

- **Separation of concerns.** Frontend and backend are independent applications with different runtimes, build pipelines, and deployment targets. Keeping them in separate `apps/` directories makes these boundaries explicit.
- **Independent deployability.** Each app can be built, tested, and deployed on its own. A frontend-only change doesn't require rebuilding or redeploying the server.
- **Code sharing via workspace protocol.** The `packages/` directory holds internal libraries consumed through pnpm's `workspace:*` protocol — no publishing to a registry, no version management overhead, just direct source references resolved at install time.

---

## 2. Configuration Files

### `pnpm-workspace.yaml`

Defines the workspace package locations (`apps/*`, `packages/*`). All
dependencies are managed from the root — a single `pnpm install` at the repo
root resolves and hoists everything. Individual apps don't need their own
install step.

It also holds pnpm 12's `allowBuilds` list (packages allowed to run install
scripts) and `minimumReleaseAgeExclude` pins for the Turborepo binaries, which
are exempted from the release-age delay so the pinned version resolves.

### `turbo.json`

Turborepo task runner configuration. Defines the task dependency graph and caching behavior:

| Task    | Cache   | Persistent | Dependencies | Outputs   |
| ------- | ------- | ---------- | ------------ | --------- |
| `dev`   | `false` | `true`     | —            | —         |
| `build` | `true`  | `false`    | `^build`     | `dist/**` |
| `lint`  | `true`  | `false`    | `^build`     | —         |
| `test`  | `true`  | `false`    | `^build`     | —         |

- **`dev`** disables caching (`cache: false`) and sets `persistent: true` because dev servers are long-running processes, not cacheable outputs.
- **`build`** depends on `^build` (caret prefix), meaning a package's build runs only after all its workspace dependencies have built. Build outputs in `dist/**` are cached by Turborepo.
- **`lint`** and **`test`** also depend on `^build`, so they run against built
  workspace dependencies rather than stale sources, and remain cached.
- Only the client emits `dist/**`. The server build is an intentional no-op
  (`echo 'No build step for backend'`), which is why Turborepo warns that no
  output files were found for `@komet/server#build`.

### `package.json` (root)

Workspace orchestrator. Does not contain application code — its scripts proxy to Turborepo (`turbo run dev`, `turbo run build`, etc.). Key fields:

- **`devDependencies`**: `turbo`, `eslint`, `prettier`, `husky`, `lint-staged` — tooling shared across the entire repo.
- **`packageManager`**: Pins `pnpm@12.9.1` via Corepack to ensure all contributors use the same package manager version.
- **`lint-staged`** config: runs `prettier --write` and `eslint --fix` on staged `.js/.jsx/.cjs/.mjs` files; runs `prettier --write` on staged `.json/.md/.yaml/.yml` files.
- **`verify`** script: chains `format:check`, `lint`, `test`, and `build`. It is
  the single command CI runs and the one contributors should run before a
  commit.

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
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

Prettier auto-discovers this file by walking up the directory tree, so every workspace inherits it without any additional config.

### `.prettierignore`

Excludes generated, vendored, and local-only files from formatting:
`node_modules`, `dist`, `coverage`, `.turbo`, `pnpm-lock.yaml`, `prisma`,
`requirements`, `ai-context`, `graphify-out`, the local agent directories, and
Playwright output. Without these entries Prettier would traverse multi-megabyte
generated JSON on every `format:check`.

### `.npmrc`

pnpm settings. Uses `onlyBuiltDependencies` to allowlist packages that are
permitted to run build scripts (the Prisma packages). This is a security
measure — only explicitly approved packages can execute post-install scripts,
reducing the attack surface from supply-chain compromises. The same allowlist is
mirrored as `allowBuilds` in `pnpm-workspace.yaml`.

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

The database schema (`schema.prisma`), the connection URL in
`prisma.config.ts`, and the generated Prisma client live inside `apps/server/`.
There is no migration history — see ADR 0002. The database is MariaDB; Prisma has
no `mariadb` provider, so `datasource.provider` is `mysql`. `DATABASE_URL` uses
the `mariadb://` scheme the app and driver adapter accept, and
`prisma.config.ts` rewrites it to `mysql://` for the CLI. Prisma 7 requires a
driver adapter, so `src/config/prisma.js` builds the client with
`@prisma/adapter-mariadb`, which connects through the MariaDB driver. The
database is a server-only concern — the client never accesses MariaDB directly.
Placing Prisma at the root would imply the schema is shared across apps, which
it is not.

### F. Barrel files — `X.js` + `X/` (same name, on purpose)

Four modules ship a facade file and an implementation folder with the same base
name:

| Facade (public surface)              | Implementation folder              |
| ------------------------------------ | ---------------------------------- |
| `services/students/declineTrend.js`  | `services/students/declineTrend/`  |
| `services/students/filterBuilder.js` | `services/students/filterBuilder/` |
| `utils/academicUtils.js`             | `utils/academic/`                  |
| `utils/syncJobTracker.js`            | `utils/syncJob/`                   |

Callers import the facade (`require('./declineTrend')`), never the topic files
inside the folder. The folder holds the topical implementations; the file holds
the public exports and the module-level documentation.

This is a barrel, not a duplicate. Do not delete one side, rename the folder, or
flatten the pair before every caller has been migrated in the same change.

---

## 4. Shared Package Design (`@komet/shared`)

### Module Exports

`@komet/shared` is ESM-only (`"type": "module"`) and exposes named subpaths
instead of a barrel `index`:

```json
{
  "exports": {
    "./constants": "./src/constants.js",
    "./formatters": "./src/formatters.js",
    "./academicYear": "./src/academicYear.js",
    "./contracts": "./src/contracts.js",
    "./filterUtils": "./src/filterUtils.js"
  }
}
```

| Subpath                      | Contents                                                             |
| ---------------------------- | -------------------------------------------------------------------- |
| `@komet/shared/constants`    | Pagination defaults, table limits, status enums, academic rules      |
| `@komet/shared/formatters`   | `id-ID` number and percentage formatting                             |
| `@komet/shared/academicYear` | Academic-year parsing, rollover, and valid period labels             |
| `@komet/shared/contracts`    | Response-shape contracts checked by `check:contracts` and the client |
| `@komet/shared/filterUtils`  | Query-param filter builders used by all three data modules           |

The client imports these as ESM. The server is CommonJS and calls
`require('@komet/shared/<subpath>')`; this works because Node.js 24 supports
`require()` of an ESM module when it has no top-level await. There is no second
CJS build, no bundling step, and no `index.js` barrel — importing a subpath
keeps the dependency surface explicit and tree-shakeable.

### Contents

- **Shared constants**: pagination defaults, table limits, status enums, and
  academic-year rules that must stay consistent between client display logic and
  server validation.
- **Shared formatters**: `formatNumber` (id-ID locale) and percentage helpers
  used identically in both server responses and client rendering.

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
│  Sync Controllers │────▶│ MariaDB  │
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

2. **Sync controllers** pull data from SEVIMA via HTTP and upsert it into the local MariaDB database through Prisma. This decouples dashboard performance from the external API's availability and response time.

3. **Dashboard endpoints** query the local MariaDB database for aggregated statistics — graduation rates, KPI metrics, enrollment trends — through a service layer that encapsulates business logic.

4. **Express routes** expose these aggregations as REST endpoints. Authentication uses HttpOnly session cookies (not localStorage tokens) to prevent XSS-based credential theft.

5. **Redis** (optional) provides rate limiting for API endpoints and caching for expensive aggregation queries. The server operates without Redis but benefits from it under load.

6. **React client** fetches data via TanStack Query, which handles request deduplication, background refetching, and cache invalidation. The UI renders charts, tables, and KPI cards from the API responses.

### Dashboard latency path

- Graduate Data requests `GET /api/graduates/filter-options` first and only
  enables summary/list after the latest `Tahun Lulus` is known. This avoids a
  cold request pair whose result is immediately replaced by the default year.
- Summary responses are cached in-process by normalized query. Identical
  concurrent requests share one computation, and sync clears the cache.
  Production startup warms filter options and the default summary queries.
- The client keeps query data for five minutes. Sidebar hover/focus prefetches
  route chunks, and detail-modal chunks load during idle time after the first
  summary response.
- List responses are not cached: they contain student records and vary by page,
  search, and filters.

### Single-origin presentation mode

For temporary public demos, set `SERVE_CLIENT=true` and build the client with
`VITE_API_BASE_URL=/api`. Express then serves `apps/client/dist` and the API on
the same port. This avoids two tunnels, cross-origin cookie rules, and a
`localhost` API URL leaking into the browser bundle. Normal development stays
split: Vite on `5173` proxies `/api` to the server on `3000`.

### Riwayat sinkronisasi (`sync_runs`)

Popup sinkronisasi tidak menyimpan keadaan di klien: progres dibaca dari
`GET /api/sync/status`, dan 5 job terakhir dari tabel `sync_runs`
(`GET /api/sync/history`). Satu baris = satu job, ditulis
`controllers/sync/createSyncHandler.js` lewat `services/sync/syncRunLog.js`
**sebelum** job ditandai selesai — urutan ini yang membuat klien yang polling tiap
2 detik tidak pernah melihat status `completed` sementara baris riwayatnya belum ada.

- `modules` (JSON) berisi status per modul pada angka terakhir job, supaya rincian
  "modul mana yang gagal" tetap terbaca walau progres live sudah berganti pekerjaan.
- `actor` diturunkan server dari kredensial yang benar-benar dipakai (`syncAuth`):
  sesi → `Dashboard`, `SYNC_API_KEY` → `API Key`. Tidak ada string identitas yang
  diterima dari body, jadi riwayat tidak bisa dipalsukan.
- `trigger` selalu `manual` saat ini; tidak ada scheduler, jadi tidak ada trafik
  Sevima latar belakang yang tak diminta.
- Penyimpanan dipangkas di sumbernya: `recordRun` menulis lalu menghapus baris di
  bawah 5 terbaru, jadi tabel tidak tumbuh tanpa batas.

### Batas akurasi tren historis (keputusan yang dipertahankan)

Tren per tahun akademik (intake, mahasiswa internasional, snapshot status) dihitung
dari baris **hidup** `students`, dengan predikat snapshot (`periodeMasuk`/
`periodeTerakhir`) — bukan dari tabel riwayat yang dimaterialisasi. Batas yang
diterima:

- Satu mahasiswa hanya membawa satu `statusKeaktifan` dan satu `semester` saat ini, jadi nilai historis untuk tahun-tahun sebelumnya direkonstruksi dari tanggal keluar; mahasiswa yang datanya dibetulkan setelah sync menampilkan snapshot yang mengikuti kondisi terkini.
- Biaya baca tumbuh bersama jumlah mahasiswa, dan setiap request mengulang rekonstruksi yang sama.

Materialisasi snapshot ditolak untuk saat ini karena tidak ada sumber data SEVIMA
untuk status per periode: tabel riwayat hanya boleh diisi oleh proses yang sama yang
mengisi `students`, dan itu menambah jalur sinkronisasi kedua yang bisa berbeda dari
yang pertama. Upgrade path yang disepakati: tabel snapshot per tahun akademik yang
diisi pada akhir sync (`apps/server/src/controllers/sync/`), dibaca oleh service tren,
dengan backfill eksplisit satu kali.

### Student Data detail breakdowns under filters

Card numbers and detail popups follow three rules, so filter combinations need
no per-combination code:

1. **Numbers:** a card counts the AND of every filter in its scope
   (`services/students/kpiScopes.js`). The "Terfilter" badge lights when any
   in-scope filter differs from its default.
2. **Remaining dimensions:** a detail tab is hidden when its breakdown holds one
   category or fewer. One prodi selected hides Per Fakultas, Per Program Studi,
   and Per Jenjang automatically.
3. **Status cross-tab:** when the population holds more than one status, the
   Total Mahasiswa detail opens on Per Status and stacks every other tab by
   status. Statuses for past academic years are projected in memory
   (`projectSnapshotStudent`), because SQL only holds the current status.

| Filter                                        | Total Mahasiswa | Internasional      | Intake | Trend Intake (decline) |
| --------------------------------------------- | --------------- | ------------------ | ------ | ---------------------- |
| Fakultas, Prodi, Jenjang, Search, Periode, TA | on              | on                 | on     | on                     |
| Angkatan                                      | on              | on                 | on     | on                     |
| Semester                                      | on              | on                 | on     | off                    |
| Kewarganegaraan                               | on              | off (measures WNA) | on     | on                     |
| Status Keaktifan                              | on              | on (denominator)   | off    | off                    |

Per-year charts (Per Angkatan, intake, decline, international) show the five
academic years up to the selected one (`getBounded5YearRollingAcademicYears`).
The default academic year is the latest entry year in student data (ADR 0001),
so a sync that adds a newer year moves the default and every per-year window.

Detail endpoints: `/students/active-students` (dimensions with per-status
counts), `/students/intake-breakdown` (intake and decline per prodi, current
status per intake year), and `/students/international-detail` (trend, per
country, per prodi).

### Graduate Data cards and detail breakdowns under filters

The server owns every domain decision; the client only renders and phrases
text. `GET /graduates/summary` returns `kpis.cards` from
`services/graduates/graduateCards.js`, one object per card:
`{ value, isEmpty, scope, byJenjang: [{ key, jenjang, label, value, … }] }`.
Jenjang order and spelling are canonical (`CANONICAL_JENJANG`,
`normalizeJenjang` in `@komet/shared`); a jenjang without data is never listed.

| Filter                                        | Total Lulusan   | Rata-rata IPK | Tepat Waktu | Keberhasilan Studi          |
| --------------------------------------------- | --------------- | ------------- | ----------- | --------------------------- |
| Search, Fakultas, Prodi, Jenjang              | on              | on            | on          | on                          |
| Angkatan                                      | on              | on            | on          | on (the evaluated angkatan) |
| Tahun Ajaran without Tahun Lulus              | cumulative ≤ TA | cumulative    | cumulative  | on (anchor TA − maximum)    |
| Tahun Lulus (explicit wins over Tahun Ajaran) | on              | on            | on          | off                         |
| Predikat, Periode Lulus                       | on              | on            | on          | off                         |

Card values:

- Total is the sum over jenjang. Rata-rata IPK is weighted by graduates with an
  IPK, not an average of averages. Tepat Waktu is the pooled rate over every
  jenjang, each judged against its own limit.
- Keberhasilan Studi reports the jenjang with the largest intake, because each
  jenjang evaluates a different angkatan. Several selected angkatan are pooled
  (Σ graduates within the limit ÷ Σ intake); angkatan still inside their
  maximum study length are left out. `ignoredFilters` lists the active event
  filters this card does not read, so the client can say so.
- Study length is counted in semesters against `services/graduates/studyLimits.js`
  (ADR 0004).

Presentation rules:

1. **Numbers:** a card counts the AND of every filter in its scope; the
   "Terfilter" badge follows `kpiFilterScope`.
2. **Single-category tabs are hidden:** one predikat, prodi, faculty, or IPK band
   hides that tab (`components/common/modals/tabsWithData.js`). Jenjang tabs come
   from the server's `jenjangs` list, so a jenjang without data has no tab.
3. **Empty combinations:** `isEmpty` cards show "-" and a sentence explaining
   that the filter combination has no graduates; detail popups show the same
   message instead of empty charts. A real 0 stays 0.
4. **Windows:** trend charts show five graduation years and the Tepat Waktu chart
   five angkatan. The server applies the window when the Tahun Lulus selection is
   still the default (`withoutDefaultTahunLulus`); any other selection is shown
   as-is.

Detail endpoints: `/graduates/total-lulusan` (`byYear`, `jenjangs`),
`/graduates/distribution` (`byPredikat`, `byProdi`, `byFaculty`),
`/graduates/ipk-trend` (`byYear`, `jenjangs`, `gpaCount`, bands, prodi,
faculty), `/graduates/tepat-waktu` and `/graduates/keberhasilan-studi` (series
per jenjang key plus `jenjangs` with `batas` and the evaluated angkatan).

### MBKM Data population, cards, and details

One population (ADR 0005) serves every MBKM card, popup, and the table:
`services/mbkm/population.js` loads the selected periods, the eligible students,
and the activities, and marks each activity `counted`. Status
categories come from `services/mbkm/statusRules.js`. The page is an early
warning system: it shows no targets.

- **Periods:** explicit `periode`, else both periods of `tahunAjaran`, else both
  periods of the latest academic year in MBKM data. The client sends no
  `tahunAjaran` until the summary reports `academicYearOptions[0]`.
- **Eligible:** students active in semester 7 in a selected period
  (`mbkmEligibility.js`). A non-active status without `periodeTerakhir` is not
  active.
- **Counted activity:** status category `participating` (Disetujui, Selesai),
  type filled, student eligible. Faculty, program, jenjang, and angkatan filters
  read Student columns for both numerator and denominator.
- **All-semester participants** (`allParticipants`): the same activity rule
  without the eligibility condition; they feed the total, partner, and activity
  type cards.

Every card reads every filter (`kpiFilterScope`). In the participation card,
type, status, and search narrow the participants but not the eligible
denominator, and the sentence names the filtered type instead of "MBKM".

`GET /mbkm/summary` returns `kpis.cards` from `services/mbkm/mbkmCards.js`:
`participation` (`value` rate, `participants`, `eligible`, `notParticipating`,
`pending`), `total` (`value`, `semester7`), `mitra` (`totalPartners`,
`withPartner`, `top`), and `jenis` (`value` type count, `top` two types).
`periodLabel` is the selected period in words. `filterOptions.jenisAktivitas`
lists only the types present in the selected periods (any status), so the
filter never offers a type the cards cannot show.

`GET /mbkm/analytics/:card` (`participation`, `total`, `mitra`, `jenis`)
returns `{ card, periodLabel, breakdowns }`. Each breakdown is
`{ key, label, kind, items }`: `kind: 'share'` items carry a share of the card
total, `kind: 'rate'` items carry `count ÷ total` within the group, so a faculty
rate never exceeds 100%. Participation: per faculty and program (rate), a
five-year trend, per status, and not participating per program. Total: per
semester, program, and angkatan. Mitra: top partners by students (top N plus
"Lainnya" decided by the server) and partners per type. Partner spellings are
merged by `services/mbkm/partnerNames.js` (safe rules plus the
`mbkm_partner_aliases` table, cached five minutes and cleared after sync), and
the table's Mitra column shows the merged name. Jenis: students per
type. The client renders breakdowns generically
(`MbkmBreakdownModal`) and hides single-category tabs (`tabsWithData`); `rate`
breakdowns render as a table so 0% groups stay visible.

`GET /mbkm/list` uses the same periods and population. Rows carry
`periodeLabel`, `statusCategory`, `sksKonversi`, and `totalSks`.

The MBKM sync cleans NIM `xx` and `(Akun Lama)` text before insert. For each
cleaned NIM, activities with the same BKP (`jenis_kegiatan`) and partner
(`nama_mitra`) collapse to the most complete row, then the newest activity.
Different BKP or partner pairs are kept.

## 6. Access Control (Zero-Trust)

### 6.1 Credential scopes

Dua credential dengan kemampuan yang sengaja dipisah:

| Credential                                                     | Dibuat oleh                 | Bisa apa                                                                                      | Tidak bisa apa                                                                                        |
| -------------------------------------------------------------- | --------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `komet_student_session` cookie (HMAC-SHA256, `SESSION_SECRET`) | `POST /api/session/student` | Semua route data (`/api/students`, `/api/graduates`, `/api/mbkm`) **dan** memicu/monitor sync | —                                                                                                     |
| `x-api-key` / `Bearer` (`SYNC_API_KEY`)                        | konfigurasi operator        | Hanya `/api/sync/*` (memicu ETL, baca status, baca/hapus riwayat)                             | Membaca dataset mahasiswa — dulu ini mungkin lewat fallback di `studentSessionAuth`, sekarang dihapus |

Dijegakan oleh dua middleware berbeda: `middlewares/studentSession.js` (sesi saja) dan `middlewares/syncAuth.js` (sesi **atau** kunci sync). Test regresi: `tests/unit/middlewares/studentSession.test.js` dan `tests/unit/middlewares/zeroTrust.test.js`.

### 6.2 Route protection matrix

| Route                                                   | Limiter                                                     | Guard                                          | Catatan                                                            |
| ------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------ |
| `GET /` (landing)                                       | —                                                           | —                                              | static, tanpa data; diganti SPA shell bila `SERVE_CLIENT=true`     |
| `POST /api/session/student`                             | `sessionIssueLimiter` 10/menit                              | origin allowlist di handler                    | 204 + `Cache-Control: no-store`                                    |
| `DELETE /api/session/student`                           | `sessionIssueLimiter` 10/menit                              | —                                              | revoke diri sendiri; idempoten                                     |
| `GET /api/health`                                       | —                                                           | `apiKeyAuth`                                   | uptime + latensi DB = fingerprint infrastruktur, khusus monitoring |
| `GET /api/sync/status`                                  | `statusLimiter` 120/menit                                   | `syncAuth`                                     | polling UI 2 detik, tidak memakai jatah dashboard                  |
| `GET /api/sync/history`, `DELETE /api/sync/history/:id` | `statsLimiter` 60/menit                                     | `syncAuth`                                     | 5 sync terakhir; penulisannya di `endJob`, penghapusan satu baris  |
| `POST /api/sync/{students,graduates,mbkm,all}`          | `statsLimiter` + `syncLimiter` 5/menit + `checkSyncRunning` | `syncAuth`                                     |                                                                    |
| `GET /api/{students,graduates,mbkm}/summary`            | `statsLimiter` 60/menit + `summaryLimiter` 20/menit         | `studentSessionAuth`                           | endpoint termahal (puluhan query), di-cache sampai sync berikutnya |
| `GET /api/graduates/filter-options`                     | `statsLimiter` 60/menit                                     | `studentSessionAuth`                           | menentukan Tahun Lulus default sebelum summary                     |
| route data lain di ketiga tab                           | `statsLimiter` 60/menit                                     | `studentSessionAuth` + `validateQuery(schema)` |                                                                    |

### 6.3 Keputusan yang disengaja

- **Penerbitan sesi tetap tanpa login per-user.** Aplikasi ini tidak punya identity provider; satu-satunya gerbang adalah sesi yang ditandatangani server. Yang ditegakkan: limiter keras per IP/sesi, origin allowlist, `HttpOnly`/`SameSite`/`Path=/api`/`Secure`, dan pemisahan credential. Konsekuensi yang diterima: klien non-browser (curl) yang mencapai server dari IP berkuota bisa meminta sesi — sesi adalah anti-scraping gate, bukan otorisasi per-user. Bila nanti ada SSO kampus, ganti `issueStudentSession` menjadi pertukaran ticket→sesi; tidak ada bagian lain yang perlu berubah.
- **Pesan error = allowlist.** `utils/errorCatalog.js` adalah satu-satunya sumber pesan yang boleh keluar; `sendError`/`sendRejected` mengganti apa pun di luar daftar dengan pesan generik dan mencatat aslinya ke log server. Tidak ada blocklist regex di client — kebijakan redaksi hanya satu tempat.
- **Field diagnostik `error`** hanya ada bila `EXPOSE_ERROR_DETAILS=true`, dan env validator menolak kombinasi itu di production.
- **Detail kegagalan sync** (`/api/sync/status`) disimpan setelah melewati allowlist; pesan axios/DB (yang bisa memuat URL SEVIMA) hanya masuk log.
- **Log tanpa PII.** Morgan mencatat `req.path` (bukan query string), SlowQuery tidak mencatat `event.params` (nilai bound berisi NIM), dan Prisma `warn`/`error` diarahkan lewat winston, bukan `stdout`.
- **Rate limit per identitas sesi.** `sessionIdentity` menandai request dengan hash SHA-256 dari token yang lolos verifikasi signature; token palsu tidak pernah mendapat bucket sendiri, dan fallback memakai `ipKeyGenerator` (subnet IPv6) agar klien IPv6 tidak melewati kuota.
- **Redis adalah degradasi eksplisit.** Tanpa `REDIS_URL` di production server menolak start, kecuali operator mengatur `ALLOW_MEMORY_STORES=true` (sesi & kuota jadi per-proses — aman hanya untuk single-instance).
- **Timeout 30 s di server, 25 s di client** (`apiClient.js`), supaya satu pihak memutuskan lebih dulu. `req.signal` (AbortController) tersedia untuk handler; query Prisma yang sudah berjalan tidak bisa dibatalkan dari sisi aplikasi.
