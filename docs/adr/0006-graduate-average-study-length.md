# ADR 0006: Graduate Average Study Length

- Status: Accepted
- Date: 2026-10-28
- Scope: Graduate Data, Rata-rata Masa Studi Lulusan card and detail

## Context

`requirements/FORMULA.md` §7 adds the average study length of graduates. i3L
allows at most two semesters of cuti, so up to two cuti semesters should not
count as study time. SEVIMA has no study-length field; KOMET computes semesters
itself (ADR 0004). `/mahasiswa` carries no cuti status; `/perwalian` keeps it
per period, and KOMET stores it in `student_cuti_periods` during the student
sync. Five graduates are missing from `/kelulusan` and only have a
`/mahasiswa` exit period, written as a short term (`YYYY3`).

## Decision

- Study length per graduate = `studyPeriodRange` semesters (ADR 0004) minus
  `min(cuti semesters inside that range, 2)`. The third and later cuti
  semesters still count.
- The start is the first i3L period (`periodeMasukAwal` for a continuous
  same-jenjang prodi transfer, else `periodeMasuk`). Semesters at another
  campus are not in SEVIMA and never count.
- The end falls back to `student.periodeTerakhir` when `/kelulusan` has no
  period; a short term reads as the Genap of that year and adds no semester.
- The card averages per jenjang for the selected Tahun Lulus with the Graduate
  filters, shows the jenjang with the most graduates, and gives years as
  semesters ÷ 2. Incomplete data is left out, not counted as zero.
- The cuti deduction applies to this card only. Tepat Waktu and Keberhasilan
  Studi keep calendar semesters (ADR 0004).

## Consequences

- The five graduates without `/kelulusan` now count in every study-length
  metric. Tepat Waktu for all years moved from 91.22% to 91.08%; the default
  Tahun Lulus is unchanged.
- Cuti recorded under a predecessor NIM of a transfer chain is not added to the
  new NIM.
- Cuti history is only as complete as `/perwalian`; periods SEVIMA never
  recorded count as not on cuti.
