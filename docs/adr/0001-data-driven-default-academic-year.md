# ADR 0001: Data-Driven Default Academic Year

- Status: Accepted
- Date: 2026-10-21
- Scope: Student, Graduate, and MBKM filters

## Context

KOMET displays academic-year filters across several modules. The default year
must follow the data that has actually been synced, not the current calendar
year and not a hardcoded label. When a sync adds a newer academic year, the
default should move forward. When a sync adds nothing newer, the default should
stay where it is.

The default also must not override an explicit user choice. A user who selected
an older year must keep that selection even if a background sync adds a newer
year.

Student, Graduate, and MBKM use different event dates. A single global default
would mix unrelated semantics, so each module must derive its default from its
own data population.

## Decision

Use the latest academic year present in each module's data as the default for
that module, with an explicit user selection taking precedence.

### Default rules

1. If the URL contains an explicit academic year or graduation year, use it.
2. Otherwise, the default is the latest year present in the relevant data.
3. After a successful sync, refetch filter options and summary data.
4. If newer data exists, advance the default only when the user has not made an
   explicit selection.
5. If no newer data exists, keep the current default.
6. If sync fails, keep the last known default and surface the failure.
7. If the dataset is empty, do not invent a calendar year. Show the agreed
   empty state or an empty default.
8. Keep defaults per module:
   - Student: latest entry period/academic year in student data.
   - Graduate: latest graduation year in graduate data.
   - MBKM: latest academic year in MBKM data.

### Contract

The server should expose explicit defaults in `filterOptions`:

```js
{
  academicYearOptions: ["2026/2027", "2025/2026", "..."],
  defaultAcademicYear: "2026/2027",
  rollingYears: ["2026/2027", "2025/2026", "..."],
  defaultTahunLulus: "2026/2027"
}
```

Clients must consume the explicit default. They must not infer it from
`array[0]` when the server can provide it directly.

## Current implementation

The codebase is partially aligned:

- `apps/server/src/services/graduates/filterOptions.js` derives
  `academicYearOptions` from `tahunLulus` and `rollingYears` from synced data.
- `apps/client/src/components/common/layout/DashboardPage.jsx` reads
  `academicYearOptions[0]` and `rollingYears[0]`.
- `apps/client/src/modules/graduates/hooks/useGraduateFilters.js` applies the
  latest graduation year as the default.

Follow-up implementation work:

- Add `defaultAcademicYear` and `defaultTahunLulus` to the `filterOptions`
  response contract and consume them in the client.
- Remove calendar-year fallbacks from default selection paths when data-driven
  options are available.
- Preserve an explicit user selection when the default advances after sync.
- Ensure successful sync invalidates/refetches filter options and summaries.
- Add server and client regression tests for the acceptance criteria below.

## Acceptance criteria

- A sync that adds `2027/2028` moves the default to `2027/2028` when the user
  has not chosen a year explicitly.
- A sync that adds no newer year leaves the default unchanged.
- A user-selected older year is not overwritten by a sync that adds a newer
  year.
- A failed sync leaves the last known default visible.
- Empty data does not produce a fabricated academic year.
- Student, Graduate, and MBKM can resolve different defaults from their own
  data.
- The behavior is covered by server and client tests.

## Consequences

- Filter behavior becomes predictable after sync.
- Default labels no longer depend on the calendar.
- The API contract becomes slightly larger, but the client no longer has to
  guess ordering or fallback behavior.
- Tests must distinguish between the default path and an explicit user choice.

## References

- `AGENTS.md`
- `docs/ENGINEERING.md`
- `apps/server/src/services/graduates/filterOptions.js`
- `apps/client/src/components/common/layout/DashboardPage.jsx`
- `apps/client/src/modules/graduates/hooks/useGraduateFilters.js`
