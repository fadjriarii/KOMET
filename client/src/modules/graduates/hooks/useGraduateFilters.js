import { useDashboardFilters } from '../../../hooks/useDashboardFilters';
import { getGraduateActiveFilterCount } from '../utils/graduateQuery';
import { sanitizeSearchInput } from '../utils/graduateQueryValidator';

const fields = {
  searchQuery: { initial: '', param: 'search', setter: 'setSearchQuery', sanitize: sanitizeSearchInput },
  selectedFaculty: { initial: [], param: 'faculty', setter: 'setSelectedFaculty' },
  selectedProdi: { initial: [], param: 'prodi', setter: 'setSelectedProdi' },
  selectedJenjang: { initial: [], param: 'jenjang', setter: 'setSelectedJenjang' },
  selectedTahunLulus: { initial: [], param: 'tahunLulus', setter: 'setSelectedTahunLulus' },
  selectedPeriodeWisuda: { initial: [], param: 'periodeWisuda', setter: 'setSelectedPeriodeWisuda' },
  selectedStatusKelulusan: { initial: [], param: 'statusKelulusan', setter: 'setSelectedStatusKelulusan' },
  selectedPeriodeMasuk: { initial: '', param: 'periodeMasuk', setter: 'setSelectedPeriodeMasuk' },
};

export function useGraduateFilters() {
  return useDashboardFilters({ fields, getActiveFilterCount: getGraduateActiveFilterCount });
}
