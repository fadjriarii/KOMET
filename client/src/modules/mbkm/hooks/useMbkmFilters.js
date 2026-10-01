import { useState, useMemo, useCallback } from 'react';
import { getMbkmActiveFilterCount } from '../utils/mbkmQuery';
import { sanitizeSearchInput } from '../utils/mbkmQueryValidator';

/**
 * useMbkmFilters - Hook state filter untuk form MbkmFilterContainer
 */
export function useMbkmFilters() {
  const [searchQuery, setSearchQueryState] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState([]);
  const [selectedProdi, setSelectedProdi] = useState([]);
  const [selectedJenjang, setSelectedJenjang] = useState([]);
  const [selectedAngkatan, setSelectedAngkatan] = useState([]);
  const [selectedStatusAktivitas, setSelectedStatusAktivitas] = useState([]);
  const [selectedPeriode, setSelectedPeriode] = useState('');

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
      angkatan: selectedAngkatan,
      statusAktivitas: selectedStatusAktivitas,
      periode: selectedPeriode,
    }),
    [
      searchQuery,
      selectedFaculty,
      selectedProdi,
      selectedJenjang,
      selectedAngkatan,
      selectedStatusAktivitas,
      selectedPeriode,
    ]
  );

  const filterParams = filterValues;

  const activeFilterCount = useMemo(
    () => getMbkmActiveFilterCount(filterValues),
    [filterValues]
  );

  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedFaculty([]);
    setSelectedProdi([]);
    setSelectedJenjang([]);
    setSelectedAngkatan([]);
    setSelectedStatusAktivitas([]);
    setSelectedPeriode('');
  }, [setSearchQuery]);

  const values = useMemo(() => ({
    searchQuery,
    selectedFaculty,
    selectedProdi,
    selectedJenjang,
    selectedAngkatan,
    selectedStatusAktivitas,
    selectedPeriode,
  }), [
    searchQuery,
    selectedFaculty,
    selectedProdi,
    selectedJenjang,
    selectedAngkatan,
    selectedStatusAktivitas,
    selectedPeriode,
  ]);

  const setters = useMemo(() => ({
    setSearchQuery,
    setSelectedFaculty,
    setSelectedProdi,
    setSelectedJenjang,
    setSelectedAngkatan,
    setSelectedStatusAktivitas,
    setSelectedPeriode,
  }), [setSearchQuery]);

  return {
    values,
    setters,
    filterParams,
    activeFilterCount,
    resetFilters,
  };
}
