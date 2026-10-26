import {
  Activity,
  BarChart3,
  BookOpen,
  Building2,
  CalendarDays,
  Flag,
  Hash,
  Layers,
  Table,
} from 'lucide-react';

/** Tab chart + tabel riwayat — dipakai semua modal rincian tren. */
export const TREND_TABS = [
  { key: 'chart', label: 'Diagram Tren', icon: BarChart3 },
  { key: 'table', label: 'Tabel Riwayat', icon: Table },
];

/** Tab tambahan modal Intake/Penurunan (tampil hanya bila datanya lebih dari satu kategori). */
export const INTAKE_PRODI_TAB = { key: 'prodi', label: 'Per Program Studi', icon: BookOpen };
export const INTAKE_STATUS_TAB = { key: 'status', label: 'Status Saat Ini', icon: Activity };

/** Tab distribusi — dipakai ActiveStudentsModal (urutan = urutan tampil). */
export const STUDENT_DISTRIBUTION_TABS = [
  { key: 'status', label: 'Per Status', icon: Activity },
  { key: 'fakultas', label: 'Per Fakultas', icon: Building2 },
  { key: 'prodi', label: 'Per Program Studi', icon: BookOpen },
  { key: 'jenjang', label: 'Per Jenjang', icon: Layers },
  { key: 'angkatan', label: 'Per Angkatan', icon: CalendarDays },
  { key: 'semester', label: 'Per Semester', icon: Hash },
  { key: 'kewarganegaraan', label: 'Per Kewarganegaraan', icon: Flag },
];
