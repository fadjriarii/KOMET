import { useDashboardFilters } from '../../../hooks/useDashboardFilters';
import { getMbkmActiveFilterCount } from '../utils/mbkmQuery';
import { sanitizeSearchInput } from '../utils/mbkmQueryValidator';

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
  selectedAngkatan: { initial: [], param: 'angkatan', setter: 'setSelectedAngkatan' },
  selectedStatusAktivitas: {
    initial: [],
    param: 'statusAktivitas',
    setter: 'setSelectedStatusAktivitas',
  },
  selectedPeriode: { initial: '', param: 'periode', setter: 'setSelectedPeriode' },
};

export function useMbkmFilters() {
  return useDashboardFilters({ fields, getActiveFilterCount: getMbkmActiveFilterCount });
}
