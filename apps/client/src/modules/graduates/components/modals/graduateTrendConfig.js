import { BarChart3, Table, Building2, BookOpen, Award, PieChart } from 'lucide-react';
import { CANONICAL_JENJANG } from '@komet/shared/constants';
import { jenjangName } from './totalTrendBars';

export const TOTAL_GRADUATE_TABS = [
  { key: 'tren', label: 'Tren Tahunan', icon: BarChart3 },
  { key: 'predikat', label: 'Distribusi Predikat', icon: Award },
  { key: 'tabel', label: 'Tabel Riwayat', icon: Table },
];

export const GPA_OVERVIEW_TABS = [
  { key: 'tren', label: 'Tren IPK Tahunan', icon: BarChart3 },
  { key: 'rentang', label: 'Distribusi Rentang IPK', icon: PieChart },
  { key: 'prodi', label: 'Per Program Studi', icon: BookOpen },
  { key: 'fakultas', label: 'Per Fakultas', icon: Building2 },
];

// Batas masa studi dikirim server (batasS1/batasS2/batasStudiS1/batasStudiS2);
// label tab mengikutinya supaya angka di UI tidak pernah punya sumber kedua.
// Sebelum payload tiba, label tetap terbaca tanpa klaim angka.
export const withBatas = (label, batas, operator) =>
  batas ? `${label} (${operator} ${batas} Thn)` : label;

// Keberhasilan studi = lulus dalam masa studi maksimum (ADR 0004); angka dari server.
export const withEvaluationLag = (label, lag) => (lag ? `${label} (Maks. ${lag} Thn)` : label);

// Satu pilihan jenjang = cukup tab itu; tanpa pilihan = semua tab yang
// tersedia. Dipakai modal agar filter `Profesi` tidak menyisakan tab S1/S2 hantu.
export const tabsForSelectedJenjang = (tabs, jenjang = []) => {
  const selected = (Array.isArray(jenjang) ? jenjang : [jenjang])
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());
  return selected.length ? tabs.filter((tab) => selected.includes(tab.key)) : tabs;
};

// Default Tahun Lulus = tahun terbaru adalah pilihan UI, bukan permintaan user.
// Chart tren dan tabel riwayat butuh jendela 5 tahun; strip hanya saat nilainya
// masih default. Pilihan eksplisit (termasuk tahun yang sama yang dipilih user
// setelah mengubah filter) tetap dihormati.
export const withoutDefaultTahunLulus = (filters, defaultTahunLulus) => {
  const selected = filters?.selectedTahunLulus;
  if (!defaultTahunLulus || !Array.isArray(selected)) return filters;
  if (selected.length !== 1 || selected[0] !== defaultTahunLulus) return filters;
  const rest = { ...filters };
  delete rest.selectedTahunLulus;
  return rest;
};

// Urutan tab = urutan jenjang kanonis (S1, S2, S3, Profesi, D3, D4), lalu sisanya abjad.
const JENJANG_ORDER = Object.values(CANONICAL_JENJANG);
const byJenjangOrder = ([a], [b]) => {
  const ia = JENJANG_ORDER.indexOf(jenjangName(a));
  const ib = JENJANG_ORDER.indexOf(jenjangName(b));
  return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
};

// Tab hanya untuk jenjang yang dikirim pemanggil (yang datanya ada) — tidak ada
// tab S1/S2 hantu saat scope hanya memuat Profesi.
const jenjangTabs = (batas, labelFor) =>
  Object.entries(batas)
    .sort(byJenjangOrder)
    .map(([key, value]) => ({
      key,
      label: labelFor(`Jenjang ${jenjangName(key)}`, value),
      icon: BarChart3,
    }));

export const onTimeTabs = (batas = {}) =>
  jenjangTabs(batas, (label, value) => withBatas(label, value, '≤'));

export const studySuccessTabs = (batas = {}) => jenjangTabs(batas, withEvaluationLag);

// Chart tren cohort cukup 5 data terakhir; filter tahun eksplisit user tidak dipotong.
export const selectChartCohorts = (cohorts, explicitYear) =>
  explicitYear ? cohorts : cohorts.slice(-5);

// Kohort baru bisa dievaluasi setelah punya intake atau lulusan.
export const hasStudySuccessData = (cohorts = []) =>
  cohorts.some((row) => Number(row?.intake) > 0 || Number(row?.successCount) > 0);
