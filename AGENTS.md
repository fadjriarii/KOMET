# KOMET — Agent Guide

This is the canonical instruction file for AI agents working in this repository.
Tool-specific files must point here instead of duplicating these rules.

## 1. Project

KOMET (KPI Observation, Monitoring and Evaluation Tool) is a university analytics
dashboard for student, graduate, and MBKM data.

Monorepo layout:

- `apps/client` — React 19, Vite, TailwindCSS, TanStack Query
- `apps/server` — Express 5, Prisma, MariaDB, Redis
- `packages/shared` — shared constants, formatters, and academic-year rules

Runtime requirements: Node.js >= 24, pnpm 12, Turborepo 2.
The server uses CommonJS (`require`); the client and shared package use ESM
(`import`).

## 2. Source of truth

Read the relevant documents before structural or domain changes:

- `README.md` — installation, commands, and repository overview
- `CHANGELOG.md` — user-visible changes, released and unreleased
- `docs/ARCHITECTURE.md` — system design and module boundaries
- `DESIGN.md` — UI direction and design-system entry point
- `docs/ENGINEERING.md` — engineering standards and review checklist
- `docs/adr/` — accepted technical decisions
- `requirements/` — local product requirements (the PRD); never commit as-is
- `task/` — active implementation tasks
- `ai-context/` — historical audits and handoffs, not current truth

Do not create `PRD.md` or `TASKS.md` duplicates while `requirements/` and
`task/` remain the active sources.

## 3. Commands

```bash
pnpm dev
pnpm build
pnpm lint
pnpm format:check
pnpm test
```

Targeted checks:

```bash
pnpm --filter @komet/client test
pnpm --filter @komet/server test
pnpm --filter @komet/shared test
```

Database:

```bash
pnpm --filter @komet/server db:generate
pnpm --filter @komet/server db:push
```

`schema.prisma` is the only schema source; see
`docs/adr/0002-schema-only-prisma-workflow.md`. Never run `prisma migrate`.

Environment files:

- Client: `apps/client/.env`
- Server: `apps/server/.env`

Never commit `.env` files, tokens, cookies, or credentials. All `VITE_*`
variables are public because they are bundled into the browser build. Secrets
belong only in `apps/server`.

## 4. Repository map

- Client feature modules: `apps/client/src/modules/<domain>`
- Shared client components: `apps/client/src/components/common`
- Server routes and controllers: `apps/server/src/routes`, `apps/server/src/controllers`
- Server business logic: `apps/server/src/services/<domain>`
- Shared package: `packages/shared/src`
- Server tests: `apps/server/tests/unit`
- Client tests: `apps/client/tests`
- Prisma schema: `apps/server/prisma/schema.prisma`

## 5. Non-negotiable rules

### 5.1 Data-driven behavior

- Filter options and defaults must come from server data, not hardcoded labels
  in the client or in tests.
- The default academic year for a module must be the latest academic year
  actually present in that module's data, not the current calendar year.
- An explicit URL or filter selection always wins over the data-driven default.
- After a successful sync, filter options and summary data must be refetched.
  If newer data exists, the default advances; if no newer data exists, the
  default stays unchanged.
- A sync failure must not erase the last known default.
- Do not use `new Date()` or `getCurrentAcademicYear()` to decide a default when
  data-driven options are available. Calendar logic is only for display or
  rollover rules that explicitly require it.
- Keep defaults per module. Student data uses entry periods, Graduate data uses
  graduation years, and MBKM uses its own data. Do not force one global default
  across domains without an ADR.
- Follow `docs/adr/0001-data-driven-default-academic-year.md`.

### 5.2 Graduate Data semantics

These rules are domain invariants. Do not change them without an ADR and
regression tests:

- The graduate population is defined by the existence of a `graduate` relation,
  not by `statusKeaktifan`.
- The default `Tahun Lulus` is the latest graduation year present in data.
- An explicit `Tahun Lulus` wins over the `Tahun Ajaran` anchor.
- The `Tahun Ajaran` anchor is cumulative only when no explicit `Tahun Lulus`
  is selected.
- Study Success (`Keberhasilan Studi`) is affected only by cohort-defining
  filters, never by event filters such as graduation year, graduation period,
  or predicate.
- On-time graduation is grouped by the student's actual intake cohort
  (`angkatan`), not by graduation year.
- Jenjang is dynamic. Do not hardcode S1/S2 only; `Profesi`, `S3`, `D3`, and
  `D4` must remain supported.
- Canonical jenjang spelling is `S1`, `S2`, `S3`, `D3`, `D4`, `Profesi`.
- Rows without `tahunLulus` are excluded from year-bucket charts and anchored
  views, but may be included in unanchored totals. Do not change this silently.
- Trend charts use a five-year window when no explicit year is selected;
  summary cards continue to use the latest default year.

Cohort-defining filters: search, faculty, study program, jenjang, angkatan,
and academic year. Event filters: graduation year, graduation period, and
predicate.

### 5.3 Engineering

- Follow the existing structure, naming, and style.
- Make the smallest correct change. Do not add abstractions for one caller.
- Do not add a dependency for a small change.
- Use `@komet/shared` for constants, formatters, and academic-year logic that
  both apps need.
- Do not duplicate filter builders, query builders, formatters, or API
  contracts.
- Do not rewrite unrelated modules or mass-format files.
- Preserve validation, error handling, accessibility, and existing tests.
- New documentation is written in English. UI copy stays in Indonesian unless
  the product asks otherwise. Do not mass-translate unrelated code comments.
- Do not migrate the project to TypeScript unless explicitly requested.

### 5.4 Security

- Validate input at trust boundaries with the existing validation layer.
- Treat authentication, session storage, `SYNC_API_KEY`, and SEVIMA credentials
  as security boundaries. Do not broaden access without an explicit request and
  tests.
- Never log PII such as NIM, names, or search queries.
- Never expose server secrets to the client. `VITE_*` values are public.
- Keep raw requirement extracts, API captures, and data dumps local; they may
  contain live credentials or PII. Never commit them.
- Do not run destructive database commands against a shared database without
  confirmation.
- Do not edit generated Prisma client files.

### 5.5 Performance

- Aggregate large datasets in the database, not by loading every row into Node.
- Avoid N+1 queries and per-row queries inside loops.
- Use pagination for list endpoints and indexes for filtered/sorted columns.
- Cache expensive, repeated aggregates only when invalidation is understood.
- Measure before optimizing. Do not trade clarity for speculative speed.

### 5.6 Reliability

- Every request path needs explicit loading, empty, and error states.
- Do not swallow errors or return fake success values.
- Sync operations must be idempotent and must not delete existing data when a
  run fails.
- Invalidate or refetch dependent query keys after sync.
- Bug fixes require a regression test that fails before the fix.

## 6. Workflow

0. Scheduled task: when the local date in Asia/Jakarta is 2026-11-05 and the
   time is 08:30 or later, execute `task/2026-11-05-tech-stack-update.md`
   before any user request. That task supersedes ADR 0002 and converts the
   project to Prisma Migrate; until then, `db push` remains the workflow.
   Remove this step after the task is completed.
1. Read the relevant docs and existing tests.
2. Use `rg` to find every caller before changing shared logic.
3. For multi-file changes, state a short plan and confirm assumptions.
4. Prefer the root-cause fix over patches in multiple call sites.
5. Run targeted tests first, then the full verification set.
6. Report changed files, verification results, and anything not checked.

Do not guess API field names. Check the controller, service, and tests.

## 7. Definition of done

- Regression test added for every bug fix.
- Targeted tests pass.
- Full test suite passes when feasible.
- `pnpm lint` passes.
- `pnpm build` passes.
- `pnpm format:check` passes.
- If behavior, filters, API, architecture, or setup changed, update
  `README.md`, `docs/ARCHITECTURE.md`, `docs/ENGINEERING.md`, or the relevant ADR in
  the same change.
- Commit only after verification. Push only when explicitly asked.

## 8. AI tool compatibility

- `AGENTS.md` is the canonical source for all AI providers.
- `CLAUDE.md` and `.cursorrules` are pointers and must not duplicate these
  rules.
- If another tool needs its own instruction file, make it a one-line pointer to
  `AGENTS.md`.
- Keep one source of truth. Do not create competing rule files.
- Skill installation, IDs, and locations are documented in `docs/SKILLS.md`.
- Global skills live once in `~/.agents/skills/` and are symlinked into
  `~/.claude/skills/` for Claude Code. Do not copy a skill into a second
  directory.
- Project skills shared with the team live in `.claude/skills/` or
  `.opencode/skills/`; git-ignored `.agents/` is not shareable.
- Scan every candidate skill with `skillspector` (or `skill-inspector`) before
  installing it.
- Installed global skills: `ponytail`, `playwright-cli`, `anti-slop`,
  `skill-inspector`, `insecure-defaults`. Do not let an installer write or
  rewrite this file; add pointers here manually.
- UI/UX work reads `DESIGN.md` first. `antislop` is only a filter on top of
  the existing `digital-blue` system: it must not introduce a second palette,
  font, or layout language.

## 9. Context hygiene

- `graphify-out/` is generated output. Use
  `graphify-out/GRAPH_REPORT.md` only as an optional navigation aid.
- Before using the graph, compare `Built from commit` with
  `git rev-parse --short HEAD`; regenerate with `graphify update .` when stale.
- Do not read `graph.json` or `graph.html` unless specifically needed.
- The graph is not an architecture source of truth. Decisions live in
  `docs/ARCHITECTURE.md` and `docs/adr/`.
- Do not read `node_modules`, `dist`, `coverage`, or the vendored SEVIMA API
  docs in `requirements/sevima-api-docs/` unless working on that integration.
- `requirements/` stays ignored because it contains real SEVIMA credentials and
  student PII. Sanitize before sharing or committing any part of it.
- Treat old handoffs and audits as historical context. Verify current code
  before acting on them.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
