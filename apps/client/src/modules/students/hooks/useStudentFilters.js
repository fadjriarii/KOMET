import { useDashboardFilters } from '../../../hooks/useDashboardFilters';
import { getStudentActiveFilterCount } from '../utils/studentQuery';

const sanitizeSearchInput = (value) =>
  typeof value === 'string'
    ? value
        .split('')
        .filter((character) => character >= ' ' && character !== '\u007F')
        .join('')
        .trim()
        .slice(0, 100)
    : '';

const fields = {
  searchQuery: {
    initial: '',
    param: 'search',
    setter: 'setSearchQuery',
    sanitize: sanitizeSearchInput,
  },
  selectedFaculty: { initial: [], param: 'faculty', setter: 'setSelectedFaculty' },
  selectedProdi: { initial: [], param: 'prodi', setter: 'setSelectedProdi' },
  selectedJenjang: { initial: [], param: 'jenjang', setter: 'setSelectedJenjang' },
  selectedYears: { initial: [], setter: 'setSelectedYears' },
  selectedSemester: { initial: [], param: 'semester', setter: 'setSelectedSemester' },
  selectedNationality: { initial: '', param: 'nationality', setter: 'setSelectedNationality' },
  selectedStatus: { initial: ['Aktif'], param: 'status', setter: 'setSelectedStatus' },
  selectedPeriode: { initial: '', param: 'periode', setter: 'setSelectedPeriode' },
};

export function useStudentFilters() {
  return useDashboardFilters({ fields, getActiveFilterCount: getStudentActiveFilterCount });
}
