# ADR 0003: MBKM Filter Scope and Cohort Anchor

- Status: Accepted
- Date: 2026-10-22
- Scope: MBKM Data filters and KPI scope

## Context

The MBKM page exposed an Angkatan filter even though the eligible population is
defined per period as active students in semester 7, not by intake cohort.
Angkatan options were global, so most choices produced an empty population, and
the filter duplicated the academic year that already selects the cohort.

At the same time, the product requirements list Jenis Aktivitas MBKM (BKP) and
Nama Mitra, but the page did not expose either even though the table showed both
columns. A partner dropdown does not scale: partner names are many and global,
so loading them all as filter options would grow without bound.

## Decision

- Remove Angkatan from the MBKM filter form. The academic year and period are
  the cohort anchor.
- Add Jenis Aktivitas MBKM as a filter.
- Search NIM, name, and partner through the main search box instead of adding a
  separate partner filter. The search narrows participants and participation
  rate, not the eligible denominator.
- Keep the Mitra card period-level over all activities. It is not narrowed by
  search or activity filters.
- Keep `angkatan` accepted by the API for existing API callers. The client no
  longer sends it.

## Consequences

- The MBKM page now differs from the filter list in the current PRD: partner is
  searchable rather than a standalone filter. This ADR records that deviation.
- BKP options come from server data and are cached with the other filter
  options. Partner search runs in the database, so no large option list is sent
  to the browser.
- Card subtitles name BKP on participant and rate cards, and state that activity
  filters and search do not change the eligible card.
- Reintroducing cohort analysis by intake year requires scoped options and a new
  decision; it must not reuse the old global Angkatan list.
