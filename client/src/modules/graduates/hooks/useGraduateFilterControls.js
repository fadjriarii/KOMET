import { useMemo } from 'react';

/** Memoized prop groups consumed by GraduateFilterContainer. */
export function useGraduateFilterControls(filters, filterSetters, options = {}) {
  const filterControlValues = useMemo(() => ({
    searchValue: filters.searchQuery,
    facultyValue: filters.selectedFaculty,
    prodiValue: filters.selectedProdi,
    jenjangValue: filters.selectedJenjang,
    tahunLulusValue: filters.selectedTahunLulus,
    periodeWisudaValue: filters.selectedPeriodeWisuda,
    statusKelulusanValue: filters.selectedStatusKelulusan,
    periodeMasukValue: filters.selectedPeriodeMasuk,
  }), [filters]);

  const filterControlOptions = useMemo(() => ({
    facultyOptions: options.fakultas || [],
    prodiOptions: options.programStudi || [],
    jenjangOptions: options.jenjang || ['S1', 'S2'],
    tahunLulusOptions: options.tahunLulus || ['2025', '2024', '2023', '2022', '2021'],
    periodeWisudaOptions: options.periodeWisuda || [],
    statusKelulusanOptions: options.statusKelulusan || [],
    periodeMasukOptions: options.periodeMasuk || [],
  }), [options]);

  const filterHandlers = useMemo(() => ({
    onSearchChange: filterSetters.setSearchQuery,
    onSearchClear: () => filterSetters.setSearchQuery(''),
    onFacultyChange: filterSetters.setSelectedFaculty,
    onProdiChange: filterSetters.setSelectedProdi,
    onJenjangChange: filterSetters.setSelectedJenjang,
    onTahunLulusChange: filterSetters.setSelectedTahunLulus,
    onPeriodeWisudaChange: filterSetters.setSelectedPeriodeWisuda,
    onStatusKelulusanChange: filterSetters.setSelectedStatusKelulusan,
    onPeriodeMasukChange: filterSetters.setSelectedPeriodeMasuk,
  }), [filterSetters]);

  return { filterControlValues, filterControlOptions, filterHandlers };
}
