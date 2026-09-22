import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Handshake,
  Settings,
} from 'lucide-react';

/**
 * Konfigurasi navigasi Sidebar (modul terisolasi sesuai PRD bagian 6).
 * Semua label user-facing WAJIB dalam Bahasa Inggris.
 */

/** Lebar sidebar saat terbuka (px) — sesuai DESIGN.md (260px ~ w-64+). */
export const SIDEBAR_WIDTH_EXPANDED = 'w-64';

/** Lebar sidebar saat tertutup menjadi rail ikon (DESIGN.md: 72px collapsed). */
export const SIDEBAR_WIDTH_COLLAPSED = 'w-[72px]';

/** Label grup navigasi utama di bagian atas sidebar. */
export const STUDENT_NAV_SECTION_LABEL = 'Student Navigation';

/** Item navigasi utama "Student Navigation" (PRD bagian 4 - Layout & Navigation). */
export const STUDENT_NAV_ITEMS = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/',
  },
  {
    key: 'student-data',
    label: 'Student Data',
    icon: Users,
    path: '/student-data',
  },
  {
    key: 'graduate-data',
    label: 'Graduate Data',
    icon: GraduationCap,
    path: '/graduate-data',
  },
  {
    key: 'mbkm-data',
    label: 'MBKM Data',
    icon: Handshake,
    path: '/mbkm-data',
  },
];

/** Item navigasi sekunder di bagian bawah sidebar. */
export const FOOTER_NAV_ITEMS = [
  {
    key: 'settings',
    label: 'Settings',
    icon: Settings,
    path: '/settings',
  },
];

/** Label tombol collapse/expand sidebar. */
export const COLLAPSE_LABEL = 'Collapse Sidebar';
export const EXPAND_LABEL = 'Open Sidebar';
