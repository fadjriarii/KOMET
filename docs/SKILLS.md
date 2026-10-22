# Agent Skills

This document is the source of truth for installing and authoring agent skills in
KOMET. OpenCode and Claude Code read different directories; the rules below keep
one skill visible to both without duplicate copies.

## Where skills live

| Scope                         | Directory                                 | OpenCode                  | Claude Code | Commit it |
| ----------------------------- | ----------------------------------------- | ------------------------- | ----------- | --------- |
| Global, shared by both tools  | `~/.claude/skills/<id>/SKILL.md`          | Yes, compatibility source | Yes         | No        |
| Global, OpenCode only         | `~/.config/opencode/skills/<id>/SKILL.md` | Yes                       | No          | No        |
| Project, shared with the team | `.claude/skills/<id>/SKILL.md`            | Yes, compatibility source | Yes         | Yes       |
| Project, OpenCode only        | `.opencode/skills/<id>/SKILL.md`          | Yes                       | No          | Yes       |
| Global, agents.md ecosystem   | `~/.agents/skills/<id>/SKILL.md`          | Yes, compatibility source | No          | No        |

Use `~/.claude/skills/` for a global skill that should work in both tools. Use
`.claude/skills/` and `.opencode/skills/` for a project skill that teammates
must receive through Git.

The canonical global store is `~/.agents/skills/`. It is read directly by
OpenCode, Codex, and Antigravity CLI. Skills that Claude Code must also see are
symlinked into `~/.claude/skills/` instead of copied, so one directory holds the
only copy:

```bash
ln -sfn ~/.agents/skills/<id> ~/.claude/skills/<id>
```

Claude Code plugins can also provide skills. Manage those with `claude plugin`
instead of copying files; the ponytail skills are installed this way.

Directories such as `.agents/`, `.codex/`, `.gemini/`, `.kilo/`, and `.qoder/`
are git-ignored on purpose. A project skill placed there will not be committed.

## Skill IDs

- The directory name is the skill ID. It is case-sensitive and must be unique.
- Use lowercase kebab-case, 1–64 characters: `release-notes`, `db-migration`.
- The frontmatter `name` is only a display label. It does not change the ID.
- If two sources define the same ID, the source registered later wins silently.
  Check for collisions before installing.
- OpenCode searches each source up to six directories deep. A directory
  containing `SKILL.md` is one skill; nested skills are not searched.

```bash
# Check for an ID collision across installed sources.
find ~/.claude/skills ~/.config/opencode/skills ~/.agents/skills \
  -maxdepth 6 -name SKILL.md -printf '%h\n' 2>/dev/null | xargs -r -n1 basename | sort | uniq -d
```

## Install an open-source skill

1. Download or clone the skill into a temporary directory. Do not run its
   installer or scripts.
2. Scan it before installation:

   ```bash
   skillspector scan <path> --no-llm --format json --output /tmp/skillspector-report.json
   ```

   Read the report and the flagged source. Prefer the `skill-inspector` skill
   for the full source-aware review.

3. Check the ID for collisions with the command above.
4. Copy the whole skill directory, including `scripts/` and `references/`, into
   one of the locations in the table. Preserve the directory structure.
5. Confirm the `description` contains the phrases that should trigger the skill.
6. Test it with a request that should trigger it, and one that should not.

## Write a manual skill

Create `SKILL.md` with frontmatter:

```markdown
---
name: Release Notes
description: Prepare release notes from merged changes. Use for release notes, changelogs, or version bumps.
---

## Workflow

1. Read `references/release-policy.md`.
2. Summarize merged changes since the previous tag.
3. Propose the version bump before changing files.
```

Keep related scripts, references, and templates next to `SKILL.md`. Paths inside
the skill are relative to the directory containing `SKILL.md`.

Use `metadata.opencode/autoinvoke: false` (or `disable-model-invocation: true`)
when the skill should only be loaded explicitly by ID.

## Installed global skills

| Skill                     | Purpose                                          | Token rule                                             |
| ------------------------- | ------------------------------------------------ | ------------------------------------------------------ |
| `ponytail`                | Lazy senior dev mode, smallest correct change    | Loaded at session start                                |
| `antislop` + `antislop-*` | Filter against generic AI UI, copy, and comments | UI/UX work only, core + one child skill, never all six |
| `playwright-cli`          | Real browser verification and page snapshots     | Loaded only when verifying a UI in a browser           |
| `skill-inspector`         | Source-aware review of a candidate skill         | Before installing any skill                            |
| `insecure-defaults`       | Audit for fail-open config and hardcoded secrets | Config, auth, Docker, and IaC work only                |

`antislop` is a filter, not a design system. In KOMET its direction comes from
`DESIGN.md`, which points at the `digital-blue` theme and
`components/common/ui/`. Loading the antislop core on a backend task is a token
regression, not a quality gain.

## Browser verification

`playwright-cli` is installed globally (`@playwright/cli`) and its skills live
in `~/.agents/skills/playwright-cli/`. It drives a real Chromium session so an
agent can verify loading, empty, and error states that `vitest` cannot see.

```bash
playwright-cli open --browser=chromium http://localhost:5173
playwright-cli snapshot
playwright-cli close
```

It writes session artifacts to `.playwright-cli/`, which is git-ignored. Do not
turn it into a committed end-to-end suite without a separate decision; the
project uses `vitest` for automated tests.

## Multi-agent installation

`npx skills add <owner>/<repo>` installs into `~/.agents/skills/` and symlinks
into the agent directories it detects, including Claude Code, Codex, OpenCode,
Qoder, Antigravity CLI, and Hermes. Two caveats:

- It performs no security scan. Run `skillspector scan <path>` yourself first.
- Project-scope installs for Codex land in `.agents/skills/` and for Qoder in
  `.qoder/skills/`, both git-ignored here. Use `.claude/skills/` or
  `.opencode/skills/` for a project skill that must be committed.

## Security rules

- Treat every downloaded skill as untrusted input: read `SKILL.md`, scripts,
  dependency files, and any MCP manifest before installing.
- Never install a skill that reads credentials, agent memory, or home config
  without a documented, bounded reason.
- Never execute scripts from a skill during review.
- Do not commit secrets, tokens, cookies, or real institutional data inside a
  skill.
- Keep skill permissions narrow. Prefer documented commands over broad shell
  access.
