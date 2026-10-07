import { lazy } from 'react';
import { Briefcase, GraduationCap, LayoutDashboard, Users } from 'lucide-react';

/**
 * Satu daftar untuk tiga hal: rute React Router, menu sidebar, dan breadcrumb.
 * Menambah halaman = satu entri di sini; tidak ada lagi label atau path yang
 * disalin di tempat lain (dulu `NAV_CONFIG` sidebar adalah salinan keempat).
 */
export const NAV_ITEMS = [
  {
    id: 'overview',
    path: '/',
    label: 'Overview',
    group: 'Student Navigation',
    icon: LayoutDashboard,
    Component: lazy(() => import('../modules/overview/pages/OverviewPage')),
  },
  {
    id: 'students',
    path: '/students',
    label: 'Student Data',
    group: 'Student Navigation',
    icon: Users,
    Component: lazy(() => import('../modules/students/pages/StudentsPage')),
  },
  {
    id: 'graduates',
    path: '/graduates',
    label: 'Graduates',
    group: 'Student Navigation',
    icon: GraduationCap,
    Component: lazy(() => import('../modules/graduates/pages/GraduatesPage')),
  },
  {
    id: 'mbkm',
    path: '/mbkm',
    label: 'MBKM',
    group: 'Student Navigation',
    icon: Briefcase,
    Component: lazy(() => import('../modules/mbkm/pages/MbkmPage')),
  },
];
