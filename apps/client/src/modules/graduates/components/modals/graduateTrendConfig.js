import { BarChart3, Table, Building2, BookOpen, Award, PieChart } from 'lucide-react';

export const TOTAL_GRADUATE_TABS = [
  { key: 'tren', label: 'Tren Tahunan', icon: BarChart3 },
  { key: 'predikat', label: 'Distribusi Predikat', icon: Award },
  { key: 'prodi', label: 'Per Program Studi', icon: BookOpen },
  { key: 'fakultas', label: 'Per Fakultas', icon: Building2 },
  { key: 'tabel', label: 'Tabel Riwayat', icon: Table },
];

export const GPA_OVERVIEW_TABS = [
  { key: 'tren', label: 'Tren IPK Tahunan', icon: BarChart3 },
  { key: 'rentang', label: 'Distribusi Rentang IPK', icon: PieChart },
  { key: 'prodi', label: 'Per Program Studi', icon: BookOpen },
  { key: 'fakultas', label: 'Per Fakultas', icon: Building2 },
];

// Batas masa studi dikirim server (`jenjangs[].batas`); label hanya memformat.
// Sebelum payload tiba, label tetap terbaca tanpa klaim angka.
export const withBatas = (label, batas, operator) =>
  batas ? `${label} (${operator} ${batas} Thn)` : label;

// Keberhasilan studi = lulus dalam masa studi maksimum (ADR 0004); angka dari server.
export const withEvaluationLag = (label, lag) => (lag ? `${label} (Maks. ${lag} Thn)` : label);
