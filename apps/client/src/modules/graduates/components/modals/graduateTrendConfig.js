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

const cohortTableTab = { key: 'tabel', label: 'Tabel Riwayat Cohort', icon: Table };

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
    cohortTableTab,
  ];
};

export const studySuccessTabs = (batas = {}) => {
  const jenjangTabs = Object.entries(batas)
    .filter(([key]) => key !== 's1' && key !== 's2')
    .map(([key, value]) => ({
      key,
      label: withBatas(`Jenjang ${key.toUpperCase()}`, value, 'Maks'),
      icon: BarChart3,
    }));
  return [
    { key: 's1', label: withBatas('Jenjang S1', batas.s1, 'Maks'), icon: BarChart3 },
    { key: 's2', label: withBatas('Jenjang S2', batas.s2, 'Maks'), icon: BarChart3 },
    ...jenjangTabs,
    cohortTableTab,
  ];
};
