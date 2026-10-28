# ADR 0005: MBKM Data Definitions

- Status: Accepted
- Date: 2026-10-27
- Scope: MBKM Data cards, details, table, and the MBKM sync

## Context

`requirements/FORMULA.md` defines one formula, Persentase MBKM = MBKM ÷ Eligible
× 100%, and names student statuses ("Aktif", "Selesai", "Evaluasi") that do not
exist in SEVIMA. SEVIMA reports activity statuses: Diajukan (1), Disetujui (2),
Selesai (5), Ditolak (6), and Dibatalkan (7).

The page had four cards that counted different populations. Participant counts
were per student, status and distribution counts per activity, and the partner
card included rejected and cancelled activities. The sync deleted the table
before inserting, kept no activity key, and dropped SEVIMA fields such as the
activity id, status and type codes, dates, and converted credits (SKS).

KOMET is an early warning system. It reports where participation stands and who
has not participated yet. It has no targets.

## Decision

One population serves every card, detail, and the table:

- **Selected periods:** an explicit `periode`, else both periods of `tahunAjaran`,
  else the latest academic year present in MBKM data.
- **Eligible:** unique students active in semester 7 in any selected period.
  Status per period uses the Student Data snapshot projection; faculty, program,
  jenjang, and angkatan filters read Student columns.
- **Counted activity:** an activity in a selected period whose status category
  is `participating` (Disetujui or Selesai) and whose type is filled, after the
  activity filters (type, status, search).
- **Participant:** an eligible student with at least one counted activity.
- **Participation rate:** participants ÷ eligible × 100. No target is shown.
  One card ("Partisipasi MBKM Semester 7") shows the rate, participants,
  eligible, and those not participating.
- **MBKM students (all semesters):** unique students with at least one
  `participating` activity with a filled type in the selected periods, after
  every filter, in any semester. Shown as "Total Mahasiswa MBKM", with the
  semester projected at the earliest activity period.
- **Partners and activity types:** distinct partners and types of the
  all-semester activities. Rejected and cancelled activities add neither. A
  student can take two types, so type shares can sum past 100%.
- **Partner names:** general rules merge spellings without naming any partner
  in code:
  - spellings that differ only in case, punctuation, a legal word (PT, CV, Tbk,
    Persero), or a plural "-s" are one partner;
  - course-coded MBKM entries ("BM41932 - Research Internship") merge per
    course code;
  - a bare acronym joins the name, or the alias canonical name, that carries
    it in parentheses;
  - a short name joins the only partner whose name starts with its words, and
    its last word may be an abbreviation of at least three letters ("Semen
    Ind" joins "PT Semen Indonesia"); two candidate partners: no merge;
  - a one-letter typo in a name of at least 12 characters is the same partner.

  Other spellings go through the `mbkm_partner_aliases` table (alias →
  canonical), seeded from `prisma/data/mbkm-partner-aliases.sql`. The shown
  name is the canonical alias name, else the most complete spelling: most
  words, then most used, then longest. Distinct course codes and names that
  differ by more than one letter stay separate.

- **Converted credits:** the sum of `sks_mata_kuliah` from
  `mata-kuliah-konversi-mbkm` per activity, shown in the table only. There is
  no credit threshold: a valid activity can convert 3 or 14 SKS. SEVIMA has
  credit data from 2024/2025.

Status categories live in one server table (`services/mbkm/statusRules.js`),
matched by SEVIMA code first and normalized label second:

| Category        | Statuses             | Counted |
| --------------- | -------------------- | ------- |
| `participating` | Disetujui, Selesai   | yes     |
| `pending`       | Diajukan             | no      |
| `rejected`      | Ditolak              | no      |
| `cancelled`     | Dibatalkan           | no      |
| `unclassified`  | any new SEVIMA value | no      |

A new status appears in filters, details, and the table automatically and is
not counted until a rule assigns it a category.

The sync keys activities by (`idAktivitas`, `nim`), because one activity can
belong to several students. It removes duplicate rows from the SEVIMA feed,
writes in one transaction, stores the status and type codes, dates, converted
credits, and the raw SEVIMA row as JSON, and no longer creates placeholder
students for unknown NIMs.

## Consequences

- Participation drops where Diajukan used to count. Status and distribution
  counts become per student, so they add up to the participant card.
- Partner counts follow every filter and exclude rejected or cancelled
  activities.
- New SEVIMA fields are stored in the raw JSON without code changes. Showing a
  new field in the UI is still a deliberate choice, because it may hold personal
  data.
- Assigning a category to a new status is the one decision that still needs a
  code change.
