import { Award, BookOpen, Building2, CalendarDays, UserCheck } from 'lucide-react';
import { getCurrentAcademicYear, isValidAcademicYear } from '@komet/shared/academicYear';
import { useDashboardFilters } from '../../../hooks/useDashboardFilters';
import { sanitizeSearch } from '../../../utils/querySanitizer';

/** Header selalu menunjuk satu tahun ajaran; tanpa itu server memakai periode terbaru saja. */
const DEFAULT_ACADEMIC_YEAR = getCurrentAcademicYear();

/** Tahun ajaran dari URL yang bentuknya bukan "YYYY/YYYY" dikembalikan ke tahun berjalan. */
const sanitizeAcademicYear = (value) =>
  isValidAcademicYear(value) ? value : DEFAULT_ACADEMIC_YEAR;

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
  // Tahun ajaran dipilih di header halaman, bukan di grid filter.
  tahunAjaran: {
    initial: DEFAULT_ACADEMIC_YEAR,
    param: 'tahunAjaran',
    setter: 'setTahunAjaran',
    sanitize: sanitizeAcademicYear,
    clears: ['periode'],
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
    optionsKey: 'periodeOptions',
    placeholder: 'Semua Periode MBKM',
  },
};

export const mbkmFilterForm = {
  title: 'Filter & Pencarian MBKM',
  secondRowColumns: 4,
  fields: mbkmFilterFields,
};

export function useMbkmFilters() {
  return useDashboardFilters({ fields: mbkmFilterFields });
}
