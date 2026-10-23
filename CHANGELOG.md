# Changelog

All notable changes to KOMET are recorded in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Version numbers follow the root `package.json`.

## [Unreleased]

### Added

- Canonical AI-agent guidance in `AGENTS.md`, with `CLAUDE.md` and
  `.cursorrules` as tool-specific pointers.
- Engineering standards in `docs/ENGINEERING.md`.
- Data-driven default academic year decision in
  `docs/adr/0001-data-driven-default-academic-year.md`.
- Agent skill installation guide in `docs/SKILLS.md` and project permission
  rules in `opencode.json`.
- Server regression coverage for Graduate Data anchored scopes.
- `pnpm verify` and a GitHub Actions CI workflow that runs it on every push and
  pull request.
- `DESIGN.md` as the single entry point for UI direction, tied to the existing
  `digital-blue` theme and shared UI primitives.
- Documented global skills (`playwright-cli`, `antislop`, `ponytail`) and the
  `~/.agents/skills/` canonical store in `docs/SKILLS.md`.
- `LICENSE` file with a proprietary, all-rights-reserved notice held by
  Universitas Bio Scientia Internasional Indonesia (i3L University).
- `docs/adr/0002-schema-only-prisma-workflow.md`, recording `schema.prisma` as
  the only schema source.
- `docs/adr/0003-mbkm-filter-scope.md`, recording the MBKM filter change.
- MBKM filter for activity type (BKP).
- Single-origin presentation mode (`SERVE_CLIENT=true`) and a
  `build:presentation` client script, so a temporary tunnel exposes one port.
- Gzip compression for API and static responses, and WebP logos in place of
  the two ~400 KB PNGs.
- `GET /api/graduates/filter-options` so the Graduate page can resolve the
  latest `Tahun Lulus` before the first summary request.
- In-process summary response cache, cleared after sync, plus a production
  startup warm-up for filter options and default summaries.
- Route-chunk prefetch on sidebar hover/focus and idle prefetch for detail
  modal chunks.

### Changed

- MBKM Data now uses the academic year and period as its cohort anchor. The
  intake-cohort (angkatan) filter is removed from the page, while the API keeps
  accepting it for existing callers.
- MBKM Data no longer exposes the jenjang or angkatan filter; search, faculty,
  program studi, and activity type share a four-column filter grid, and the
  bottom filters align to the same columns.
- MBKM KPI cards now explain their metric, filter scope, and inactive status
  handling instead of showing raw period codes and activity-status counts.
- MBKM search now covers NIM, name, and partner; partner is no longer a
  separate filter.
- Moved vendored SEVIMA API documentation out of `ai-context/` into
  `requirements/sevima-api-docs/`, where local source material belongs.
- Live-database summary assertions now run only with `RUN_DB_TESTS=1`, so the
  default test suite and CI are deterministic.
- Dashboard query data stays fresh for five minutes; sync still invalidates the
  affected module immediately.
- Graduate Data waits for filter options before fetching summary/list, so the
  default `Tahun Lulus` no longer causes a second summary/list request.
- Renamed `task/todo-loginFeature.md` to `task/login-feature.md`.
- Consolidated local AI state: `.ai/` removed, scratchpad moved to
  `ai-context/`, and `.gitignore` now covers browser and additional agent
  artifacts.
- Schema management now uses `db push` only. `prisma/migrations/` was removed,
  and the one data-only fix it contained lives in
  `apps/server/prisma/data/2026-academic-year-labels.sql`.
- Renamed `components/common/layout/` to `components/common/dashboard/` so the
  folder name matches what it holds.
- Rewrote `README.md` around the product, its KPIs, and its data flow instead of
  the tooling behind it.
- Documented the `X.js` + `X/` barrel pattern in `docs/ARCHITECTURE.md`.
- Moved `ARCHITECTURE.md` to `docs/ARCHITECTURE.md`.
- Upgraded Prisma to 7.10.1: the connection URL lives in
  `apps/server/prisma.config.ts`, the client is built with
  `@prisma/adapter-mariadb`, and `db:push` now regenerates the client.
- Refreshed dependencies: React 19.3.1, Vite 8.3.5, Vitest 5.0.5, Express
  5.3.0, TanStack Query 5.104.5, Zod 4.6.7, Lucide 1.61.0, dotenv 18.0.8, and
  pnpm 12.14.0.
- Hardened Redis clients for node-redis 6 (`close()` replaces `quit()`) and
  moved `rate-limit-redis` to 6.0.1.
- Node baseline is now 24 LTS, including the CI workflow.

### Removed

- `mysql2`, which was listed but never imported; the connection goes through
  the MariaDB driver adapter.
- The placeholder `DATABASE_URL` fallback in `src/config/prisma.js`. Unit tests
  now receive a non-routable test URL from `vitest.config.mjs`.

### Fixed

- Redis-backed rate limiting now uses Redis. Routes load after the Redis client
  connects, so the limiter no longer captures the in-memory store at import.
- Graduate Data filter and visualization behavior for anchored and unanchored
  scopes, including jenjang tabs and chart windows.
- Live-database summary assertion now expects the actual active-student count
  (611) instead of a stale 612, so `RUN_DB_TESTS=1` passes again.
- Concurrent dashboard queries now share one student-session mint instead of
  issuing one POST per request on page load.
- Concurrent identical summary requests now share one in-flight computation;
  later requests are served from the same cache until the next sync.
- Graduate Data no longer renders an extra empty/default-year request pair
  before the latest graduation year is known.

### Documentation

- Documented the project structure, commands, domain invariants, and definition
  of done for future contributors and AI agents.
- Added the documentation map to `README.md`.
- Corrected database documentation: the engine is MariaDB. `DATABASE_URL` now
  uses `mariadb://`, and `prisma.config.ts` rewrites it to the `mysql://`
  scheme the Prisma CLI requires.
