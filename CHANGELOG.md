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

### Fixed

- Graduate Data filter and visualization behavior for anchored and unanchored
  scopes, including jenjang tabs and chart windows.
- Live-database summary assertion now expects the actual active-student count
  (611) instead of a stale 612, so `RUN_DB_TESTS=1` passes again.

### Documentation

- Documented the project structure, commands, domain invariants, and definition
  of done for future contributors and AI agents.
- Added the documentation map to `README.md`.
