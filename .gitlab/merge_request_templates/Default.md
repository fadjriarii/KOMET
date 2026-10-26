## What and why

<!-- What changes, and the problem it solves. Link the task file or issue. -->

## How to test

<!-- Steps or filter combinations a reviewer can follow locally. -->

## Checklist

- [ ] `pnpm verify` passes locally (format, lint, test, build).
- [ ] Every bug fix has a regression test.
- [ ] `CHANGELOG.md` is updated under `[Unreleased]`, with **BREAKING** marked
      where an API field or behavior is removed.
- [ ] Docs or an ADR are updated if behavior, filters, the API, or architecture
      changed.
- [ ] Domain logic stays in `apps/server`; the client only renders and phrases
      text.
- [ ] No secrets, `.env` files, or real personal data in code, fixtures,
      screenshots, or this description (see `SECURITY.md`).
- [ ] Commit messages are English, 15 to 30 words each.
