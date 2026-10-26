# Security Policy

KOMET is internal software of Universitas Bio Scientia Internasional Indonesia
(i3L University). It processes personal data of students and graduates, so
security reports and data handling follow the rules below.

## Supported versions

Only the latest commit on `main` is supported. There are no maintained release
branches.

## Reporting a vulnerability

Report suspected vulnerabilities privately. Do not open a public issue, merge
request, or discussion, and do not include exploit details in commit messages.

- i3L team members: contact the KOMET maintainers directly through internal
  i3L channels.
- Anyone else: write to i3L through the official contact channels listed at
  https://i3l.ac.id and ask for the message to be forwarded to the KOMET
  maintainers.

Include the affected component, steps to reproduce, the impact you expect, and
whether personal data may be exposed. Maintainers acknowledge the report and
keep the reporter informed until it is resolved.

Do not access, copy, modify, or delete data that is not yours while
investigating. Testing against production data or accounts is not permitted.

## Personal data

KOMET stores personal data synchronized from SEVIMA, which is protected under
Law No. 27 of 2022 on Personal Data Protection (UU PDP):

- Students: NIM, name, NIK, date of birth, nationality, study program, intake
  and status history, and semester.
- Graduates: graduation year and period, IPK, predikat, and credits.
- MBKM: activity type, title, partner, and status per student.

Rules for everyone working on this repository:

- Never commit `.env` files, database dumps, exports, screenshots with real
  student data, logs, or SEVIMA responses. `.env.example` holds placeholders
  only.
- Never paste real personal data into issues, merge requests, chat tools, or AI
  assistants. Use synthetic fixtures in tests.
- API responses expose only the fields a screen needs. NIK and date of birth
  are not returned by the list endpoints; keep it that way.
- Do not log personal data. Log identifiers only when needed for debugging, and
  never NIK or date of birth.
- Personal data stays on i3L-controlled infrastructure. Copying it elsewhere
  needs written approval from i3L.

## Secrets

Secrets live only in `apps/server/.env`: `DATABASE_URL`, `SEVIMA_APP_KEY`,
`SEVIMA_SECRET_KEY`, `SYNC_API_KEY`, and `SESSION_SECRET`. Every `VITE_*`
variable is bundled into the browser and is therefore public.

If a secret is committed or leaked, treat it as compromised: rotate it
immediately, then remove it from the repository. Rewriting git history alone
does not make a leaked secret safe again.

## Automated checks

The GitLab pipeline (`.gitlab-ci.yml`) runs GitLab Secret Detection and
`pnpm audit --prod --audit-level high` on every merge request and branch push.
On GitLab Free, Secret Detection only writes a report, so the
`secret_detection_gate` job fails the pipeline when that report lists a finding.
Security fixes for transitive dependencies are pinned with `overrides` in
`pnpm-workspace.yaml`.
