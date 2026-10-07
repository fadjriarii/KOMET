import { Award, BookOpen, Building2, Calendar, CalendarDays, UserCheck } from 'lucide-react';
import { useDashboardFilters } from '../../../hooks/useDashboardFilters';
import { getGraduateActiveFilterCount } from '../utils/graduateQuery';
import { sanitizeSearch } from '../../../utils/querySanitizer';

/**
 * Field filter lulusan: state ↔ URL ↔ param server ↔ kontrol tampilan.
 */
export const graduateFilterFields = {
  searchQuery: {
    initial: '',
    param: 'search',
    setter: 'setSearchQuery',
    sanitize: sanitizeSearch,
    control: 'search',
    row: 1,
    label: 'Cari Wisudawan',
    placeholder: 'Cari berdasarkan NIM atau Nama wisudawan...',
  },
  selectedFaculty: {
    initial: [],
    param: 'faculty',
    api: 'fakultas',
    setter: 'setSelectedFaculty',
    control: 'multi',
    row: 1,
    label: 'Fakultas',
    icon: Building2,
    optionsKey: 'fakultas',
    placeholder: 'Semua Fakultas',
  },
  selectedProdi: {
    initial: [],
    param: 'prodi',
    api: 'programStudi',
    setter: 'setSelectedProdi',
    control: 'multi',
    row: 1,
    label: 'Program Studi',
    icon: BookOpen,
    optionsKey: 'programStudi',
    placeholder: 'Semua Program Studi',
  },
  selectedJenjang: {
    initial: [],
    param: 'jenjang',
    setter: 'setSelectedJenjang',
    control: 'multi',
    row: 1,
    label: 'Jenjang',
    icon: Award,
    optionsKey: 'jenjang',
    placeholder: 'Semua Jenjang',
  },
  selectedTahunLulus: {
    initial: [],
    param: 'tahunLulus',
    setter: 'setSelectedTahunLulus',
    control: 'years',
    label: 'Tahun Kelulusan',
    optionsKey: 'tahunLulus',
    placeholder: 'Pilih Tahun',
    allTimeLabel: 'Semua Tahun',
    yearLabel: 'Tahun',
  },
  selectedPeriodeWisuda: {
    initial: [],
    param: 'periodeWisuda',
    setter: 'setSelectedPeriodeWisuda',
    control: 'multi',
    label: 'Periode Wisuda',
    icon: CalendarDays,
    optionsKey: 'periodeWisuda',
    placeholder: 'Semua Periode Wisuda',
  },
  selectedStatusKelulusan: {
    initial: [],
    param: 'statusKelulusan',
    setter: 'setSelectedStatusKelulusan',
    control: 'multi',
    label: 'Status Kelulusan',
    icon: UserCheck,
    optionsKey: 'statusKelulusan',
    placeholder: 'Semua Status',
  },
  selectedPeriodeMasuk: {
    initial: '',
    param: 'periodeMasuk',
    setter: 'setSelectedPeriodeMasuk',
    control: 'single',
    label: 'Periode Masuk',
    icon: Calendar,
    optionsKey: 'periodeMasuk',
    placeholder: 'Semua Periode Masuk',
  },
};

export const graduateFilterForm = {
  title: 'Filter & Pencarian Lulusan',
  secondRowColumns: 4,
  fields: graduateFilterFields,
};

export function useGraduateFilters() {
  return useDashboardFilters({
    fields: graduateFilterFields,
    getActiveFilterCount: getGraduateActiveFilterCount,
  });
}
