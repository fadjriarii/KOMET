import { BarChart3, Table, Building2, BookOpen, Award, PieChart } from 'lucide-react';

export const TOTAL_GRADUATE_TABS = [
  { key: 'tren', label: 'Tren Tahunan (S1 & S2)', icon: BarChart3 },
  { key: 'predikat', label: 'Distribusi Predikat', icon: Award },
  { key: 'tabel', label: 'Tabel Riwayat', icon: Table },
];

export const GPA_OVERVIEW_TABS = [
  { key: 'tren', label: 'Tren IPK Tahunan', icon: BarChart3 },
  { key: 'rentang', label: 'Distribusi Rentang IPK', icon: PieChart },
  { key: 'prodi', label: 'Per Program Studi', icon: BookOpen },
  { key: 'fakultas', label: 'Per Fakultas', icon: Building2 },
];

export const ON_TIME_TABS = [
  { key: 's1', label: 'Jenjang S1 (≤ 4 Thn)', icon: BarChart3 },
  { key: 's2', label: 'Jenjang S2 (≤ 2 Thn)', icon: BarChart3 },
  { key: 'tabel', label: 'Tabel Riwayat Cohort', icon: Table },
];

export const STUDY_SUCCESS_TABS = [
  { key: 's1', label: 'Jenjang S1 (Maks 7 Thn)', icon: BarChart3 },
  { key: 's2', label: 'Jenjang S2 (Maks 4 Thn)', icon: BarChart3 },
  { key: 'tabel', label: 'Tabel Riwayat Cohort', icon: Table },
];
