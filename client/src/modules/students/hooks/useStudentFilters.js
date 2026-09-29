import { useState, useMemo, useCallback } from 'react';
import { getStudentActiveFilterCount } from '../utils/studentQuery';

const DEFAULT_STATUS = 'Aktif';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState([]);
  const [selectedProdi, setSelectedProdi] = useState([]);
  const [selectedJenjang, setSelectedJenjang] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState([]);
  const [selectedNationality, setSelectedNationality] = useState('');
  const [selectedStatus, setSelectedStatus] = useState([DEFAULT_STATUS]);
  const [selectedPeriode, setSelectedPeriode] = useState('');

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
  }, []);

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
  }), []);

  return {
    // `values` untuk binding komponen UI; `filterParams` untuk service/API.
    values,
    setters,
    filterParams,
    activeFilterCount,
    resetFilters,
  };
}
