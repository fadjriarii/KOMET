# Changelog

All notable changes to KOMET are recorded in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Version numbers follow the root `package.json`.

## [Unreleased]

### Added

- Student Data Total Mahasiswa detail: Per Status, Per Angkatan, Per Semester,
  and Per Kewarganegaraan tabs. Bars stack by status when the selection holds
  more than one status, and Per Angkatan shows the five academic years up to the
  selected one.
- Student Data Intake and Trend Intake details: Per Program Studi tabs, and an
  Intake "Status Saat Ini" tab that splits each intake year by current status.
  The intake chart highlights the year behind the card number. Data comes from
  `GET /api/students/intake-breakdown`.
- Student Data international detail: Per Negara and Per Program Studi tabs.
- Graduate Data Total Lulusan detail: Per Program Studi and Per Fakultas tabs.
- Graduate summary `kpis.cards`: one object per card with the value, `isEmpty`,
  the year scope, and an ordered per-jenjang breakdown. The on-time and study
  success details return a `jenjangs` tab list with study limits and the
  evaluated angkatan.
- Proprietary `LICENSE` (version 1.1), held by Universitas Bio Scientia
  Internasional Indonesia (i3L University). It is bilingual with the Indonesian
  version prevailing, and covers ownership, internal use, confidentiality,
  publicly viewable repositories, third-party components, contributions,
  termination, and Indonesian governing law. `THIRD_PARTY_NOTICES.md` lists the
  production dependency licenses.
- `GET /api/graduates/filter-options`, so the Graduate page resolves the latest
  Tahun Lulus before the first summary request.
- MBKM filter for activity type (BKP).
- MBKM Data "Rekognisi ≥ 20 SKS" card: participants whose converted credits
  (`mata-kuliah-konversi-mbkm`) total at least 20 in the selected periods.
  Periods without credit data say so instead of showing 0.
- MBKM Data "Kualitas Data" panel (`GET /api/mbkm/data-quality`): feed
  duplicates, unknown NIMs, unclassified statuses, invalid periods, similar
  partner names, unusual credits, and the last sync time.
- MBKM "Status Partisipasi" table filter: participating, not participating
  (eligible students without a counted activity), pending, and below 20 SKS.
- MBKM table columns: activity title, converted credits, start and end dates,
  and "Dihitung" with the reason a row is not counted.
- The MBKM sync stores the SEVIMA activity id, status and type codes, dates,
  converted credits, and the raw row (ADR 0005), and records its feed duplicate
  and unknown NIM counts in the sync history.
- Single-origin presentation mode (`SERVE_CLIENT=true`) and a
  `build:presentation` client script, so a temporary tunnel exposes one port.
- In-process summary response cache, cleared after sync, plus a production
  startup warm-up for filter options and default summaries.
- Route-chunk prefetch on sidebar hover/focus, idle prefetch for detail modal
  chunks, gzip compression for API and static responses, and WebP logos in place
  of the two ~400 KB PNGs.
- `pnpm verify`, run by CI on every push and merge request. `.gitlab-ci.yml`
  also runs GitLab Secret Detection and `pnpm audit --prod --audit-level high`.
- `CONTRIBUTING.md`, `SECURITY.md` (vulnerability reporting and personal data
  rules under UU PDP), and a default GitLab merge request template.
- `engines` (Node 24, pnpm 12) in the root `package.json` and `.nvmrc`.
- Contributor documentation: `AGENTS.md` (with `CLAUDE.md` and `.cursorrules`
  as pointers), `docs/ENGINEERING.md`, `DESIGN.md`, `docs/SKILLS.md`, and the
  documentation map in `README.md`.
- Architecture decisions: data-driven default academic year (ADR 0001),
  schema-only Prisma workflow (ADR 0002), MBKM filter scope (ADR 0003), and
  graduate study length in semesters (ADR 0004).

### Changed

- Graduate Data study length is counted in semesters (ADR 0004). Tepat Waktu
  counts a graduate as on time within the standard length, and Keberhasilan
  Studi counts only graduates within the maximum length (S1 8, S2 4, Profesi
  2 years), grouped by `angkatan` and evaluated at the academic year minus that
  maximum. Rates change accordingly.
- Several selected angkatan are pooled into one Keberhasilan Studi rate;
  angkatan still inside their maximum study length are left out.
- The Graduate Data server owns every domain decision: card values, jenjang
  order and spelling, the default Tahun Lulus trend window, and the 5-cohort
  window. The client only renders and phrases text.
- Detail popups hide tabs that hold a single category, and explain an empty
  filter combination instead of showing an empty chart. Card values with no data
  show "-", and a real 0 stays 0.
- The Student Data decline card is titled "Trend Intake Mahasiswa Baru (over a
  5-year period)"; the 1-year and N-year variants follow the same wording.
- Chart legends render as HTML above the chart (`ChartLegend`), and stacked bars
  round the whole stack end (`roundedStackShape`).
- MBKM Data uses the academic year and period as its cohort anchor. The page no
  longer shows the jenjang, angkatan, or partner filters; search covers NIM,
  name, and partner, and the API still accepts `angkatan` for existing callers.
- MBKM KPI cards explain their metric, filter scope, and inactive status
  handling instead of showing raw period codes and activity-status counts.
- MBKM Data follows one population (ADR 0005). Participants are Disetujui and
  Selesai only; Diajukan shows as "menunggu persetujuan". Status and
  distribution counts are per student, faculty and program filters read Student
  columns, and popup rates are participants ÷ eligible per group. Partners moved
  from a card to the participant popup and exclude rejected and cancelled
  activities. The table uses the same periods as the cards.
- MBKM defaults to the latest academic year in MBKM data, in the client and in
  the server warm-up, instead of the calendar year.
- Dashboard query data stays fresh for five minutes; sync still invalidates the
  affected module immediately.
- Graduate Data waits for filter options before fetching summary and list.
- Reset Filter clears form filters only and keeps the header academic year.
- Schema management uses `db push` only. `prisma/migrations/` was removed, and
  its one data-only fix lives in
  `apps/server/prisma/data/2026-academic-year-labels.sql`.
- Upgraded Prisma to 7.10.1: the connection URL lives in
  `apps/server/prisma.config.ts`, the client uses `@prisma/adapter-mariadb`,
  and `db:push` regenerates the client.
- Refreshed dependencies: React 19.3.1, Vite 8.3.5, Vitest 5.0.5, Express 5.3.0,
  TanStack Query 5.104.5, Zod 4.6.7, Lucide 1.61.0, dotenv 18.0.8, and pnpm
  12.14.0. Redis clients use node-redis 6 (`close()` replaces `quit()`) and
  `rate-limit-redis` 6.0.1.
- Node baseline is 24 LTS, including CI.
- Live-database summary assertions run only with `RUN_DB_TESTS=1`, so the
  default test suite and CI are deterministic.
- Repository layout: `docs/ARCHITECTURE.md` (moved from the root, now
  documenting the barrel pattern and the Student and Graduate filter rules),
  `components/common/dashboard/` (renamed from `layout/`), SEVIMA API docs under
  `requirements/sevima-api-docs/`, and local AI state consolidated in
  `ai-context/`.
- Rewrote `README.md` around the product, its KPIs, and its data flow.

### Removed

- **BREAKING:** the flat S1/S2 graduate API fields. `kpis` on
  `GET /api/graduates/summary` now holds only `cards`, and `summary` is empty.
  Removed fields include `totalGraduatesS1`/`S2`, `averageGpaS1`/`S2`,
  `onTimeGraduationRateS1`/`S2`, `studySuccessRateS1`, `totalGraduatesByJenjang`,
  `onTimeByJenjang`, `averageGpaByJenjang`, `totalScopeLabel`, and
  `totalScopePhrase`; `s1Gpa`, `s2Gpa`, and `gpaByJenjang` on
  `/graduates/ipk-trend`; and the flat `batas*`, `batasStudi*`, and
  `angkatanEvaluasi*` keys on the on-time and study success details. Read
  `kpis.cards` and `jenjangs` instead.
- **BREAKING:** the flat MBKM API fields. `kpis` on `GET /api/mbkm/summary` now
  holds only `cards`, `summary` is empty, and `kpiFilterScope` keys are `rate`,
  `participants`, `eligible`, and `recognition`. The six
  `/api/mbkm/analytics/*-distribution`, `rate`, and `eligible-students`
  endpoints are replaced by `GET /api/mbkm/analytics/:card`, and list rows drop
  `tahun` in favour of `periodeLabel`.
- `mysql2`, which was listed but never imported.
- The placeholder `DATABASE_URL` fallback in `src/config/prisma.js`; unit tests
  receive a non-routable test URL from `vitest.config.mjs`.

### Fixed

- The MBKM sync deleted the table before inserting outside a transaction, kept
  duplicate feed rows, and created placeholder "Aktif" students for unknown
  NIMs. It now writes atomically, keyed by (`idAktivitas`, `nim`), and skips
  unknown NIMs.
- MBKM eligibility treated a non-active student without an exit period as
  active forever.
- Tepat Waktu counted an S1 graduate in the ninth semester as on time, and the
  card and cohort chart read the study start from different fields.
- Keberhasilan Studi counted every eventual graduate with no time limit, and
  grouped cohorts by the entry period year instead of `angkatan`.
- D3 and D4 had no study limits, so their cards were null and their tabs empty.
- Graduate Data treated a 0% rate as missing, spelled Profesi as `PROFESI`,
  showed S1/S2 tabs without data, dropped a Tahun Ajaran equal to the calendar
  year, and overwrote an explicit Tahun Lulus when the default moved.
- Graduate Data percentages are rounded to two decimals everywhere, and `null`
  marks a missing denominator.
- Student Data defaulted Tahun Ajaran to the calendar year instead of the latest
  academic year in student data (ADR 0001).
- The Total Mahasiswa detail and the international numerator ignored the
  semester projection for the selected academic year, so they differed from the
  card.
- The decline detail ignored the selected Angkatan years.
- The international trend chart showed no hover tooltip.
- Chart legends overlapped the bars the first time a detail popup opened.
- Thin last segments made stacked bar ends look square.
- Graduate Data cards, charts, and the table applied the Tahun Ajaran anchor,
  explicit Tahun Lulus, jenjang tabs, and chart windows inconsistently; they now
  share one scope rule, covered by server regression tests.
- Graduate Data rendered an extra empty/default-year request pair before the
  latest graduation year was known.
- Concurrent dashboard queries each minted a student session instead of sharing
  one, and identical summary requests each ran their own computation.
- The live-database summary assertion expected a stale active-student count
  (612 instead of 611).
- Database documentation named the wrong engine. It is MariaDB: `DATABASE_URL`
  uses `mariadb://`, and `prisma.config.ts` rewrites it to the `mysql://`
  scheme the Prisma CLI requires.

### Security

- Patched transitive dependencies through `pnpm-workspace.yaml` overrides:
  `body-parser` 2.4.0 (denial of service via trailing bytes after a compressed
  body) and `ip-address` 10.7.5 (quadratic IPv6 zone parsing).
- Redis-backed rate limiting now uses Redis. Routes load after the Redis client
  connects, so the limiter no longer captures the in-memory store at import.
