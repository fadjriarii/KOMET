# Engineering Standards

This document defines how KOMET applies data-driven behavior, DRY, modularity,
security, performance, and reliability. `AGENTS.md` contains the short rules;
this file explains the expected level of care.

## 1. Data-driven behavior

The database and API are the source of truth for filter options and defaults.
The client renders what the server provides; it does not invent years, jenjang,
or option ordering.

Rules:

- Never hardcode academic-year labels such as `2026/2027` in application code,
  tests, or UI copy.
- Derive option lists from the relevant data population. Student options come
  from student data; Graduate options come from graduate data; MBKM options come
  from MBKM data.
- Expose explicit defaults from the server when a client needs them. Do not make
  the client infer a default from `array[0]` if the server can return
  `defaultAcademicYear` or `defaultTahunLulus`.
- An explicit URL or user selection wins over the default.
- After sync, invalidate or refetch the affected filter-option and summary
  queries. The default advances only when newer data exists.
- If sync adds nothing new, the default must not move.
- If sync fails, keep the last known default and show the failure explicitly.
- Do not use the current calendar year as a fallback when data-driven options
  exist. Calendar logic is for rollover rules and labels, not for pretending a
  year exists in the dataset.
- Keep defaults per module. Student, Graduate, and MBKM have different event
  dates and must not share a single global default without an ADR.

See `docs/adr/0001-data-driven-default-academic-year.md` for the accepted
decision and acceptance criteria.

## 2. DRY

DRY means one source of truth for a rule, not one function for every repeated
line.

Centralize immediately when the same rule affects multiple modules:

- academic-year parsing, labels, rollover, and windows
- filter parameter names and normalization
- number, percentage, and date formatting
- shared constants such as predikat labels and status values
- API response contracts used by more than one client feature

Do not abstract prematurely:

- Two similar-looking blocks with different reasons to change are not
  duplication.
- Do not create a generic utility file with one caller.
- Do not add configuration or indirection to save three lines.
- Prefer deleting code over adding a wrapper.
- When a rule is duplicated, move it to the narrowest shared module that both
  callers can depend on.

## 3. Modularity

KOMET should be strongly modular at domain boundaries and simple inside each
module.

Boundaries:

- Client features live in `apps/client/src/modules/<domain>`.
- Server routes, controllers, and services stay separated.
- Shared code goes to `packages/shared` only when both apps need it.
- Domain-specific helpers stay in the domain, not in a global `utils` dumping
  ground.

File and function design:

- One file should have one main reason to change.
- Split a file when it mixes unrelated responsibilities, not merely because it
  exceeds a line count.
- As a soft guideline, review files approaching 250–300 lines. A long file is
  acceptable when it is one coherent workflow.
- Keep functions focused. A function that builds filters should not also format
  the response.
- Prefer explicit data flow over hidden side effects.
- Avoid over-fragmentation. Ten tiny files that must be read together are not
  more readable than one clear module.

## 4. Security

Security is a requirement, not a later hardening phase.

- Validate all external input at trust boundaries with the existing validation
  layer.
- Keep authentication and authorization checks on every protected route.
- Treat session storage, `SYNC_API_KEY`, and SEVIMA credentials as security
  boundaries. Do not broaden access without an explicit request and tests.
- Never commit `.env` files or secrets.
- Keep raw requirement extracts, API captures, and data dumps local; they may
  contain live credentials or PII. Sanitize before sharing or committing.
- Remember that every `VITE_*` value is public in the browser bundle.
- Never log NIM, names, search queries, cookies, or tokens.
- Return safe error messages in production; do not expose stack traces.
- Apply rate limits to public and expensive endpoints.
- Use least-privilege database credentials.
- Review new dependencies before adding them.

## 5. Performance

Optimize based on evidence, not intuition.

- Aggregate large datasets in the database with Prisma `aggregate`, `groupBy`,
  or SQL, not by loading all rows into Node.
- Avoid N+1 queries and per-row queries inside loops.
- Paginate list endpoints; never return an unbounded table.
- Index columns used for filtering, sorting, and joins.
- Cache only repeated, expensive aggregates with a clear invalidation strategy.
- Invalidate caches after sync or data mutation.
- Keep client query keys stable and avoid unnecessary refetches.
- Measure before and after a performance change. Record the result in the PR or
  task notes.

## 6. Reliability

- Every request path has loading, empty, error, and success states.
- Do not swallow errors or return fabricated zeros to hide failure.
- Sync operations must be idempotent and safe to retry.
- A failed sync must not delete or partially replace existing data.
- Use transactions where a workflow requires atomicity.
- Use retries with backoff only for transient external failures.
- Keep the last known good state visible when a background refetch fails.
- Add regression tests for every bug that reaches users.

## 7. Testing

- Server tests use Vitest and live in `apps/server/tests/unit`.
- Client tests use Vitest and Testing Library and live in `apps/client/tests`.
- Mock Prisma and external services in unit tests; do not require a live
  database.
- Test the behavior, not the implementation detail.
- Every bug fix needs a test that fails before the fix.
- Run targeted tests first, then the full suite before commit.

Minimum verification for a normal change:

```bash
pnpm --filter @komet/server test
pnpm --filter @komet/client test
pnpm lint
pnpm build
pnpm format:check
```

## 8. Documentation

Update the correct document in the same change:

| Change                                 | Update                      |
| -------------------------------------- | --------------------------- |
| Install, run, or user-visible behavior | `README.md`, `CHANGELOG.md` |
| Module boundaries or data flow         | `ARCHITECTURE.md`           |
| Technical decision and trade-off       | `docs/adr/`                 |
| Engineering standard                   | `docs/ENGINEERING.md`       |
| Active implementation work             | `task/`                     |
| Temporary handoff                      | `docs/HANDOFF-*.md`         |

New documentation is written in English. UI copy remains Indonesian unless the
product asks otherwise. Do not create a second document for a rule that already
has a home.

## 9. Review checklist

Before considering a change complete:

- [ ] Behavior is data-driven; no hardcoded years or option lists.
- [ ] Explicit user choices are preserved.
- [ ] Sync and refetch behavior is correct.
- [ ] Shared logic lives in the right module.
- [ ] No new abstraction without a second real caller.
- [ ] Security boundaries and PII handling are preserved.
- [ ] Queries are bounded, indexed, and not N+1.
- [ ] Loading, empty, and error states exist.
- [ ] Regression test covers the fix.
- [ ] Tests, lint, build, and formatting pass.
- [ ] Relevant documentation is updated.
