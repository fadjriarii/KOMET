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
import { GraduateDataPage } from '../src/pages/GraduateDataPage/GraduateDataPage.jsx';
import { GraduateDetailModal } from '../src/components/graduate/GraduateDetailModal.jsx';
import { kelulusanData } from '../src/data/KomatQAmit_DB_DataDump';
import { normalizeGraduateData } from '../src/logicDump/graduateMetrics';

const html = renderToString(
  <MemoryRouter>
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<DashboardPage />} />
      </Route>
    </Routes>
  </MemoryRouter>,
);

const gradHtml = renderToString(
  <MemoryRouter initialEntries={['/graduate-data']}>
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/graduate-data" element={<GraduateDataPage />} />
      </Route>
    </Routes>
  </MemoryRouter>,
);

const norm = normalizeGraduateData(kelulusanData);
const modalTypes = ['total-graduates', 'gpa-overview', 'on-time-graduation', 'study-success'];
for (const mt of modalTypes) {
  const modalHtml = renderToString(
    <GraduateDetailModal
      metricType={mt}
      originRect={{ top: 100, left: 100, width: 200, height: 100 }}
      onClose={() => {}}
      data={norm}
    />
  );
  console.log(`Modal ${mt} rendered successfully (${modalHtml.length} chars)`);
}

// Assertion: teks & nilai metrik kunci harus muncul di output render.
const mustContain = [
  'Dashboard',
  'Graduate Data Repository',
  'Live Sevima Sync',
  'PDDikti Verified',
  'Total Lulusan',
  'Rata-rata IPK',
  'Lulus Tepat Waktu',
  'Keberhasilan Studi',
  'Dr. Ir. Hendra S., M.Sc.',
  'i3L KOMET Logo',
  'KOMET Logo',
];

const failures = mustContain.filter((t) => !html.includes(t) && !gradHtml.includes(t));

// Verifikasi angka hasil perhitungan utilitas ikut ter-render.
const has968 = html.includes('968') || gradHtml.includes('968');
const hasGpa = html.includes('3.53') || gradHtml.includes('3.53');

if (failures.length > 0 || !has968 || !hasGpa) {
  console.error('SMOKE FAIL', { failures, has968, hasGpa, len: html.length, gradLen: gradHtml.length });
  process.exit(1);
}

console.log('SMOKE PASS — rendered DashboardPage (' + html.length + ' chars), GraduateDataPage (' + gradHtml.length + ' chars), and all 4 GraduateDetailModals successfully!');


