import { useMemo } from 'react';
import { BookOpen, Briefcase, Building2, CalendarDays, ListChecks, UserCheck } from 'lucide-react';
import { isValidAcademicYear } from '@komet/shared/academicYear';
import { useDashboardFilters } from '../../../hooks/useDashboardFilters';
import { sanitizeSearch } from '../../../utils/querySanitizer';

/** Tahun ajaran dari URL yang bentuknya bukan "YYYY/YYYY" dikembalikan ke default. */
const sanitizeAcademicYear = (value, defaultAcademicYear) =>
  isValidAcademicYear(value) ? value : defaultAcademicYear;

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
    placeholder: 'Cari berdasarkan NIM, Nama, atau Mitra...',
  },
  // Tahun ajaran dipilih di header halaman, bukan di grid filter.
  tahunAjaran: {
    initial: '',
    param: 'tahunAjaran',
    setter: 'setTahunAjaran',
    sanitize: (value) => sanitizeAcademicYear(value, ''),
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
  selectedJenisAktivitas: {
    initial: [],
    param: 'jenisAktivitas',
    setter: 'setSelectedJenisAktivitas',
    control: 'multi',
    label: 'Jenis Aktivitas MBKM',
    icon: Briefcase,
    optionsKey: 'jenisAktivitas',
    placeholder: 'Semua Jenis Aktivitas',
  },
  selectedStatusAktivitas: {
    initial: [],
    param: 'statusAktivitas',
    setter: 'setSelectedStatusAktivitas',
    control: 'multi',
    label: 'Status Aktivitas',
    icon: UserCheck,
    optionsKey: 'statusAktivitasOptions',
    placeholder: 'Semua Status Aktivitas',
  },
  // Hanya mengubah tabel; kartu menyebutnya lewat `ignoredFilters` dari server.
  selectedStatusPartisipasi: {
    initial: '',
    param: 'statusPartisipasi',
    setter: 'setSelectedStatusPartisipasi',
    control: 'single',
    label: 'Status Partisipasi',
    icon: ListChecks,
    optionsKey: 'statusPartisipasiOptions',
    placeholder: 'Semua Mahasiswa',
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
  firstRowColumns: 4,
  secondRowColumns: 4,
  fields: mbkmFilterFields,
};

/**
 * Default tahun ajaran = tahun terbaru di data MBKM (`academicYearOptions[0]`,
 * ADR 0005). Sebelum opsi termuat nilainya kosong dan server memakai default
 * yang sama; pilihan URL tetap menang.
 */
export function useMbkmFilters(defaultAcademicYear = '') {
  const fields = useMemo(
    () => ({
      ...mbkmFilterFields,
      tahunAjaran: {
        ...mbkmFilterFields.tahunAjaran,
        initial: defaultAcademicYear,
        sanitize: (value) => sanitizeAcademicYear(value, defaultAcademicYear),
      },
    }),
    [defaultAcademicYear],
  );
  return useDashboardFilters({ fields });
}
