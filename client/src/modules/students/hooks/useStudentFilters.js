import { useState, useMemo, useCallback } from 'react';
import { getStudentActiveFilterCount } from '../utils/studentQuery';

const DEFAULT_STATUS = 'Aktif';
const MAX_SEARCH_LENGTH = 100;

/**
 * Sanitize search input: trim, strip control characters, enforce max length.
 */
function sanitizeSearchInput(value) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\u0000-\u001F\u007F]/g, '') // Remove control characters
    .trim()
    .substring(0, MAX_SEARCH_LENGTH);
}

/**
 * useStudentFilters - Hook khusus untuk state form filter di dalam StudentFilterContainer.
 *
 * Filter yang dikelola di sini adalah filter lokal kontainer:
 * - Search by Identifier / Nama
 * - Fakultas
 * - Program Studi
 * - Jenjang
 * - Angkatan (5 tahun rolling)
 * - Semester
 * - Kewarganegaraan (WNI/WNA)
 * - Status Keaktifan (Aktif, dsb.)
 * - Periode Masuk (Ganjil/Genap)
 *
 * Note: Pilihan Tahun Ajaran (Header) dikelola secara terpisah dan independen
 * dari container filter ini agar reset filter tidak mempengaruhi tahun ajaran.
 */
export function useStudentFilters() {
  const [searchQuery, setSearchQueryState] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState([]);
  const [selectedProdi, setSelectedProdi] = useState([]);
  const [selectedJenjang, setSelectedJenjang] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState([]);
  const [selectedNationality, setSelectedNationality] = useState('');
  const [selectedStatus, setSelectedStatus] = useState([DEFAULT_STATUS]);
  const [selectedPeriode, setSelectedPeriode] = useState('');

  // Sanitized setter for search query
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
      selectedYears,
      semester: selectedSemester,
      nationality: selectedNationality,
      status: selectedStatus,
      periode: selectedPeriode,
    }),
    [
      searchQuery,
      selectedFaculty,
      selectedProdi,
      selectedJenjang,
      selectedYears,
      selectedSemester,
      selectedNationality,
      selectedStatus,
      selectedPeriode,
    ]
  );

  const filterParams = filterValues;

  const activeFilterCount = useMemo(
    () => getStudentActiveFilterCount(filterValues),
    [filterValues]
  );

  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedFaculty([]);
    setSelectedProdi([]);
    setSelectedJenjang([]);
    setSelectedYears([]);
    setSelectedSemester([]);
    setSelectedNationality('');
    setSelectedStatus([DEFAULT_STATUS]);
    setSelectedPeriode('');
  }, [setSearchQuery]);

  const values = useMemo(() => ({
    searchQuery,
    selectedFaculty,
    selectedProdi,
    selectedJenjang,
    selectedYears,
    selectedSemester,
    selectedNationality,
    selectedStatus,
    selectedPeriode,
  }), [
    searchQuery,
    selectedFaculty,
    selectedProdi,
    selectedJenjang,
    selectedYears,
    selectedSemester,
    selectedNationality,
    selectedStatus,
    selectedPeriode,
  ]);

  const setters = useMemo(() => ({
    setSearchQuery,
    setSelectedFaculty,
    setSelectedProdi,
    setSelectedJenjang,
    setSelectedYears,
    setSelectedSemester,
    setSelectedNationality,
    setSelectedStatus,
    setSelectedPeriode,
  }), [setSearchQuery]);

  return {
    // `values` untuk binding komponen UI; `filterParams` untuk service/API.
    values,
    setters,
    filterParams,
    activeFilterCount,
    resetFilters,
  };
}