import { useMemo } from 'react';

/** Memoized prop groups consumed by StudentFilterContainer. */
export function useStudentFilterControls(filters, filterSetters, options) {
  const filterControlValues = useMemo(() => ({
    searchValue: filters.searchQuery,
    facultyValue: filters.selectedFaculty,
    prodiValue: filters.selectedProdi,
    jenjangValue: filters.selectedJenjang,
    selectedYears: filters.selectedYears,
    semesterValue: filters.selectedSemester,
    nationalityValue: filters.selectedNationality,
    statusValue: filters.selectedStatus,
    periodeValue: filters.selectedPeriode,
  }), [filters]);

  const filterControlOptions = useMemo(() => ({
    facultyOptions: options.fakultas || [],
    prodiOptions: options.programStudi || [],
    jenjangOptions: options.jenjang || [],
    rollingYears: options.rollingYears || [],
    semesterOptions: options.semesterOptions || [],
    nationalityOptions: options.nationalityOptions || [],
    statusOptions: options.statusKeaktifan || [],
    periodeOptions: options.periodeOptions || [],
  }), [options]);

  const filterHandlers = useMemo(() => ({
    onSearchChange: filterSetters.setSearchQuery,
    onSearchClear: () => filterSetters.setSearchQuery(''),
    onFacultyChange: filterSetters.setSelectedFaculty,
    onProdiChange: filterSetters.setSelectedProdi,
    onJenjangChange: filterSetters.setSelectedJenjang,
    onAngkatanChange: filterSetters.setSelectedYears,
    onSemesterChange: filterSetters.setSelectedSemester,
    onNationalityChange: filterSetters.setSelectedNationality,
    onStatusChange: filterSetters.setSelectedStatus,
    onPeriodeChange: filterSetters.setSelectedPeriode,
  }), [filterSetters]);

  return { filterControlValues, filterControlOptions, filterHandlers };
}
