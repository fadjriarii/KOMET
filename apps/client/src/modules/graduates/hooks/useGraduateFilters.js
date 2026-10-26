import { useMemo } from 'react';
import { Award, BookOpen, Building2, CalendarDays, UserCheck } from 'lucide-react';
import { isValidAcademicYear } from '@komet/shared/academicYear';
import { useDashboardFilters } from '../../../hooks/useDashboardFilters';
import { sanitizeSearch } from '../../../utils/querySanitizer';

/**
 * Label ajaran invalid dari URL = tanpa jangkar. Tahun ajaran TERBARU yang
 * ada di data (`defaultAcademicYear`, dari `filterOptions.academicYearOptions[0]`)
 * juga dinormalisasi ke '' (tahun kalender tidak dipakai, AGENTS §5.1) —
 * memilihnya sama dengan default ("lulus sampai sekarang", anchor terlemah),
 * jadi tidak boleh dihitung sebagai filter aktif dan menyalakan badge
 * "Terfilter" di kartu KPI.
 */
const sanitizeAcademicYear = (value, defaultAcademicYear = '') => {
  if (!isValidAcademicYear(value)) return '';
  if (value === defaultAcademicYear) return '';
  return value;
};

/**
 * Field filter lulusan: state ↔ URL ↔ param server ↔ kontrol tampilan.
 * Fakultas/Prodi/Jenjang identik tab Student; Tahun Lulus memakai gaya
 * rolling + input kustom Angkatan; Periode Lulus = Ganjil/Genap seperti
 * Periode Masuk; "Status Kelulusan" memfilter predikat; Periode Masuk
 * diganti Angkatan kohort.
 *
 * Urutan baris kedua: Angkatan, Tahun Lulus, Status Kelulusan, Periode Lulus.
 */
export const graduateFilterFields = {
  searchQuery: {
    initial: '',
    param: 'search',
    setter: 'setSearchQuery',
    sanitize: sanitizeSearch,
    control: 'search',
    row: 1,
    label: 'Cari Lulusan',
    placeholder: 'Cari berdasarkan NIM atau Nama lulusan...',
  },
  // Jangkar kohort tab Lulusan, dipilih di header halaman (bukan form filter).
  tahunAjaran: {
    initial: '',
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
  selectedAngkatan: {
    initial: [],
    api: 'angkatanTahun',
    setter: 'setSelectedAngkatan',
    control: 'years',
    label: 'Angkatan',
    optionsKey: 'rollingAngkatan',
    placeholder: 'Pilih Tahun',
    allTimeLabel: 'All Time',
    yearLabel: 'Angkatan',
    allowCustom: true,
    customLabel: 'Tambah Tahun Angkatan',
    customMetaKey: 'customAngkatanMeta',
  },
  selectedTahunLulus: {
    // Default = tahun lulus terbaru (dari filterOptions.rollingYears[0],
    // sudah ter-window oleh jangkar tahun ajaran). Ditetapkan di
    // useGraduateFilters supaya sama dengan nilai awal: tidak menyala
    // sebagai filter aktif dan tidak menyalakan badge "Terfilter".
    initial: [],
    api: 'tahunLulus',
    setter: 'setSelectedTahunLulus',
    control: 'years',
    label: 'Tahun Lulus',
    optionsKey: 'rollingYears',
    placeholder: 'Pilih Tahun',
    allTimeLabel: 'Semua Tahun',
    yearLabel: 'Tahun',
    allowCustom: true,
    customLabel: 'Tambah Tahun Kelulusan',
    customMetaKey: 'customYearMeta',
  },
  selectedStatusKelulusan: {
    initial: [],
    param: 'predikat',
    api: 'predikat',
    setter: 'setSelectedStatusKelulusan',
    control: 'multi',
    label: 'Status Kelulusan',
    icon: UserCheck,
    optionsKey: 'predikatOptions',
    placeholder: 'Semua Status',
  },
  selectedPeriodeWisuda: {
    initial: '',
    param: 'periodeWisuda',
    api: 'periodeWisuda',
    setter: 'setSelectedPeriodeWisuda',
    control: 'single',
    label: 'Periode Lulus',
    icon: CalendarDays,
    optionsKey: 'periodeOptions',
    placeholder: 'Semua Periode Lulus',
  },
};

export const graduateFilterForm = {
  title: 'Filter & Pencarian Lulusan',
  secondRowColumns: 4,
  fields: graduateFilterFields,
};

export function useGraduateFilters(defaultAcademicYear = '', defaultTahunLulus = '') {
  // Closure per default: tahun ajaran terbaru dari data (datanya belum
  // termuat saat hook pertama jalan, baru diketahui setelah summary
  // selesai — DashboardPage menyimpannya dan memanggil ulang hook ini).
  const fields = useMemo(
    () => ({
      ...graduateFilterFields,
      tahunAjaran: {
        ...graduateFilterFields.tahunAjaran,
        sanitize: (value) => sanitizeAcademicYear(value, defaultAcademicYear),
      },
      // Tahun Lulus default = tahun terbaru dalam jangkar (di atas sudah
      // ter-window server-side); '' sebelum data termuat = semua tahun,
      // sama perilaku dengan sebelumnya.
      selectedTahunLulus: {
        ...graduateFilterFields.selectedTahunLulus,
        initial: defaultTahunLulus ? [defaultTahunLulus] : [],
        defaultValue: defaultTahunLulus ? [defaultTahunLulus] : [],
      },
    }),
    [defaultAcademicYear, defaultTahunLulus],
  );
  // Tanpa pilihan di URL, Tahun Lulus = `initial` = default terbaru, jadi ikut
  // bergeser sendiri saat jangkar TA diganti atau sync menambah tahun baru.
  // Pilihan eksplisit user tidak pernah ditimpa (AGENTS §5.2).
  return useDashboardFilters({ fields });
}
