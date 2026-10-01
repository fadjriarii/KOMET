import { useState, useMemo, useCallback } from 'react';
import { getGraduateActiveFilterCount } from '../utils/graduateQuery';
import { sanitizeSearchInput } from '../utils/graduateQueryValidator';

/**
 * useGraduateFilters - Hook state filter untuk form GraduateFilterContainer
 */
export function useGraduateFilters() {
  const [searchQuery, setSearchQueryState] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState([]);
  const [selectedProdi, setSelectedProdi] = useState([]);
  const [selectedJenjang, setSelectedJenjang] = useState([]);
  const [selectedTahunLulus, setSelectedTahunLulus] = useState([]);
  const [selectedPeriodeWisuda, setSelectedPeriodeWisuda] = useState([]);
  const [selectedStatusKelulusan, setSelectedStatusKelulusan] = useState([]);
  const [selectedPeriodeMasuk, setSelectedPeriodeMasuk] = useState('');

  const setSearchQuery = useCallback((value) => {
    const sanitized = sanitizeSearchInput(value);
    setSearchQueryState(sanitized);
  }, []);

  const filterValues = useMemo(
    () => ({
      search: searchQuery,
      faculty: selectedFaculty,
      prodi: selectedProdi,
      jenjang: selectedJenjang,
      tahunLulus: selectedTahunLulus,
      periodeWisuda: selectedPeriodeWisuda,
      statusKelulusan: selectedStatusKelulusan,
      periodeMasuk: selectedPeriodeMasuk,
    }),
    [
      searchQuery,
      selectedFaculty,
      selectedProdi,
      selectedJenjang,
      selectedTahunLulus,
      selectedPeriodeWisuda,
      selectedStatusKelulusan,
      selectedPeriodeMasuk,
    ]
  );

  const filterParams = filterValues;

  const activeFilterCount = useMemo(
    () => getGraduateActiveFilterCount(filterValues),
    [filterValues]
  );

  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedFaculty([]);
    setSelectedProdi([]);
    setSelectedJenjang([]);
    setSelectedTahunLulus([]);
    setSelectedPeriodeWisuda([]);
    setSelectedStatusKelulusan([]);
    setSelectedPeriodeMasuk('');
  }, [setSearchQuery]);

  const values = useMemo(() => ({
    searchQuery,
    selectedFaculty,
    selectedProdi,
    selectedJenjang,
    selectedTahunLulus,
    selectedPeriodeWisuda,
    selectedStatusKelulusan,
    selectedPeriodeMasuk,
  }), [
    searchQuery,
    selectedFaculty,
    selectedProdi,
    selectedJenjang,
    selectedTahunLulus,
    selectedPeriodeWisuda,
    selectedStatusKelulusan,
    selectedPeriodeMasuk,
  ]);

  const setters = useMemo(() => ({
    setSearchQuery,
    setSelectedFaculty,
    setSelectedProdi,
    setSelectedJenjang,
    setSelectedTahunLulus,
    setSelectedPeriodeWisuda,
    setSelectedStatusKelulusan,
    setSelectedPeriodeMasuk,
  }), [setSearchQuery]);

  return {
    values,
    setters,
    filterParams,
    activeFilterCount,
    resetFilters,
  };
}
