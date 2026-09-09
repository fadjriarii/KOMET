/**
 * Uji asap (smoke test) rendering server-side: memastikan seluruh
 * pohon komponen DashboardPage dapat dirender tanpa error runtime.
 * Dijalankan via vite-node/esbuild, bukan bagian dari aplikasi.
 */
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MainLayout } from '../src/components/layout/MainLayout/MainLayout.jsx';
import { DashboardPage } from '../src/pages/DashboardPage/DashboardPage.jsx';

const html = renderToString(
  <MemoryRouter>
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<DashboardPage />} />
      </Route>
    </Routes>
  </MemoryRouter>,
);

// Assertion: teks & nilai metrik kunci harus muncul di output render.
const mustContain = [
  'Institutional KPI Dashboard',
  'Total Graduates',
  'Average GPA (Overall)',
  'Average GPA (S1',
  'Average GPA (S2',
  'Average GPA per Study Program',
  'Graduate Trends',
  'Student Navigation',
  'Collapse Sidebar',
  'Sync Sevima',
  // Dropdown profil tertutup secara default; verifikasi pemicu & avatar saja
  'Dr. Ir. Hendra S., M.Sc.',
  'aria-label="Notifications"',
  // Logo sidebar (mode terbuka) & navbar harus ter-render
  'i3L KOMET Logo',
  'KOMET Logo',
];

const failures = mustContain.filter((t) => !html.includes(t));

// Verifikasi angka hasil perhitungan utilitas ikut ter-render.
const has968 = html.includes('>968<') || html.includes('968');
const hasGpa = html.includes('3.53');

if (failures.length > 0 || !has968 || !hasGpa) {
  console.error('SMOKE FAIL', { failures, has968, hasGpa, len: html.length });
  process.exit(1);
}

console.log('SMOKE PASS — rendered', html.length, 'chars; key metrics present');
