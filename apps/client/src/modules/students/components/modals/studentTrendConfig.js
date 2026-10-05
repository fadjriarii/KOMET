import { BarChart3, Table, Building2, BookOpen, Layers } from 'lucide-react';

export const TREND_TABS = [
  { key: 'chart', label: 'Diagram Tren', icon: BarChart3 },
  { key: 'table', label: 'Tabel Riwayat', icon: Table },
];

export const STUDENT_DISTRIBUTION_TABS = [
  // Dipakai ActiveStudentsModal agar konfigurasi tab distribusi hanya punya satu sumber kebenaran.
  { key: 'fakultas', label: 'Per Fakultas', icon: Building2 },
  { key: 'prodi', label: 'Per Program Studi', icon: BookOpen },
  { key: 'jenjang', label: 'Per Jenjang', icon: Layers },
];
