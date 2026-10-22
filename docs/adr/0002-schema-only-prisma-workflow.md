# ADR 0002: Schema-Only Prisma Workflow

- Status: Accepted
- Date: 2026-10-22
- Scope: Database schema management

## Context

The repository carried thirteen migration directories under
`apps/server/prisma/migrations/`. Only one of them changed data; the rest
described the schema. For a single-maintainer project with four tables that are
fully rebuilt from SEVIMA data, the migration history added a folder tree to
review without providing a recovery path that was actually used.

The live database matches `schema.prisma` exactly (verified with
`prisma migrate diff`), so the history cannot be reconstructed from drift.

## Decision

`schema.prisma` is the single source of truth for the database. There is no
`migrations/` directory and no `prisma migrate` command in the workflow.

- Apply schema changes with `pnpm --filter @komet/server db:push`.
- Keep one-off data repairs as SQL files under `prisma/data/` and run them
  manually.
- Never run `prisma migrate dev` or `prisma migrate deploy` in this repository.

## Consequences

- A fresh database is created by `db push` followed by a full sync.
- Schema changes have no history and no per-step rollback. `mysqldump` before a
  `db push` that changes existing columns is mandatory.
- `db push` can drop columns when the schema and database diverge. The SQL it
  prints must be read before confirming, and `--accept-data-loss` is not used
  without a backup.
- The `_prisma_migrations` table left in existing databases is inert and may be
  dropped manually.
- Restoring `migrations/` later requires a new baseline and a matching database.
