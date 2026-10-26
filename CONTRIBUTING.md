# Contributing to KOMET

KOMET is internal software of i3L University. Contributions come from
authorized i3L personnel; see [LICENSE](LICENSE), Section 8. External
contributions need a written agreement first.

This file covers the workflow. The engineering rules live in
[AGENTS.md](AGENTS.md) and [docs/ENGINEERING.md](docs/ENGINEERING.md), and
security and personal-data rules in [SECURITY.md](SECURITY.md).

## Setup

1. Use Node.js 24 (`.nvmrc`) and pnpm 12 (`corepack enable` picks the version
   pinned in `package.json`).
2. `pnpm install`
3. Copy `apps/server/.env.example` to `apps/server/.env` and
   `apps/client/.env.example` to `apps/client/.env`, then fill in the values you
   were given. Never commit either `.env`.
4. `pnpm dev`

See [README.md](README.md) for the database and sync setup.

## Workflow

1. Create a branch from `main`, for example `feature/graduate-tabs` or
   `fix/on-time-rate`.
2. Make the smallest change that solves the problem, with a regression test for
   every bug fix.
3. Run `pnpm verify` (format check, lint, test, build). It must pass.
4. Update `CHANGELOG.md` under `[Unreleased]` for user-visible changes, and the
   relevant docs or ADR when behavior, filters, the API, or architecture change.
5. Commit, push the branch to GitLab, and open a merge request. The merge
   request template lists the checks reviewers expect.
6. Merge after the pipeline passes and a reviewer approves.

## Commit messages

- English, one subject line of 15 to 30 words that says what changed and where.
- No multi-paragraph body. Trailers such as `Co-Authored-By` go on their own
  line and do not count.

Example:

```text
Add per-prodi tabs to the Total Lulusan detail and hide tabs that hold a single category in graduate popups
```

## Remotes

Push only to `gitlab`. GitLab mirrors every push to GitHub automatically; a
direct push to GitHub makes the mirror diverge and stop.

## Domain rules

Graduate Data and Student Data have domain invariants (default academic year,
cohort versus event filters, study length in semesters). Read `AGENTS.md`
section 5 and `docs/adr/` before changing them, and add an ADR when you do.
