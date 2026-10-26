import { Activity, BookOpen, Building2, CalendarDays, Flag, Hash, Layers } from 'lucide-react';
import { STUDENT_DISTRIBUTION_TABS } from '../../../../components/common/modals/modalTabs';
import { STATUS_COLORS, STATUS_FALLBACK_COLOR } from '../../../../utils/theme';

/** Kunci tab → kunci respons `/students/active-students` + tampilan kosong. */
const DISTRIBUTIONS = {
  status: {
    dataKey: 'byStatus',
    emptyIcon: Activity,
    emptyTitle: 'Tidak Ada Data Status',
    yAxisWidth: 160,
  },
  fakultas: {
    dataKey: 'byFaculty',
    emptyIcon: Building2,
    emptyTitle: 'Tidak Ada Data Fakultas',
    yAxisWidth: 190,
  },
  prodi: {
    dataKey: 'byProdi',
    emptyIcon: BookOpen,
    emptyTitle: 'Tidak Ada Data Program Studi',
    yAxisWidth: 210,
  },
  jenjang: {
    dataKey: 'byJenjang',
    emptyIcon: Layers,
    emptyTitle: 'Tidak Ada Data Jenjang',
    yAxisWidth: 140,
  },
  angkatan: {
    dataKey: 'byAngkatan',
    emptyIcon: CalendarDays,
    emptyTitle: 'Tidak Ada Data Angkatan',
    yAxisWidth: 110,
  },
  semester: {
    dataKey: 'bySemester',
    emptyIcon: Hash,
    emptyTitle: 'Tidak Ada Data Semester',
    yAxisWidth: 110,
  },
  kewarganegaraan: {
    dataKey: 'byNationality',
    emptyIcon: Flag,
    emptyTitle: 'Tidak Ada Data Kewarganegaraan',
    yAxisWidth: 80,
  },
};

/** Seri bar bertumpuk dari daftar status yang dikirim server (urutan = jumlah terbanyak). */
export function statusSeries(statuses = []) {
  return statuses.map((status) => ({
    key: status,
    label: status,
    color: STATUS_COLORS[status] ?? STATUS_FALLBACK_COLOR,
  }));
}

/**
 * Tab rincian yang layak tampil untuk satu respons. Pengelompokan yang hanya
 * berisi satu kategori (mis. Per Program Studi saat satu prodi dipilih) tidak
 * menjelaskan apa pun, jadi disembunyikan; tab status hanya berarti bila
 * populasinya memuat lebih dari satu status. Tanpa data (memuat/gagal) tab
 * dasar tetap tampil supaya kerangka modal tidak melompat.
 */
export function activeDistributions(detail) {
  const tabs = STUDENT_DISTRIBUTION_TABS.map((tab) => ({
    ...tab,
    ...DISTRIBUTIONS[tab.key],
    items: detail?.[DISTRIBUTIONS[tab.key].dataKey] || [],
  }));
  if (!detail?.totalActiveStudents)
    return tabs.filter((tab) => ['fakultas', 'prodi', 'jenjang'].includes(tab.key));
  return tabs.filter((tab) => tab.items.length > 1);
}
