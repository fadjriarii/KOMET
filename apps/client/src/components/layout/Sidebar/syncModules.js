/**
 * Tiga modul sinkronisasi — satu-satunya tempat daftar, label, ikon, dan
 * deskripsinya disebut. Picker checkbox dan baris progres membaca dari sini,
 * jadi keduanya tidak bisa berbeda nama modul.
 */
import { Globe, GraduationCap, Users } from 'lucide-react';

export const MODULE_OPTIONS = [
  {
    key: 'students',
    label: 'Data Mahasiswa',
    description: 'Seluruh data mahasiswa aktif maupun non-aktif',
    icon: Users,
  },
  {
    key: 'graduates',
    label: 'Data Lulusan',
    description: 'Data lulusan beserta tanggal kelulusan',
    icon: GraduationCap,
  },
  {
    key: 'mbkm',
    label: 'Data MBKM',
    description: 'Aktivitas MBKM dan penyetaraan nilai',
    icon: Globe,
  },
];

export const MODULE_KEYS = MODULE_OPTIONS.map(({ key }) => key);

export const MODULE_LABELS = Object.fromEntries(
  MODULE_OPTIONS.map(({ key, label }) => [key, label]),
);

export const countSelected = (selected) => MODULE_KEYS.filter((key) => selected[key]).length;
