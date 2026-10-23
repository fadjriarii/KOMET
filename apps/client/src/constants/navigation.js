import { lazy } from 'react';
import { Briefcase, GraduationCap, Users } from 'lucide-react';

const loadStudents = () => import('../modules/students/pages/StudentsPage');
const loadGraduates = () => import('../modules/graduates/pages/GraduatesPage');
const loadMbkm = () => import('../modules/mbkm/pages/MbkmPage');

/**
 * Satu daftar untuk tiga hal: rute React Router, menu sidebar, dan breadcrumb.
 * Menambah halaman = satu entri di sini; tidak ada lagi label atau path yang
 * disalin di tempat lain (dulu `NAV_CONFIG` sidebar adalah salinan keempat).
 * `/` bukan halaman sendiri: ia dialihkan ke `/students` (lihat `App.jsx`).
 * `load` yang sama dipakai `lazy` dan prefetch hover/focus di sidebar.
 */
export const NAV_ITEMS = [
  {
    id: 'students',
    path: '/students',
    label: 'Student Data',
    group: 'Student Navigation',
    icon: Users,
    load: loadStudents,
    Component: lazy(loadStudents),
  },
  {
    id: 'graduates',
    path: '/graduates',
    label: 'Graduates',
    group: 'Student Navigation',
    icon: GraduationCap,
    load: loadGraduates,
    Component: lazy(loadGraduates),
  },
  {
    id: 'mbkm',
    path: '/mbkm',
    label: 'MBKM',
    group: 'Student Navigation',
    icon: Briefcase,
    load: loadMbkm,
    Component: lazy(loadMbkm),
  },
];
