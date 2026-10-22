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
- `LICENSE` file with the ISC license, held by Universitas Bio Scientia
  Internasional Indonesia (i3L University).
- `docs/adr/0002-schema-only-prisma-workflow.md`, recording `schema.prisma` as
  the only schema source.

### Changed

- Moved vendored SEVIMA API documentation out of `ai-context/` into
  `requirements/sevima-api-docs/`, where local source material belongs.
- Live-database summary assertions now run only with `RUN_DB_TESTS=1`, so the
  default test suite and CI are deterministic.
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

### Documentation

- Documented the project structure, commands, domain invariants, and definition
  of done for future contributors and AI agents.
- Added the documentation map to `README.md`.
- Corrected database documentation: the engine is MariaDB. `DATABASE_URL` now
  uses `mariadb://`, and `prisma.config.ts` rewrites it to the `mysql://`
  scheme the Prisma CLI requires.
