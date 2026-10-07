import { Award, BookOpen, Building2, CalendarDays, Flag, Layers, UserCheck } from 'lucide-react';
import { getCurrentAcademicYear, isValidAcademicYear } from '@komet/shared/academicYear';
import { STUDENT_STATUS } from '@komet/shared/constants';
import { useDashboardFilters } from '../../../hooks/useDashboardFilters';
import { sanitizeSearch } from '../../../utils/querySanitizer';

const DEFAULT_ACADEMIC_YEAR = getCurrentAcademicYear();

/** Tahun ajaran dari URL yang bentuknya bukan "YYYY/YYYY" dikembalikan ke tahun berjalan. */
const sanitizeAcademicYear = (value) =>
  isValidAcademicYear(value) ? value : DEFAULT_ACADEMIC_YEAR;

/**
 * Satu daftar field untuk seluruh siklus filter mahasiswa: nama state, param URL,
 * nama param server (`api`, dipakai mencocokkan badge "Terfilter" dengan
 * `kpiFilterScope`), dan kontrol tampilannya.
 */
export const studentFilterFields = {
  searchQuery: {
    initial: '',
    param: 'search',
    setter: 'setSearchQuery',
    sanitize: sanitizeSearch,
    control: 'search',
    row: 1,
    label: 'Cari Mahasiswa',
    placeholder: 'Cari berdasarkan NIM atau Nama...',
  },
  // Tahun ajaran dipilih di header halaman, bukan di form filter.
  tahunAjaran: {
    initial: DEFAULT_ACADEMIC_YEAR,
    param: 'tahunAjaran',
    setter: 'setTahunAjaran',
    sanitize: sanitizeAcademicYear,
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
  selectedYears: {
    initial: [],
    api: 'angkatanTahun',
    setter: 'setSelectedYears',
    control: 'years',
    label: 'Angkatan',
    optionsKey: 'rollingYears',
    placeholder: 'Pilih Tahun',
    allTimeLabel: 'All Time',
    yearLabel: 'Angkatan',
  },
  selectedSemester: {
    initial: [],
    param: 'semester',
    setter: 'setSelectedSemester',
    control: 'multi',
    label: 'Semester',
    icon: Layers,
    optionsKey: 'semesterOptions',
    placeholder: 'Semua Semester',
  },
  selectedNationality: {
    initial: '',
    param: 'nationality',
    api: 'kewarganegaraan',
    setter: 'setSelectedNationality',
    control: 'single',
    label: 'Kewarganegaraan',
    icon: Flag,
    optionsKey: 'nationalityOptions',
    placeholder: 'Semua Kewarganegaraan',
  },
  selectedStatus: {
    initial: [STUDENT_STATUS.AKTIF],
    param: 'status',
    api: 'statusKeaktifan',
    setter: 'setSelectedStatus',
    control: 'multi',
    label: 'Status Keaktifan',
    icon: UserCheck,
    optionsKey: 'statusKeaktifan',
    placeholder: 'Semua Status',
    defaultValue: [STUDENT_STATUS.AKTIF],
  },
  selectedPeriode: {
    initial: '',
    param: 'periode',
    api: 'periodeMasuk',
    setter: 'setSelectedPeriode',
    control: 'single',
    label: 'Periode Masuk',
    icon: CalendarDays,
    optionsKey: 'periodeOptions',
    placeholder: 'Semua Periode Masuk',
  },
};

export const studentFilterForm = {
  title: 'Filter & Pencarian Mahasiswa',
  secondRowColumns: 5,
  fields: studentFilterFields,
};

export function useStudentFilters() {
  return useDashboardFilters({
    fields: studentFilterFields,
  });
}
