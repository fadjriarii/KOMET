import { Building2, BookOpen, Award, CheckCircle2, Table } from 'lucide-react';

export const MBKM_RATE_TABS = [
  { key: 'fakultas', label: 'Sebaran Fakultas', icon: Building2 },
  { key: 'tabel', label: 'Tabel Fakultas', icon: Table },
];

export const MBKM_ACTIVITIES_TABS = [
  { key: 'aktivitas', label: 'Bentuk BKP MBKM', icon: Award },
  { key: 'prodi', label: 'Per Program Studi', icon: BookOpen },
  { key: 'status', label: 'Status Aktivitas', icon: CheckCircle2 },
  { key: 'tabel', label: 'Tabel Ringkasan', icon: Table },
];

export const MBKM_ELIGIBLE_TABS = [
  { key: 'prodi', label: 'Sebaran Program Studi', icon: BookOpen },
  { key: 'tabel', label: 'Tabel Mahasiswa', icon: Table },
];

export const MBKM_PARTNERS_TABS = [
  { key: 'mitra', label: 'Top Mitra Penempatan', icon: Building2 },
  { key: 'tabel', label: 'Tabel Mitra', icon: Table },
];
