import { useMemo } from 'react';

/** Memoized prop groups consumed by MbkmFilterContainer. */
export function useMbkmFilterControls(filters, filterSetters, options = {}) {
  const filterControlValues = useMemo(
    () => ({
      searchValue: filters.searchQuery,
      facultyValue: filters.selectedFaculty,
      prodiValue: filters.selectedProdi,
      jenjangValue: filters.selectedJenjang,
      angkatanValue: filters.selectedAngkatan,
      statusAktivitasValue: filters.selectedStatusAktivitas,
      periodeValue: filters.selectedPeriode,
    }),
    [filters],
  );

  const filterControlOptions = useMemo(
    () => ({
      facultyOptions: options.fakultas || [],
      prodiOptions: options.programStudi || [],
      jenjangOptions: options.jenjang || ['S1', 'S2'],
      angkatanOptions: options.angkatan || ['2024', '2023', '2022', '2021', '2020'],
      statusAktivitasOptions: options.statusAktivitas || ['Disetujui', 'Selesai', 'Diajukan'],
      periodeOptions: options.periode || [],
    }),
    [options],
  );

  const filterHandlers = useMemo(
    () => ({
      onSearchChange: filterSetters.setSearchQuery,
      onSearchClear: () => filterSetters.setSearchQuery(''),
      onFacultyChange: filterSetters.setSelectedFaculty,
      onProdiChange: filterSetters.setSelectedProdi,
      onJenjangChange: filterSetters.setSelectedJenjang,
      onAngkatanChange: filterSetters.setSelectedAngkatan,
      onStatusAktivitasChange: filterSetters.setSelectedStatusAktivitas,
      onPeriodeChange: filterSetters.setSelectedPeriode,
    }),
    [filterSetters],
  );

  return { filterControlValues, filterControlOptions, filterHandlers };
}
