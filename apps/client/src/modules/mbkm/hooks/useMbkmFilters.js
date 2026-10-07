import { Award, BookOpen, Building2, CalendarDays, UserCheck } from 'lucide-react';
import { useDashboardFilters } from '../../../hooks/useDashboardFilters';
import { getMbkmActiveFilterCount } from '../utils/mbkmQuery';
import { sanitizeSearch } from '../../../utils/querySanitizer';

/**
 * Field filter MBKM: state ↔ URL ↔ param server ↔ kontrol tampilan.
 */
export const mbkmFilterFields = {
  searchQuery: {
    initial: '',
    param: 'search',
    setter: 'setSearchQuery',
    sanitize: sanitizeSearch,
    control: 'search',
    row: 1,
    label: 'Cari Aktivitas MBKM',
    placeholder: 'Cari berdasarkan NIM, Nama, atau Instansi...',
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
  selectedAngkatan: {
    initial: [],
    param: 'angkatan',
    setter: 'setSelectedAngkatan',
    control: 'years',
    label: 'Angkatan',
    optionsKey: 'angkatan',
    placeholder: 'Pilih Angkatan',
    allTimeLabel: 'Semua Angkatan',
    yearLabel: 'Angkatan',
  },
  selectedStatusAktivitas: {
    initial: [],
    param: 'statusAktivitas',
    setter: 'setSelectedStatusAktivitas',
    control: 'multi',
    label: 'Status Aktivitas',
    icon: UserCheck,
    optionsKey: 'statusAktivitas',
    placeholder: 'Semua Status Aktivitas',
  },
  selectedPeriode: {
    initial: '',
    param: 'periode',
    setter: 'setSelectedPeriode',
    control: 'single',
    label: 'Periode MBKM',
    icon: CalendarDays,
    optionsKey: 'periode',
    placeholder: 'Semua Periode MBKM',
  },
};

export const mbkmFilterForm = {
  title: 'Filter & Pencarian MBKM',
  secondRowColumns: 3,
  fields: mbkmFilterFields,
};

export function useMbkmFilters() {
  return useDashboardFilters({
    fields: mbkmFilterFields,
    getActiveFilterCount: getMbkmActiveFilterCount,
  });
}
