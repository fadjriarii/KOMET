# ADR 0007: MBKM Card Filter Scope

- Status: Accepted
- Date: 2026-10-30
- Scope: MBKM Data cards, card details, and the table
- Supersedes: the filter-scope parts of ADR 0003 and ADR 0005

## Context

ADR 0005 let every MBKM card read every filter. That produced misleading
numbers:

- Searching one NIM turned the participation card into 1/130 and the total
  card into 1.
- Choosing a non-participating status (Diajukan, Ditolak, Dibatalkan) set every
  card to 0, because cards only count Disetujui and Selesai.
- Choosing one activity type always made the activity-type card "1 jenis".
- The "Terfilter" badge lit on all four cards for any filter, so it could not
  tell the user which numbers had changed.
- The detail banner did not name the faculty or program scope, and the
  participation trend always showed the latest five years in the data instead
  of the five years ending at the selected academic year.

ADR 0003 also said the partner card ignores search and activity filters, which
contradicted ADR 0005 and the code.

## Decision

Each card reads only the filters that are meaningful for it. The table keeps
reading every filter.

| Filter                 | Participation (semester 7) | Total | Partners | Activity types                 | Table |
| ---------------------- | -------------------------- | ----- | -------- | ------------------------------ | ----- |
| Academic year / period | yes                        | yes   | yes      | yes                            | yes   |
| Faculty, program       | numerator and denominator  | yes   | yes      | yes                            | yes   |
| Activity type          | numerator only             | yes   | yes      | no; selected types highlighted | yes   |
| Activity status        | no                         | no    | no       | no                             | yes   |
| Search                 | no                         | no    | no       | no                             | yes   |

- Cards always count participants as Disetujui or Selesai (ADR 0005).
- With several filters active, a card applies the intersection of the filters
  in its own scope.
- A card's detail uses the same scope as the card, so the banner number equals
  the card number.
- The participation trend covers the five academic years ending at the
  academic year of the selected period.

Implementation:

- `services/mbkm/mbkmCards.js` owns the rule: `KPI_FILTER_SCOPE` per card and
  `cardQuery(query, card)`, which keeps only the params in that scope. The
  summary returns `kpiFilterScope`, so the client badge follows the server.
- The summary loads a second population without the type filter only when a
  type is selected. The activity-type card counts that population and lists the
  selected types in `jenis.selected` (share of all participants).
- Summary and detail cache keys use the card scope, so typing a search or
  choosing a status reuses the cached cards.
- The client sends only card params to the summary and detail endpoints
  (`toCardQueryParams` in `mbkmService.js`). Card sentences end with "Filter
  pencarian dan status aktivitas hanya menyaring tabel." when those filters are
  active, and the detail banner reuses the same sentence helpers.

## Consequences

- Search and status no longer reload or change the cards; only the table
  responds.
- The badge marks exactly the cards whose numbers a filter changed.
- A type filter costs one extra population query in the summary.
- `apps/client/tests/dashboardPages.test.jsx` keeps a copy of the scope list;
  it must change together with `KPI_FILTER_SCOPE`.
