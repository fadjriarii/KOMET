# ADR 0004: Graduate Study Length in Semesters

- Status: Accepted
- Date: 2026-10-26
- Scope: Graduate Data, Kelulusan Tepat Waktu and Keberhasilan Studi

## Context

Study length was the difference between two academic-year start years:
`start(tahunLulus) − start(entry)`. An S1 student entering 20201 and finishing
in 20241, the ninth semester, scored 4. The rule `≤ 4` counted that student as
on time. Profesi needed a special case because a same-year finish scored 0.

Keberhasilan Studi counted every student of the evaluated cohort who ever
graduated, with no time limit. It grouped cohorts by the `periodeMasuk` year,
while Tepat Waktu and the Angkatan filter use the `angkatan` column. D3 and D4
had no limits, so both cards returned null for them.

## Decision

- Study length is counted in semesters, inclusive: from `periodeMasukAwal`
  (start of a transfer chain), else `periodeMasuk`, else `angkatan` as Ganjil,
  to `graduate.periodeWisuda`. Without a graduation period, `tahunLulus` is read
  as its Genap term. The helper is `studySemesters` in
  `apps/server/src/utils/academic/period.js`.
- One limits table, `apps/server/src/services/graduates/studyLimits.js`:

  | Jenjang | On time (years) | Maximum (years) |
  | ------- | --------------- | --------------- |
  | S1      | 4               | 8               |
  | S2      | 2               | 4               |
  | Profesi | 1               | 2               |
  | S3      | 3               | 6               |
  | D3      | 3               | 5               |
  | D4      | 4               | 7               |

- Tepat Waktu: a graduate is on time when semesters ≤ on time × 2. In the cohort
  chart, fewer semesters is "lebih cepat", exactly on time × 2 is "tepat", and
  more is "lewat". There is no Profesi special case.
- Keberhasilan Studi: the denominator is every student of the `angkatan`. The
  numerator is the graduates of that angkatan who finished within maximum × 2
  semesters. The evaluated angkatan is the selected academic year minus the
  maximum, so S1 moves from TA − 7 to TA − 8.
- S1, S2 and Profesi follow i3L rules. S3, D3 and D4 use national standards until
  their data exists.

## Consequences

- Tepat Waktu rates drop where graduates finished in the first semester after
  the limit. Keberhasilan Studi drops where graduates finished after the
  maximum, and S1 evaluates an older angkatan.
- The card and the cohort chart share one duration rule, so their numbers agree
  for the same population.
- Rows synced from `tanggal_keluar` without a graduation period use the Genap
  assumption, which can misclassify a Ganjil finish as one semester later.
- Unchanged: the Tepat Waktu card still divides by graduates in scope, not by
  the whole intake cohort as `requirements/FORMULA.md` describes. Changing the
  denominator needs its own decision.
