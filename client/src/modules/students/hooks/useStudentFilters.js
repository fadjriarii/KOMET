import { useState, useMemo, useCallback } from 'react';
import {
  buildStudentListQuery,
  getStudentActiveFilterCount,
} from '../../../utils/logic';

const DEFAULT_STATUS = 'Aktif';

export function useStudentFilters(angkatanOptions = [], tableLimit = 10) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedProdi, setSelectedProdi] = useState('');
  const [selectedJenjang, setSelectedJenjang] = useState('');
  const [selectedYears, setSelectedYears] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedNationality, setSelectedNationality] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(DEFAULT_STATUS);
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

  const studentListQuery = useMemo(
    () =>
      buildStudentListQuery(filterValues, angkatanOptions, {
        limit: tableLimit,
      }),
    [filterValues, angkatanOptions, tableLimit]
  );

  const activeFilterCount = useMemo(
    () => getStudentActiveFilterCount(filterValues),
    [filterValues]
  );

  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedFaculty('');
    setSelectedProdi('');
    setSelectedJenjang('');
    setSelectedYears([]);
    setSelectedSemester('');
    setSelectedNationality('');
    setSelectedStatus(DEFAULT_STATUS);
    setSelectedPeriode('');
  }, []);

  return {
    values: {
      searchQuery,
      selectedFaculty,
      selectedProdi,
      selectedJenjang,
      selectedYears,
      selectedSemester,
      selectedNationality,
      selectedStatus,
      selectedPeriode,
    },
    setters: {
      setSearchQuery,
      setSelectedFaculty,
      setSelectedProdi,
      setSelectedJenjang,
      setSelectedYears,
      setSelectedSemester,
      setSelectedNationality,
      setSelectedStatus,
      setSelectedPeriode,
    },
    studentListQuery,
    activeFilterCount,
    resetFilters,
  };
}
