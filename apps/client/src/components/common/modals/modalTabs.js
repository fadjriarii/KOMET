import { BarChart3, Table, Building2, BookOpen, Layers } from 'lucide-react';

/** Tab chart + tabel riwayat — dipakai semua modal rincian tren. */
export const TREND_TABS = [
  { key: 'chart', label: 'Diagram Tren', icon: BarChart3 },
  { key: 'table', label: 'Tabel Riwayat', icon: Table },
];

/** Tab distribusi — dipakai ActiveStudentsModal. */
export const STUDENT_DISTRIBUTION_TABS = [
  { key: 'fakultas', label: 'Per Fakultas', icon: Building2 },
  { key: 'prodi', label: 'Per Program Studi', icon: BookOpen },
  { key: 'jenjang', label: 'Per Jenjang', icon: Layers },
];
