import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';

/**
 * Tooltip kustom untuk chart di dalam InteractiveMetricModal.
 */
const ModalChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  return (
    <div className="rounded-lg border border-surface-container-high bg-white px-3 py-2 shadow-xl">
      <p className="text-xs font-semibold text-on-surface">{label}</p>
      <p className="text-xs text-on-surface-variant tabular-nums mt-0.5">
        Capaian: <span className="font-bold text-primary">{item.payload?.val || item.value}</span>
      </p>
      {item.payload?.delta && (
        <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
          Delta: {item.payload.delta}
        </p>
      )}
    </div>
  );
};

/**
 * Data titik tren dan formula resmi untuk modal interaktif sesuai code.html.
 */
const METRIC_DETAILS_DATA = {
  active_students: {
    title: 'Total Active Students',
    badge: 'Student Body KPI',
    icon: 'groups',
    formula: 'Total mahasiswa berstatus AKTIF terdaftar pada semester berjalan',
    desc: 'Dihitung dari 554 records mahasiswa aktif di sistem PDDIKTI dan Sevima Feeder.',
    latest: '554',
    growth: '+4.1% vs Thn Lalu',
    points: [
      { sem: 'AY 2021/2022 Ganjil', short: '21/22 G', val: '438', num: 438, pct: 60, delta: '+5.2%', status: 'Aktif' },
      { sem: 'AY 2021/2022 Genap', short: '21/22 P', val: '445', num: 445, pct: 62, delta: '+1.6%', status: 'Aktif' },
      { sem: 'AY 2022/2023 Ganjil', short: '22/23 G', val: '468', num: 468, pct: 68, delta: '+5.1%', status: 'Aktif' },
      { sem: 'AY 2022/2023 Genap', short: '22/23 P', val: '476', num: 476, pct: 70, delta: '+1.7%', status: 'Aktif' },
      { sem: 'AY 2023/2024 Ganjil', short: '23/24 G', val: '502', num: 502, pct: 77, delta: '+5.4%', status: 'Aktif' },
      { sem: 'AY 2023/2024 Genap', short: '23/24 P', val: '510', num: 510, pct: 79, delta: '+1.6%', status: 'Aktif' },
      { sem: 'AY 2024/2025 Ganjil', short: '24/25 G', val: '532', num: 532, pct: 86, delta: '+4.3%', status: 'Aktif' },
      { sem: 'AY 2024/2025 Genap', short: '24/25 P', val: '539', num: 539, pct: 88, delta: '+1.3%', status: 'Aktif' },
      { sem: 'AY 2025/2026 Ganjil', short: '25/26 G', val: '548', num: 548, pct: 92, delta: '+1.7%', status: 'Aktif' },
      { sem: 'AY 2025/2026 Genap', short: '25/26 P', val: '554', num: 554, pct: 96, delta: '+1.1%', status: 'Terkini' },
    ],
  },
  total_graduates: {
    title: 'Total Graduates (PDDIKTI)',
    badge: 'Graduate Registry',
    icon: 'school',
    formula: 'Total akumulasi mahasiswa lulus dan diyudisium pada periode pelaporan',
    desc: 'Mencakup 196 lulusan sarjana dan magister dengan nomor registrasi ijazah terverifikasi.',
    latest: '196',
    growth: '+5.8% YoY',
    points: [
      { sem: 'AY 2021/2022 Ganjil', short: '21/22 G', val: '124', num: 124, pct: 54, delta: '+4.0%', status: 'Lulus' },
      { sem: 'AY 2021/2022 Genap', short: '21/22 P', val: '138', num: 138, pct: 60, delta: '+11.2%', status: 'Lulus' },
      { sem: 'AY 2022/2023 Ganjil', short: '22/23 G', val: '146', num: 146, pct: 65, delta: '+5.8%', status: 'Lulus' },
      { sem: 'AY 2022/2023 Genap', short: '22/23 P', val: '158', num: 158, pct: 72, delta: '+8.2%', status: 'Lulus' },
      { sem: 'AY 2023/2024 Ganjil', short: '23/24 G', val: '166', num: 166, pct: 76, delta: '+5.0%', status: 'Lulus' },
      { sem: 'AY 2023/2024 Genap', short: '23/24 P', val: '178', num: 178, pct: 82, delta: '+7.2%', status: 'Lulus' },
      { sem: 'AY 2024/2025 Ganjil', short: '24/25 G', val: '184', num: 184, pct: 86, delta: '+3.4%', status: 'Lulus' },
      { sem: 'AY 2024/2025 Genap', short: '24/25 P', val: '189', num: 189, pct: 89, delta: '+2.7%', status: 'Lulus' },
      { sem: 'AY 2025/2026 Ganjil', short: '25/26 G', val: '193', num: 193, pct: 92, delta: '+2.1%', status: 'Lulus' },
      { sem: 'AY 2025/2026 Genap', short: '25/26 P', val: '196', num: 196, pct: 95, delta: '+1.5%', status: 'Terkini' },
    ],
  },
  total_mbkm: {
    title: 'Total MBKM Aktif (Selesai & Evaluasi)',
    badge: 'MBKM Module',
    icon: 'handshake',
    formula: 'MBKM = aktif + status selesai/evaluasi',
    desc: 'Total mahasiswa yang sedang atau telah menyelesaikan kegiatan konversi MBKM.',
    latest: '74',
    growth: '+12.3% YoY',
    points: [
      { sem: 'AY 2021/2022 Ganjil', short: '21/22 G', val: '28', num: 28, pct: 38, delta: '+22.0%', status: 'Aktif' },
      { sem: 'AY 2021/2022 Genap', short: '21/22 P', val: '34', num: 34, pct: 45, delta: '+21.4%', status: 'Aktif' },
      { sem: 'AY 2022/2023 Ganjil', short: '22/23 G', val: '42', num: 42, pct: 55, delta: '+23.5%', status: 'Aktif' },
      { sem: 'AY 2022/2023 Genap', short: '22/23 P', val: '48', num: 48, pct: 62, delta: '+14.3%', status: 'Aktif' },
      { sem: 'AY 2023/2024 Ganjil', short: '23/24 G', val: '56', num: 56, pct: 72, delta: '+16.7%', status: 'Aktif' },
      { sem: 'AY 2023/2024 Genap', short: '23/24 P', val: '61', num: 61, pct: 78, delta: '+8.9%', status: 'Aktif' },
      { sem: 'AY 2024/2025 Ganjil', short: '24/25 G', val: '66', num: 66, pct: 84, delta: '+8.2%', status: 'Aktif' },
      { sem: 'AY 2024/2025 Genap', short: '24/25 P', val: '69', num: 69, pct: 88, delta: '+4.5%', status: 'Aktif' },
      { sem: 'AY 2025/2026 Ganjil', short: '25/26 G', val: '72', num: 72, pct: 92, delta: '+4.3%', status: 'Aktif' },
      { sem: 'AY 2025/2026 Genap', short: '25/26 P', val: '74', num: 74, pct: 95, delta: '+2.8%', status: 'Terkini' },
    ],
  },
  intl_students: {
    title: 'Persentase Mahasiswa Asing (International Cohort)',
    badge: 'Student Overview',
    icon: 'public',
    formula: 'Kewarganegaraan Non WNI status aktif / Total Student Body aktif pada periode',
    desc: 'Rasio mahasiswa asing (46 mahasiswa aktif) terhadap 554 total student body.',
    latest: '8.3%',
    growth: '+1.8% vs Target',
    points: [
      { sem: 'AY 2021/2022 Ganjil', short: '21/22 G', val: '5.2%', num: 5.2, pct: 45, delta: '+0.4%', status: 'Target Tercapai' },
      { sem: 'AY 2021/2022 Genap', short: '21/22 P', val: '5.6%', num: 5.6, pct: 48, delta: '+0.4%', status: 'Target Tercapai' },
      { sem: 'AY 2022/2023 Ganjil', short: '22/23 G', val: '6.1%', num: 6.1, pct: 54, delta: '+0.5%', status: 'Target Tercapai' },
      { sem: 'AY 2022/2023 Genap', short: '22/23 P', val: '6.5%', num: 6.5, pct: 59, delta: '+0.4%', status: 'Target Tercapai' },
      { sem: 'AY 2023/2024 Ganjil', short: '23/24 G', val: '7.0%', num: 7.0, pct: 66, delta: '+0.5%', status: 'Target Tercapai' },
      { sem: 'AY 2023/2024 Genap', short: '23/24 P', val: '7.3%', num: 7.3, pct: 70, delta: '+0.3%', status: 'Target Tercapai' },
      { sem: 'AY 2024/2025 Ganjil', short: '24/25 G', val: '7.7%', num: 7.7, pct: 76, delta: '+0.4%', status: 'Target Tercapai' },
      { sem: 'AY 2024/2025 Genap', short: '24/25 P', val: '7.9%', num: 7.9, pct: 80, delta: '+0.2%', status: 'Target Tercapai' },
      { sem: 'AY 2025/2026 Ganjil', short: '25/26 G', val: '8.1%', num: 8.1, pct: 84, delta: '+0.2%', status: 'Target Tercapai' },
      { sem: 'AY 2025/2026 Genap', short: '25/26 P', val: '8.3%', num: 8.3, pct: 88, delta: '+0.2%', status: 'Terkini' },
    ],
  },
  student_intake: {
    title: 'Student Intake (Semester 1)',
    badge: 'Student Overview',
    icon: 'how_to_reg',
    formula: 'Jumlah mahasiswa semester 1 status aktif pada periode dipilih',
    desc: 'Data intake mahasiswa baru angkatan terbaru yang terdaftar aktif di Sevima Feeder.',
    latest: '148',
    growth: '+5.7% YoY',
    points: [
      { sem: 'AY 2021/2022 Ganjil', short: '21/22 G', val: '118', num: 118, pct: 58, delta: '+4.4%', status: 'Memenuhi' },
      { sem: 'AY 2021/2022 Genap', short: '21/22 P', val: '122', num: 122, pct: 62, delta: '+3.4%', status: 'Memenuhi' },
      { sem: 'AY 2022/2023 Ganjil', short: '22/23 G', val: '126', num: 126, pct: 66, delta: '+3.3%', status: 'Memenuhi' },
      { sem: 'AY 2022/2023 Genap', short: '22/23 P', val: '130', num: 130, pct: 70, delta: '+3.2%', status: 'Memenuhi' },
      { sem: 'AY 2023/2024 Ganjil', short: '23/24 G', val: '135', num: 135, pct: 75, delta: '+3.8%', status: 'Memenuhi' },
      { sem: 'AY 2023/2024 Genap', short: '23/24 P', val: '138', num: 138, pct: 78, delta: '+2.2%', status: 'Memenuhi' },
      { sem: 'AY 2024/2025 Ganjil', short: '24/25 G', val: '141', num: 141, pct: 82, delta: '+2.2%', status: 'Memenuhi' },
      { sem: 'AY 2024/2025 Genap', short: '24/25 P', val: '144', num: 144, pct: 86, delta: '+2.1%', status: 'Memenuhi' },
      { sem: 'AY 2025/2026 Ganjil', short: '25/26 G', val: '146', num: 146, pct: 89, delta: '+1.4%', status: 'Memenuhi' },
      { sem: 'AY 2025/2026 Genap', short: '25/26 P', val: '148', num: 148, pct: 92, delta: '+1.4%', status: 'Terkini' },
    ],
  },
  intake_growth: {
    title: 'Persentase Penurunan Mahasiswa Baru (5 Tahun)',
    badge: 'Student Overview',
    icon: 'trending_up',
    formula: 'Persentase Penurunan MB = average ((B-A)/A)+((C-B)/B)+((D-C)/C)+((E-D)/D)',
    desc: 'Rerata tingkat perubahan intake mahasiswa baru selama rentang 5 tahun.',
    latest: '+3.2%',
    growth: 'Pertumbuhan Positif',
    points: [
      { sem: 'AY 2021/2022 Ganjil', short: '21/22 G', val: '+2.1%', num: 2.1, pct: 50, delta: 'Basis', status: 'Positif' },
      { sem: 'AY 2021/2022 Genap', short: '21/22 P', val: '+2.3%', num: 2.3, pct: 54, delta: '+0.2%', status: 'Positif' },
      { sem: 'AY 2022/2023 Ganjil', short: '22/23 G', val: '+2.5%', num: 2.5, pct: 59, delta: '+0.2%', status: 'Positif' },
      { sem: 'AY 2022/2023 Genap', short: '22/23 P', val: '+2.6%', num: 2.6, pct: 62, delta: '+0.1%', status: 'Positif' },
      { sem: 'AY 2023/2024 Ganjil', short: '23/24 G', val: '+2.8%', num: 2.8, pct: 68, delta: '+0.2%', status: 'Positif' },
      { sem: 'AY 2023/2024 Genap', short: '23/24 P', val: '+2.9%', num: 2.9, pct: 71, delta: '+0.1%', status: 'Positif' },
      { sem: 'AY 2024/2025 Ganjil', short: '24/25 G', val: '+3.0%', num: 3.0, pct: 75, delta: '+0.1%', status: 'Positif' },
      { sem: 'AY 2024/2025 Genap', short: '24/25 P', val: '+3.1%', num: 3.1, pct: 78, delta: '+0.1%', status: 'Positif' },
      { sem: 'AY 2025/2026 Ganjil', short: '25/26 G', val: '+3.1%', num: 3.1, pct: 80, delta: 'Stabil', status: 'Positif' },
      { sem: 'AY 2025/2026 Genap', short: '25/26 P', val: '+3.2%', num: 3.2, pct: 83, delta: '+0.1%', status: 'Terkini' },
    ],
  },
  gpa_prodi: {
    title: 'Average IPK per Program Studi',
    badge: 'Graduate Overview',
    icon: 'bar_chart',
    formula: 'Σ (IPK Lulusan Program Studi) / Total Lulusan Prodi (8 Program Studi)',
    desc: 'Rata-rata kumulatif IPK 8 prodi: Bio Teknologi, Tek. Pangan, Bio Medis, Farmasi, Bio Informatika, Innovation & Entrepreneurship, Magister Bio Manajemen, Apoteker.',
    latest: '3.59',
    growth: 'Rerata 8 Prodi',
    points: [
      { sem: 'AY 2021/2022 Ganjil', short: '21/22 G', val: '3.42', num: 3.42, pct: 68, delta: '+0.03', status: 'Memenuhi' },
      { sem: 'AY 2021/2022 Genap', short: '21/22 P', val: '3.45', num: 3.45, pct: 71, delta: '+0.03', status: 'Memenuhi' },
      { sem: 'AY 2022/2023 Ganjil', short: '22/23 G', val: '3.48', num: 3.48, pct: 74, delta: '+0.03', status: 'Memenuhi' },
      { sem: 'AY 2022/2023 Genap', short: '22/23 P', val: '3.50', num: 3.50, pct: 76, delta: '+0.02', status: 'Memenuhi' },
      { sem: 'AY 2023/2024 Ganjil', short: '23/24 G', val: '3.52', num: 3.52, pct: 78, delta: '+0.02', status: 'Memenuhi' },
      { sem: 'AY 2023/2024 Genap', short: '23/24 P', val: '3.54', num: 3.54, pct: 81, delta: '+0.02', status: 'Memenuhi' },
      { sem: 'AY 2024/2025 Ganjil', short: '24/25 G', val: '3.56', num: 3.56, pct: 84, delta: '+0.02', status: 'Memenuhi' },
      { sem: 'AY 2024/2025 Genap', short: '24/25 P', val: '3.57', num: 3.57, pct: 85, delta: '+0.01', status: 'Memenuhi' },
      { sem: 'AY 2025/2026 Ganjil', short: '25/26 G', val: '3.58', num: 3.58, pct: 87, delta: '+0.01', status: 'Memenuhi' },
      { sem: 'AY 2025/2026 Genap', short: '25/26 P', val: '3.59', num: 3.59, pct: 89, delta: '+0.01', status: 'Terkini' },
    ],
  },
  gpa_s1: {
    title: 'Average IPK Jenjang Sarjana (S1)',
    badge: 'Graduate Overview',
    icon: 'school',
    formula: 'Σ (IPK Lulusan S1) / Total Lulusan S1 pada periode',
    desc: 'Dihitung dari kumulatif IPK seluruh lulusan jenjang sarjana terdaftar.',
    latest: '3.54',
    growth: '+0.03 / Thn',
    points: [
      { sem: 'AY 2021/2022 Ganjil', short: '21/22 G', val: '3.38', num: 3.38, pct: 65, delta: '+0.02', status: 'Memenuhi' },
      { sem: 'AY 2021/2022 Genap', short: '21/22 P', val: '3.41', num: 3.41, pct: 69, delta: '+0.03', status: 'Memenuhi' },
      { sem: 'AY 2022/2023 Ganjil', short: '22/23 G', val: '3.44', num: 3.44, pct: 72, delta: '+0.03', status: 'Memenuhi' },
      { sem: 'AY 2022/2023 Genap', short: '22/23 P', val: '3.46', num: 3.46, pct: 75, delta: '+0.02', status: 'Memenuhi' },
      { sem: 'AY 2023/2024 Ganjil', short: '23/24 G', val: '3.48', num: 3.48, pct: 78, delta: '+0.02', status: 'Memenuhi' },
      { sem: 'AY 2023/2024 Genap', short: '23/24 P', val: '3.50', num: 3.50, pct: 81, delta: '+0.02', status: 'Memenuhi' },
      { sem: 'AY 2024/2025 Ganjil', short: '24/25 G', val: '3.51', num: 3.51, pct: 83, delta: '+0.01', status: 'Memenuhi' },
      { sem: 'AY 2024/2025 Genap', short: '24/25 P', val: '3.52', num: 3.52, pct: 85, delta: '+0.01', status: 'Memenuhi' },
      { sem: 'AY 2025/2026 Ganjil', short: '25/26 G', val: '3.53', num: 3.53, pct: 87, delta: '+0.01', status: 'Memenuhi' },
      { sem: 'AY 2025/2026 Genap', short: '25/26 P', val: '3.54', num: 3.54, pct: 89, delta: '+0.01', status: 'Terkini' },
    ],
  },
  gpa_s2: {
    title: 'Average IPK Jenjang Magister (S2)',
    badge: 'Graduate Overview',
    icon: 'workspace_premium',
    formula: 'Σ (IPK Lulusan S2) / Total Lulusan S2 pada periode',
    desc: 'Indeks kumulatif prestasi lulusan program magister pascasarjana.',
    latest: '3.78',
    growth: '+0.02 / Thn',
    points: [
      { sem: 'AY 2021/2022 Ganjil', short: '21/22 G', val: '3.64', num: 3.64, pct: 72, delta: '+0.02', status: 'Memenuhi' },
      { sem: 'AY 2021/2022 Genap', short: '21/22 P', val: '3.67', num: 3.67, pct: 76, delta: '+0.03', status: 'Memenuhi' },
      { sem: 'AY 2022/2023 Ganjil', short: '22/23 G', val: '3.70', num: 3.70, pct: 80, delta: '+0.03', status: 'Memenuhi' },
      { sem: 'AY 2022/2023 Genap', short: '22/23 P', val: '3.72', num: 3.72, pct: 83, delta: '+0.02', status: 'Memenuhi' },
      { sem: 'AY 2023/2024 Ganjil', short: '23/24 G', val: '3.74', num: 3.74, pct: 86, delta: '+0.02', status: 'Memenuhi' },
      { sem: 'AY 2023/2024 Genap', short: '23/24 P', val: '3.75', num: 3.75, pct: 88, delta: '+0.01', status: 'Memenuhi' },
      { sem: 'AY 2024/2025 Ganjil', short: '24/25 G', val: '3.76', num: 3.76, pct: 90, delta: '+0.01', status: 'Memenuhi' },
      { sem: 'AY 2024/2025 Genap', short: '24/25 P', val: '3.77', num: 3.77, pct: 92, delta: '+0.01', status: 'Memenuhi' },
      { sem: 'AY 2025/2026 Ganjil', short: '25/26 G', val: '3.77', num: 3.77, pct: 92, delta: 'Stabil', status: 'Memenuhi' },
      { sem: 'AY 2025/2026 Genap', short: '25/26 P', val: '3.78', num: 3.78, pct: 94, delta: '+0.01', status: 'Terkini' },
    ],
  },
  ontime_grad: {
    title: 'Persentase Lulus Tepat Waktu',
    badge: 'Formula 8.2.2',
    icon: 'timer',
    formula: '(A/B) x 100% dimana A = lulusan Tahun lulus (-) Tahun Angkatan = 4, B = intake angkatan',
    desc: 'Persentase kelulusan sarjana tepat waktu sesuai masa kurikulum 4 tahun.',
    latest: '83.2%',
    growth: '+3.2% vs Target',
    points: [
      { sem: 'AY 2021/2022 Ganjil', short: '21/22 G', val: '77.5%', num: 77.5, pct: 58, delta: '+1.5%', status: 'Evaluasi' },
      { sem: 'AY 2021/2022 Genap', short: '21/22 P', val: '78.8%', num: 78.8, pct: 62, delta: '+1.3%', status: 'Evaluasi' },
      { sem: 'AY 2022/2023 Ganjil', short: '22/23 G', val: '79.6%', num: 79.6, pct: 66, delta: '+0.8%', status: 'Evaluasi' },
      { sem: 'AY 2022/2023 Genap', short: '22/23 P', val: '80.5%', num: 80.5, pct: 70, delta: '+0.9%', status: 'Tercapai' },
      { sem: 'AY 2023/2024 Ganjil', short: '23/24 G', val: '81.2%', num: 81.2, pct: 73, delta: '+0.7%', status: 'Tercapai' },
      { sem: 'AY 2023/2024 Genap', short: '23/24 P', val: '81.9%', num: 81.9, pct: 76, delta: '+0.7%', status: 'Tercapai' },
      { sem: 'AY 2024/2025 Ganjil', short: '24/25 G', val: '82.4%', num: 82.4, pct: 79, delta: '+0.5%', status: 'Tercapai' },
      { sem: 'AY 2024/2025 Genap', short: '24/25 P', val: '82.8%', num: 82.8, pct: 81, delta: '+0.4%', status: 'Tercapai' },
      { sem: 'AY 2025/2026 Ganjil', short: '25/26 G', val: '83.0%', num: 83.0, pct: 83, delta: '+0.2%', status: 'Tercapai' },
      { sem: 'AY 2025/2026 Genap', short: '25/26 P', val: '83.2%', num: 83.2, pct: 85, delta: '+0.2%', status: 'Terkini' },
    ],
  },
  study_success: {
    title: 'Persentase Keberhasilan Studi',
    badge: 'Formula 8.2.3',
    icon: 'verified',
    formula: '(A/B) x 100% batas 7 tahun dimana A = lulusan s/d 7 tahun, B = intake angkatan',
    desc: 'Persentase keberhasilan kelulusan tanpa melewati batas maksimal 7 tahun (14 semester).',
    latest: '92.4%',
    growth: '+7.4% vs Target',
    points: [
      { sem: 'AY 2021/2022 Ganjil', short: '21/22 G', val: '88.1%', num: 88.1, pct: 70, delta: '+1.0%', status: 'Exceeded' },
      { sem: 'AY 2021/2022 Genap', short: '21/22 P', val: '88.9%', num: 88.9, pct: 73, delta: '+0.8%', status: 'Exceeded' },
      { sem: 'AY 2022/2023 Ganjil', short: '22/23 G', val: '89.5%', num: 89.5, pct: 76, delta: '+0.6%', status: 'Exceeded' },
      { sem: 'AY 2022/2023 Genap', short: '22/23 P', val: '90.2%', num: 90.2, pct: 80, delta: '+0.7%', status: 'Exceeded' },
      { sem: 'AY 2023/2024 Ganjil', short: '23/24 G', val: '90.8%', num: 90.8, pct: 83, delta: '+0.6%', status: 'Exceeded' },
      { sem: 'AY 2023/2024 Genap', short: '23/24 P', val: '91.3%', num: 91.3, pct: 86, delta: '+0.5%', status: 'Exceeded' },
      { sem: 'AY 2024/2025 Ganjil', short: '24/25 G', val: '91.8%', num: 91.8, pct: 89, delta: '+0.5%', status: 'Exceeded' },
      { sem: 'AY 2024/2025 Genap', short: '24/25 P', val: '92.0%', num: 92.0, pct: 90, delta: '+0.2%', status: 'Exceeded' },
      { sem: 'AY 2025/2026 Ganjil', short: '25/26 G', val: '92.2%', num: 92.2, pct: 92, delta: '+0.2%', status: 'Exceeded' },
      { sem: 'AY 2025/2026 Genap', short: '25/26 P', val: '92.4%', num: 92.4, pct: 94, delta: '+0.2%', status: 'Terkini' },
    ],
  },
  mbkm_eligible_pct: {
    title: 'Persentase MBKM terhadap Mahasiswa Eligible',
    badge: 'Formula 8.3.1 (IKU 2)',
    icon: 'pie_chart',
    formula: 'Persentase MBKM = (MBKM / Eligible) x 100%, MBKM = aktif + status selesai/evaluasi, Eligible = semester 7 aktif',
    desc: 'Rasio partisipasi MBKM terhadap mahasiswa semester 7 aktif yang memenuhi syarat SKS.',
    latest: '69.8%',
    growth: '+15.4% 5-Yr',
    points: [
      { sem: 'AY 2021/2022 Ganjil', short: '21/22 G', val: '42.0%', num: 42.0, pct: 40, delta: '+5.0%', status: 'Cukup' },
      { sem: 'AY 2021/2022 Genap', short: '21/22 P', val: '46.5%', num: 46.5, pct: 46, delta: '+4.5%', status: 'Cukup' },
      { sem: 'AY 2022/2023 Ganjil', short: '22/23 G', val: '51.2%', num: 51.2, pct: 53, delta: '+4.7%', status: 'Memenuhi' },
      { sem: 'AY 2022/2023 Genap', short: '22/23 P', val: '55.8%', num: 55.8, pct: 60, delta: '+4.6%', status: 'Memenuhi' },
      { sem: 'AY 2023/2024 Ganjil', short: '23/24 G', val: '60.4%', num: 60.4, pct: 67, delta: '+4.6%', status: 'Memenuhi' },
      { sem: 'AY 2023/2024 Genap', short: '23/24 P', val: '63.2%', num: 63.2, pct: 71, delta: '+2.8%', status: 'Memenuhi' },
      { sem: 'AY 2024/2025 Ganjil', short: '24/25 G', val: '65.8%', num: 65.8, pct: 76, delta: '+2.6%', status: 'Memenuhi' },
      { sem: 'AY 2024/2025 Genap', short: '24/25 P', val: '67.4%', num: 67.4, pct: 80, delta: '+1.6%', status: 'Memenuhi' },
      { sem: 'AY 2025/2026 Ganjil', short: '25/26 G', val: '68.9%', num: 68.9, pct: 83, delta: '+1.5%', status: 'Memenuhi' },
      { sem: 'AY 2025/2026 Genap', short: '25/26 P', val: '69.8%', num: 69.8, pct: 86, delta: '+0.9%', status: 'Terkini' },
    ],
  },
  eligible_sem7: {
    title: 'Total Mahasiswa Eligible (Semester 7)',
    badge: 'MBKM Overview',
    icon: 'checklist',
    formula: 'Eligible = semester 7 aktif dengan beban SKS selesai ≥ 80 SKS',
    desc: 'Kelompok mahasiswa aktif semester 7 yang memenuhi prasyarat registrasi MBKM.',
    latest: '106',
    growth: '+3.9% YoY',
    points: [
      { sem: 'AY 2021/2022 Ganjil', short: '21/22 G', val: '82', num: 82, pct: 55, delta: '+2.5%', status: 'Terverifikasi' },
      { sem: 'AY 2021/2022 Genap', short: '21/22 P', val: '85', num: 85, pct: 59, delta: '+3.7%', status: 'Terverifikasi' },
      { sem: 'AY 2022/2023 Ganjil', short: '22/23 G', val: '89', num: 89, pct: 64, delta: '+4.7%', status: 'Terverifikasi' },
      { sem: 'AY 2022/2023 Genap', short: '22/23 P', val: '92', num: 92, pct: 68, delta: '+3.4%', status: 'Terverifikasi' },
      { sem: 'AY 2023/2024 Ganjil', short: '23/24 G', val: '96', num: 96, pct: 73, delta: '+4.3%', status: 'Terverifikasi' },
      { sem: 'AY 2023/2024 Genap', short: '23/24 P', val: '98', num: 98, pct: 76, delta: '+2.1%', status: 'Terverifikasi' },
      { sem: 'AY 2024/2025 Ganjil', short: '24/25 G', val: '101', num: 101, pct: 80, delta: '+3.1%', status: 'Terverifikasi' },
      { sem: 'AY 2024/2025 Genap', short: '24/25 P', val: '103', num: 103, pct: 83, delta: '+2.0%', status: 'Terverifikasi' },
      { sem: 'AY 2025/2026 Ganjil', short: '25/26 G', val: '105', num: 105, pct: 86, delta: '+1.9%', status: 'Terverifikasi' },
      { sem: 'AY 2025/2026 Genap', short: '25/26 P', val: '106', num: 106, pct: 88, delta: '+1.0%', status: 'Terkini' },
    ],
  },
};

/**
 * Modal detail metrik interaktif dengan visualisasi AreaChart (diberi label 'Line Chart' di UI)
 * dan Bar Chart serta tabel rincian data per semester.
 * 
 * Mengimplementasikan animasi maximize/minimize berbasis koordinat asal (originRect) bergaya macOS:
 * 1. Mounting: Render di posisi persis kartu asal (`originRect`) dengan opasitas rendah.
 * 2. Animate In (Maximize): Bertransisi mulus ke tengah layar dengan easing `cubic-bezier(0.16, 1, 0.3, 1)`.
 * 3. Animate Out (Minimize): Saat ditutup, mengecil dan meluncur kembali ke posisi kartu asal sebelum unmount.
 *
 * @param {Object} props
 * @param {string|null} props.metricKey - Kunci data metrik yang ditampilkan
 * @param {Function} props.onClose - Callback saat modal selesai ditutup
 * @param {Object|null} [props.originRect] - Koordinat geometris {top, left, width, height} kartu pemanggil
 */
export const InteractiveMetricModal = ({ metricKey, onClose, originRect }) => {
  // Hanya ada opsi 'area' (yang dilabeli 'Line Chart') dan 'bar'
  const [chartType, setChartType] = useState('area');
  
  // State untuk mengontrol lifecycle animasi 2 tahap (origin -> center -> origin)
  const [isMounted, setIsMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Sinkronisasi kemunculan modal saat metricKey aktif
  useEffect(() => {
    if (metricKey) {
      setIsMounted(true);
      // Menggunakan double requestAnimationFrame agar browser selesai melakukan reflow initial state
      const raf1 = requestAnimationFrame(() => {
        const raf2 = requestAnimationFrame(() => {
          setIsAnimating(true);
        });
        return () => cancelAnimationFrame(raf2);
      });
      return () => cancelAnimationFrame(raf1);
    } else {
      setIsAnimating(false);
      setIsMounted(false);
    }
  }, [metricKey]);

  /**
   * Handler penutupan dengan animasi minimize kembali ke originRect
   */
  const handleClose = () => {
    setIsAnimating(false);
    // Tunggu 350ms sesuai durasi transisi CSS sebelum unmount
    setTimeout(() => {
      setIsMounted(false);
      if (onClose) onClose();
    }, 350);
  };

  const data = useMemo(() => {
    return METRIC_DETAILS_DATA[metricKey] || METRIC_DETAILS_DATA.active_students;
  }, [metricKey]);

  if (!isMounted && !metricKey) return null;

  const points = data.points;

  // Hitung offset transform dari posisi tengah layar ke posisi fisik kartu asal
  const hasOrigin = Boolean(originRect && originRect.width && originRect.height);

  let transformStyle = 'translate(-50%, -50%) scale(1)';
  let originOpacity = 1;

  if (hasOrigin && !isAnimating) {
    // Posisi target modal di tengah viewport
    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = window.innerHeight / 2;

    // Posisi tengah kartu pemanggil
    const cardCenterX = originRect.left + originRect.width / 2;
    const cardCenterY = originRect.top + originRect.height / 2;

    // Hitung jarak translasi X dan Y
    const deltaX = cardCenterX - viewportCenterX;
    const deltaY = cardCenterY - viewportCenterY;

    // Hitung skala komparatif (ukuran kartu / modal target ~768px x 600px)
    const targetModalWidth = Math.min(window.innerWidth * 0.92, 768);
    const targetModalHeight = Math.min(window.innerHeight * 0.90, 600);
    const scaleX = Math.max(0.2, originRect.width / targetModalWidth);
    const scaleY = Math.max(0.2, originRect.height / targetModalHeight);
    const scale = Math.min(scaleX, scaleY);

    transformStyle = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px)) scale(${scale})`;
    originOpacity = 0;
  } else if (!hasOrigin && !isAnimating) {
    transformStyle = 'translate(-50%, -50%) scale(0.85)';
    originOpacity = 0;
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-0 transition-opacity duration-300 ease-out ${
        isAnimating ? 'bg-black/50 backdrop-blur-sm opacity-100' : 'bg-black/0 backdrop-blur-none opacity-0 pointer-events-none'
      }`}
      id="metric-modal-backdrop"
      onClick={(e) => {
        if (e.target.id === 'metric-modal-backdrop') {
          handleClose();
        }
      }}
    >
      <div
        style={{
          transform: transformStyle,
          opacity: isAnimating ? 1 : originOpacity,
          transition: 'transform 350ms cubic-bezier(0.16, 1, 0.3, 1), opacity 300ms ease-out',
        }}
        className="fixed top-1/2 left-1/2 w-[min(92vw,48rem)] max-h-[90vh] z-50 bg-surface-container-lowest shadow-2xl rounded-2xl border border-outline-variant/40 overflow-hidden flex flex-col will-change-transform"
        id="metric-modal-box"
      >
        {/* Header Modal */}
        <div className="p-5 border-b border-surface-container-high flex items-start justify-between bg-surface-container-low/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-fixed/50 flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[24px]">{data.icon}</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                  {data.badge}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">
                  Terverifikasi
                </span>
              </div>
              <h3 className="font-headline-lg text-lg font-bold text-on-surface mt-0.5 truncate">
                {data.title}
              </h3>
            </div>
          </div>
          <button
            className="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer shrink-0"
            type="button"
            onClick={handleClose}
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Isi Modal */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Box Formula Resmi */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-low p-4 rounded-xl border border-surface-container-high">
            <div className="flex-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
                Formula Resmi (kebutuhanData.md)
              </span>
              <p className="text-xs font-semibold text-on-surface mt-1">{data.formula}</p>
              <p className="text-[11px] text-on-surface-variant mt-1">{data.desc}</p>
            </div>
            <div className="text-right border-t md:border-t-0 md:border-l border-surface-container-high pt-2 md:pt-0 md:pl-4">
              <div className="text-[11px] text-outline font-semibold uppercase">
                Nilai Terkini (25/26 Ganjil)
              </div>
              <div className="font-metric-display text-2xl font-extrabold text-primary">
                {data.latest}
              </div>
              <div className="text-xs font-semibold text-emerald-600 mt-0.5">{data.growth}</div>
            </div>
          </div>

          {/* Visualisasi Tren Data */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <h4 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary"></span> Visualisasi Tren Data (5
                Tahun Terakhir)
              </h4>
              <div className="inline-flex items-center rounded-lg border border-surface-container-high bg-surface-container-low p-0.5">
                {/* Tombol Line Chart yang di bawah layar merender AreaChart dengan isian lembut */}
                <button
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    chartType === 'area'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                  type="button"
                  onClick={() => setChartType('area')}
                >
                  📈 Line Chart
                </button>
                <button
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    chartType === 'bar'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                  type="button"
                  onClick={() => setChartType('bar')}
                >
                  📊 Bar Chart
                </button>
              </div>
            </div>

            <div className="bg-surface-container-low/50 border border-surface-container-high/60 rounded-xl p-4">
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'bar' ? (
                    <BarChart
                      data={points}
                      margin={{ top: 12, right: 12, bottom: 0, left: -20 }}
                    >
                      <CartesianGrid vertical={false} stroke="#E2E8F0" strokeDasharray="3 3" />
                      <XAxis
                        dataKey="short"
                        tick={{ fontSize: 10, fill: '#6f7882' }}
                        axisLine={{ stroke: '#E2E8F0' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#6f7882' }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={true}
                      />
                      <RechartsTooltip content={<ModalChartTooltip />} />
                      <Bar
                        dataKey="num"
                        fill="#006192"
                        radius={[4, 4, 0, 0]}
                        isAnimationActive
                      />
                    </BarChart>
                  ) : (
                    /* AreaChart dengan fill gradient lembut, dilabeli secara fungsional & visual sebagai Line Chart */
                    <AreaChart
                      data={points}
                      margin={{ top: 12, right: 12, bottom: 0, left: -20 }}
                    >
                      <defs>
                        <linearGradient id="modalAreaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#006192" stopOpacity={0.32} />
                          <stop offset="100%" stopColor="#006192" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="#E2E8F0" strokeDasharray="3 3" />
                      <XAxis
                        dataKey="short"
                        tick={{ fontSize: 10, fill: '#6f7882' }}
                        axisLine={{ stroke: '#E2E8F0' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#6f7882' }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={true}
                      />
                      <RechartsTooltip content={<ModalChartTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="num"
                        stroke="#006192"
                        strokeWidth={2.5}
                        fill="url(#modalAreaGradient)"
                        dot={{ r: 3.5, fill: '#006192', strokeWidth: 0 }}
                        activeDot={{ r: 5.5, fill: '#006192', stroke: '#cce5ff', strokeWidth: 2 }}
                        isAnimationActive
                      />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Rincian Tabel Semester */}
          <div>
            <h4 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-secondary"></span> Rincian Tabel Semester
            </h4>
            <div className="border border-surface-container-high rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-container-low border-b border-surface-container-high text-outline text-[11px] font-semibold">
                  <tr>
                    <th className="py-2 px-3">Semester</th>
                    <th className="py-2 px-3 text-right">Nilai Capaian</th>
                    <th className="py-2 px-3 text-right">Delta / YoY</th>
                    <th className="py-2 px-3 text-right">Status Evaluasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high/60 bg-surface-container-lowest font-medium">
                  {points.map((pt, i) => {
                    const isLast = i === points.length - 1;
                    const rowBg = isLast
                      ? 'bg-primary-fixed/20 font-bold'
                      : i % 2 === 0
                      ? 'bg-surface-container-lowest'
                      : 'bg-surface-container-low/30';

                    return (
                      <tr key={pt.sem} className={`${rowBg} hover:bg-surface-container-low transition-colors`}>
                        <td className="py-2 px-3 text-on-surface">{pt.sem}</td>
                        <td
                          className={`py-2 px-3 text-right font-bold ${
                            isLast ? 'text-primary' : 'text-on-surface'
                          }`}
                        >
                          {pt.val}
                        </td>
                        <td className="py-2 px-3 text-right text-emerald-600 font-semibold">
                          {pt.delta}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] ${
                              isLast
                                ? 'bg-primary text-white font-bold'
                                : 'bg-surface-container text-on-surface-variant'
                            }`}
                          >
                            {pt.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Modal */}
        <div className="p-4 border-t border-surface-container-high bg-surface-container-low/40 flex items-center justify-between text-xs shrink-0">
          <span className="text-[11px] text-outline">Sumber data: Sevima Cloud Feeder & PDDIKTI Sync</span>
          <button
            className="px-4 py-2 bg-primary hover:bg-primary-container text-on-primary rounded-lg font-semibold transition-colors cursor-pointer"
            type="button"
            onClick={handleClose}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default InteractiveMetricModal;

