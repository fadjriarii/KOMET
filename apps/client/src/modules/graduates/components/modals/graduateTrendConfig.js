import { BarChart3, Table, Building2, BookOpen, Award, PieChart } from 'lucide-react';

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

// Keberhasilan studi dievaluasi SETELAH lag kohort, bukan dibatasi olehnya.
// Jangan pakai kata "maks" yang membuat angka terbaca sebagai batas studi.
export const withEvaluationLag = (label, lag) => (lag ? `${label} (Evaluasi +${lag} Thn)` : label);

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

export const onTimeTabs = (batas = {}) => {
  const jenjangTabs = Object.entries(batas)
    .filter(([key]) => key !== 's1' && key !== 's2')
    .map(([key, value]) => ({
      key,
      label: withBatas(`Jenjang ${key.toUpperCase()}`, value, '≤'),
      icon: BarChart3,
    }));
  return [
    { key: 's1', label: withBatas('Jenjang S1', batas.s1, '≤'), icon: BarChart3 },
    { key: 's2', label: withBatas('Jenjang S2', batas.s2, '≤'), icon: BarChart3 },
    ...jenjangTabs,
  ];
};

export const studySuccessTabs = (batas = {}) => {
  const jenjangTabs = Object.entries(batas)
    .filter(([key]) => key !== 's1' && key !== 's2')
    .map(([key, value]) => ({
      key,
      label: withEvaluationLag(`Jenjang ${key.toUpperCase()}`, value),
      icon: BarChart3,
    }));
  return [
    { key: 's1', label: withEvaluationLag('Jenjang S1', batas.s1), icon: BarChart3 },
    { key: 's2', label: withEvaluationLag('Jenjang S2', batas.s2), icon: BarChart3 },
    ...jenjangTabs,
  ];
};

// Chart tren cohort cukup 5 data terakhir; filter tahun eksplisit user tidak dipotong.
export const selectChartCohorts = (cohorts, explicitYear) =>
  explicitYear ? cohorts : cohorts.slice(-5);

// Kohort baru bisa dievaluasi setelah punya intake atau lulusan.
export const hasStudySuccessData = (cohorts = []) =>
  cohorts.some((row) => Number(row?.intake) > 0 || Number(row?.successCount) > 0);
