import React, { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ComposedChart,
  Area,
} from 'recharts';
import {
  groupGraduateGpaByProdi,
  groupGraduateGpaByFaculty,
  groupGraduateGpaBands,
  groupGraduatesByGraduationYear,
  groupGraduatesByPredikat,
  calculateGraduateAverageGpa,
  getOnTimeGraduationByCohort,
  getStudySuccessByCohort,
} from '@/logicDump/graduateMetrics';

const COLORS = {
  primary: '#006192',
  primaryContainer: '#cce5ff',
  secondary: '#535f70',
  tertiary: '#6b5778',
  teal: '#0d9488',
  emerald: '#059669',
  amber: '#d97706',
  indigo: '#4f46e5',
  rose: '#e11d48',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  const name = label || item.name;
  const value = item.value;

  return (
    <div className="rounded-lg border border-surface-container-high bg-white px-3 py-2 shadow-xl">
      <p className="text-xs font-semibold text-on-surface">{name}</p>
      <p className="text-xs text-on-surface-variant tabular-nums mt-0.5">
        Nilai: <span className="font-bold text-primary">{value}</span>
      </p>
      {item.payload?.count !== undefined && (
        <p className="text-[11px] text-on-surface-variant mt-0.5">
          Jumlah: {item.payload.count} lulusan
        </p>
      )}
    </div>
  );
};

const OnTimeTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0]?.payload;
  if (!p) return null;

  return (
    <div className="rounded-lg border border-surface-container-high bg-white px-3.5 py-2.5 shadow-xl min-w-[200px]">
      <div className="flex items-center justify-between border-b border-surface-container-high pb-1.5 mb-1.5">
        <p className="text-xs font-bold text-on-surface">{p.cohortLabel}</p>
        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
          {p.rateFormatted}
        </span>
      </div>
      <div className="space-y-1 text-xs text-on-surface-variant">
        <div className="flex justify-between">
          <span>Lulus Tepat (4 Thn):</span>
          <span className="font-bold text-on-surface">{p.onTimeCount} mhs</span>
        </div>
        <div className="flex justify-between">
          <span>Lulus &gt; 4 Thn:</span>
          <span className="font-medium text-rose-600">{p.lateCount} mhs</span>
        </div>
        <div className="flex justify-between border-t border-surface-container-high pt-1">
          <span>Total Lulusan S1:</span>
          <span className="font-bold text-primary">{p.totalS1} mhs</span>
        </div>
      </div>
    </div>
  );
};

export const GraduateDetailModal = ({ metricType, originRect, onClose, data }) => {
  const [activeGpaTab, setActiveGpaTab] = useState('prodi');
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimating(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 280);
  };

  // Data aggregations
  const prodiGpaData = useMemo(() => groupGraduateGpaByProdi(data), [data]);
  const facultyGpaData = useMemo(() => groupGraduateGpaByFaculty(data), [data]);
  const gpaBandsData = useMemo(() => groupGraduateGpaBands(data), [data]);
  const yearTrendData = useMemo(() => groupGraduatesByGraduationYear(data), [data]);
  const predikatData = useMemo(() => groupGraduatesByPredikat(data), [data]);
  const s1Gpa = useMemo(() => calculateGraduateAverageGpa(data, 'S1'), [data]);
  const s2Gpa = useMemo(() => calculateGraduateAverageGpa(data, 'S2'), [data]);
  const onTimeCohortData = useMemo(() => getOnTimeGraduationByCohort(data), [data]);
  const successCohortData = useMemo(() => getStudySuccessByCohort(data), [data]);

  // Origin rect positioning for macOS zoom animation
  const originTop = originRect ? originRect.top + originRect.height / 2 : window.innerHeight / 2;
  const originLeft = originRect ? originRect.left + originRect.width / 2 : window.innerWidth / 2;
  const deltaX = originLeft - window.innerWidth / 2;
  const deltaY = originTop - window.innerHeight / 2;

  const transformStyle = isAnimating
    ? 'translate(-50%, -50%) scale(1)'
    : `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px)) scale(0.2)`;

  // Tentukan konfigurasi header dan tipe konten berdasarkan metricType
  const modalConfig = useMemo(() => {
    switch (metricType) {
      case 'total-graduates':
        return {
          title: 'Total Lulusan & Tren Tahunan (PDDIKTI)',
          badge: 'Graduate Body Registry',
          icon: 'school',
          iconBg: 'bg-primary-fixed/60 text-primary',
        };
      case 'gpa-overview':
        return {
          title: 'Analitik & Distribusi IPK Lulusan',
          badge: 'Academic GPA Performance',
          icon: 'grade',
          iconBg: 'bg-teal-50 text-teal-700',
        };
      case 'on-time-graduation':
        return {
          title: 'Analitik Kelulusan Tepat Waktu (4 Tahun S1)',
          badge: 'On-Time Graduation KPI',
          icon: 'timer',
          iconBg: 'bg-amber-100 text-amber-900',
        };
      case 'study-success':
        return {
          title: 'Analitik Keberhasilan Studi (Maks. 7 Tahun)',
          badge: 'Study Success Rate KPI',
          icon: 'verified_user',
          iconBg: 'bg-emerald-50 text-emerald-700',
        };
      default:
        return {
          title: 'Rincian Data Lulusan',
          badge: 'Graduate Analytics',
          icon: 'school',
          iconBg: 'bg-primary-fixed/60 text-primary',
        };
    }
  }, [metricType]);

  return (
    <div
      id="graduate-detail-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
      style={{ opacity: isAnimating ? 1 : 0 }}
      onClick={(e) => {
        if (e.target.id === 'graduate-detail-modal-backdrop') handleClose();
      }}
    >
      <div
        style={{
          transform: transformStyle,
          opacity: isAnimating ? 1 : 0,
          transition: 'transform 350ms cubic-bezier(0.16, 1, 0.3, 1), opacity 300ms ease-out',
        }}
        className="fixed top-1/2 left-1/2 w-[min(94vw,62rem)] max-h-[92vh] z-50 bg-surface-container-lowest shadow-2xl rounded-2xl border border-outline-variant/40 overflow-hidden flex flex-col will-change-transform"
      >
        {/* Header Modal */}
        <div className="p-5 border-b border-surface-container-high flex items-start justify-between bg-surface-container-low/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${modalConfig.iconBg}`}>
              <span className="material-symbols-outlined text-[24px]">{modalConfig.icon}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                  {modalConfig.badge}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-bold">
                  PDDikti Verified
                </span>
              </div>
              <h3 className="font-headline-lg text-lg font-bold text-on-surface mt-0.5 truncate">
                {modalConfig.title}
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

        {/* Konten Modal yang BERBEDA SESUAI DENGAN KARTU YANG DIKLIK */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-surface-container-lowest">
          {/* ========================================================================= */}
          {/* 1. KONTEN KHUSUS CARD 1: TOTAL LULUSAN & TREN TAHUNAN & PREDIKAT          */}
          {/* ========================================================================= */}
          {metricType === 'total-graduates' && (
            <div className="space-y-6">
              {/* Banner Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-low p-4 rounded-xl border border-surface-container-high">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
                    Definisi & Ruang Lingkup
                  </span>
                  <p className="text-xs font-semibold text-on-surface mt-1">
                    Akumulasi seluruh mahasiswa yang telah menyelesaikan studi dan diyudisium di PDDIKTI.
                  </p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    Data mencakup lulusan jenjang Sarjana (S1) dan Magister (S2) terverifikasi.
                  </p>
                </div>
                <div className="text-right sm:border-l sm:border-surface-container-high sm:pl-4">
                  <div className="text-[11px] text-outline font-semibold uppercase">Total Lulusan</div>
                  <div className="font-metric-display text-2xl font-extrabold text-primary">
                    {data.length.toLocaleString('en-US')}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">+5.8% YoY</div>
                </div>
              </div>

              {/* Chart Tren Tahunan Lulusan */}
              <div className="bg-surface-container-low/40 border border-surface-container-high/60 rounded-xl p-5">
                <h4 className="font-headline-sm text-sm font-bold text-on-surface uppercase tracking-wider mb-1 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                  Tren Akumulasi Lulusan per Tahun Kelulusan
                </h4>
                <p className="text-xs text-on-surface-variant mb-4">
                  Perkembangan jumlah lulusan yang diwisuda pada setiap tahun akademik
                </p>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={yearTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="count"
                        name="Jumlah Lulusan"
                        stroke={COLORS.primary}
                        strokeWidth={3}
                        dot={{ r: 5, fill: COLORS.primary }}
                        activeDot={{ r: 7 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Distribusi Predikat Kelulusan */}
              <div className="bg-surface-container-low/40 border border-surface-container-high/60 rounded-xl p-5">
                <h4 className="font-headline-sm text-sm font-bold text-on-surface uppercase tracking-wider mb-3">
                  Distribusi Predikat Kelulusan Mahasiswa
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={predikatData}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={75}
                          innerRadius={40}
                          paddingAngle={4}
                        >
                          {predikatData.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {predikatData.map((p, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-surface-container-high text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                          <span className="font-medium text-on-surface">{p.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-on-surface">{p.count} orang</span>
                          <span className="text-outline">{p.percentage}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. KONTEN KHUSUS CARD 2: ANALITIK & RATA-RATA IPK LULUSAN                */}
          {/* ========================================================================= */}
          {metricType === 'gpa-overview' && (
            <div className="space-y-6">
              {/* Ringkasan IPK Jenjang S1 vs S2 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-outline uppercase tracking-wider">
                      Rata-rata IPK Sarjana (S1)
                    </span>
                    <div className="font-metric-display text-2xl font-extrabold text-primary mt-1">
                      {s1Gpa.average}
                    </div>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      Dihitung dari {s1Gpa.count} lulusan sarjana
                    </p>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary-fixed text-primary">
                    S1
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-outline uppercase tracking-wider">
                      Rata-rata IPK Magister (S2)
                    </span>
                    <div className="font-metric-display text-2xl font-extrabold text-secondary mt-1">
                      {s2Gpa.average}
                    </div>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      Dihitung dari {s2Gpa.count} lulusan magister
                    </p>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                    S2
                  </span>
                </div>
              </div>

              {/* Tab Selector untuk IPK */}
              <div className="flex gap-4 border-b border-surface-container-high">
                <button
                  onClick={() => setActiveGpaTab('prodi')}
                  className={`pb-2 text-xs font-semibold uppercase tracking-wider transition-colors relative cursor-pointer ${
                    activeGpaTab === 'prodi'
                      ? 'text-primary font-bold'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                  type="button"
                >
                  IPK Per Program Studi
                  {activeGpaTab === 'prodi' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                  )}
                </button>
                <button
                  onClick={() => setActiveGpaTab('faculty')}
                  className={`pb-2 text-xs font-semibold uppercase tracking-wider transition-colors relative cursor-pointer ${
                    activeGpaTab === 'faculty'
                      ? 'text-primary font-bold'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                  type="button"
                >
                  IPK Per Fakultas
                  {activeGpaTab === 'faculty' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                  )}
                </button>
                <button
                  onClick={() => setActiveGpaTab('bands')}
                  className={`pb-2 text-xs font-semibold uppercase tracking-wider transition-colors relative cursor-pointer ${
                    activeGpaTab === 'bands'
                      ? 'text-primary font-bold'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                  type="button"
                >
                  Distribusi Rentang IPK
                  {activeGpaTab === 'bands' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                  )}
                </button>
              </div>

              {/* Konten Tab IPK */}
              {activeGpaTab === 'prodi' && (
                <div className="bg-surface-container-low/40 border border-surface-container-high/60 rounded-xl p-5">
                  <h4 className="font-headline-sm text-sm font-bold text-on-surface uppercase tracking-wider mb-3">
                    Rata-rata IPK per Program Studi
                  </h4>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={prodiGpaData}
                        margin={{ top: 5, right: 30, left: 140, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                        <XAxis type="number" domain={[0, 4]} tick={{ fontSize: 11 }} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={130} />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Bar dataKey="gpaValue" fill={COLORS.primary} radius={[0, 4, 4, 0]} barSize={16} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {activeGpaTab === 'faculty' && (
                <div className="bg-surface-container-low/40 border border-surface-container-high/60 rounded-xl p-5">
                  <h4 className="font-headline-sm text-sm font-bold text-on-surface uppercase tracking-wider mb-3">
                    Rata-rata IPK per Fakultas
                  </h4>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={facultyGpaData}
                        margin={{ top: 5, right: 30, left: 160, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                        <XAxis type="number" domain={[0, 4]} tick={{ fontSize: 11 }} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={150} />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Bar dataKey="gpaValue" fill={COLORS.teal} radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {activeGpaTab === 'bands' && (
                <div className="bg-surface-container-low/40 border border-surface-container-high/60 rounded-xl p-5">
                  <h4 className="font-headline-sm text-sm font-bold text-on-surface uppercase tracking-wider mb-3">
                    Distribusi Lulusan Berdasarkan Rentang IPK
                  </h4>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={gpaBandsData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" name="Jumlah Lulusan" fill={COLORS.teal} radius={[4, 4, 0, 0]} barSize={32} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. KONTEN KHUSUS CARD 3: ANALITIK KELULUSAN TEPAT WAKTU (4 TAHUN S1)      */}
          {/* ========================================================================= */}
          {metricType === 'on-time-graduation' && (
            <div className="space-y-6">
              {/* Banner Rumus & Ketentuan */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-low p-4 rounded-xl border border-surface-container-high">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
                    Formula & Standar KPI Dikti
                  </span>
                  <p className="text-xs font-semibold text-on-surface mt-1">
                    % Tepat Waktu = (Jumlah lulusan yang Tahun Lulus - Tahun Angkatan = 4) / Total Lulusan S1 × 100%
                  </p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    Target Akreditasi & KPI Institusi: Minimal 80% lulusan sarjana menyelesaikan studi dalam 4 tahun.
                  </p>
                </div>
                <div className="text-right sm:border-l sm:border-surface-container-high sm:pl-4">
                  <div className="text-[11px] text-outline font-semibold uppercase">Target Capaian</div>
                  <div className="font-metric-display text-2xl font-extrabold text-amber-700">
                    &ge; 80.0%
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                    Standar Unggul
                  </span>
                </div>
              </div>

              {/* Composed Chart Tren Tepat Waktu per Cohort */}
              <div className="bg-surface-container-low/40 border border-surface-container-high/60 rounded-xl p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h4 className="font-headline-sm text-sm font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                      Persentase Kelulusan Tepat Waktu per Angkatan (S1)
                    </h4>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Membandingkan jumlah lulusan tepat 4 tahun vs total lulusan pada angkatan tersebut
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-3 text-xs bg-white px-3 py-1.5 rounded-lg border border-surface-container-high shadow-xs">
                    <span className="flex items-center gap-1.5 font-medium text-on-surface">
                      <span className="w-3 h-3 rounded bg-amber-500/40 border border-amber-600" /> % Tepat Waktu
                    </span>
                    <span className="flex items-center gap-1.5 font-medium text-on-surface">
                      <span className="w-3 h-3 rounded bg-primary/20 border border-primary" /> Total S1
                    </span>
                  </div>
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={onTimeCohortData} margin={{ top: 16, right: 24, bottom: 8, left: -10 }}>
                      <CartesianGrid vertical={false} stroke="#E2E8F0" strokeDasharray="3 3" />
                      <XAxis dataKey="cohortLabel" tick={{ fontSize: 11, fill: '#6f7882' }} tickLine={false} />
                      <YAxis yAxisId="left" unit="%" tick={{ fontSize: 11, fill: '#6f7882' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#6f7882' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <RechartsTooltip content={<OnTimeTooltip />} />
                      <Bar yAxisId="right" dataKey="totalS1" name="Total Lulusan S1" fill="#006192" opacity={0.25} radius={[4, 4, 0, 0]} barSize={36} />
                      <Area yAxisId="left" type="monotone" dataKey="rate" name="% Tepat Waktu" stroke="#d97706" strokeWidth={3} fill="#d97706" fillOpacity={0.15} dot={{ r: 4.5, fill: '#d97706' }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Tabel Rekapitulasi Cohort */}
              <div className="bg-surface-container-low/30 border border-surface-container-high/60 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-surface-container-low border-b border-surface-container-high flex items-center justify-between">
                  <h5 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                    Tabel Evaluasi Kelulusan Tepat Waktu per Angkatan
                  </h5>
                  <span className="text-[11px] text-outline font-medium">PDDIKTI Verified</span>
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container-low/80 border-b border-surface-container-high text-outline text-[11px] font-semibold">
                    <tr>
                      <th className="py-2.5 px-4">Angkatan (Cohort)</th>
                      <th className="py-2.5 px-4 text-right">Lulus Tepat 4 Tahun</th>
                      <th className="py-2.5 px-4 text-right">Lulus &gt; 4 Tahun</th>
                      <th className="py-2.5 px-4 text-right">Total Lulusan S1</th>
                      <th className="py-2.5 px-4 text-right">Persentase Tepat Waktu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high/60 bg-surface-container-lowest font-medium">
                    {onTimeCohortData.map((row) => (
                      <tr key={row.cohort} className="hover:bg-surface-container-low/40 transition-colors">
                        <td className="py-2.5 px-4 text-on-surface font-semibold">{row.cohortLabel}</td>
                        <td className="py-2.5 px-4 text-right text-emerald-700 font-bold tabular-nums">
                          {row.onTimeCount} mhs
                        </td>
                        <td className="py-2.5 px-4 text-right text-rose-600 tabular-nums">
                          {row.lateCount} mhs
                        </td>
                        <td className="py-2.5 px-4 text-right text-on-surface tabular-nums">
                          {row.totalS1} mhs
                        </td>
                        <td className="py-2.5 px-4 text-right font-extrabold text-amber-700 tabular-nums">
                          {row.rateFormatted}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. KONTEN KHUSUS CARD 4: ANALITIK KEBERHASILAN STUDI (MAKS. 7 TAHUN)      */}
          {/* ========================================================================= */}
          {metricType === 'study-success' && (
            <div className="space-y-6">
              {/* Banner Rumus & Ketentuan */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-low p-4 rounded-xl border border-surface-container-high">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
                    Formula & Batas Masa Studi (PDDIKTI)
                  </span>
                  <p className="text-xs font-semibold text-on-surface mt-1">
                    Keberhasilan Studi (%) = (Jumlah mahasiswa yang lulus dalam batas toleransi masa studi) / Total Mahasiswa × 100%
                  </p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    Batas masa studi SN-Dikti: Sarjana (S1) maksimal 7 tahun (14 semester), Magister (S2) maksimal 4 tahun (8 semester).
                  </p>
                </div>
                <div className="text-right sm:border-l sm:border-surface-container-high sm:pl-4">
                  <div className="text-[11px] text-outline font-semibold uppercase">Target Keberhasilan</div>
                  <div className="font-metric-display text-2xl font-extrabold text-emerald-700">
                    &ge; 85.0%
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                    Standar IKU Kemendikbud
                  </span>
                </div>
              </div>

              {/* Chart Keberhasilan Studi per Angkatan */}
              <div className="bg-surface-container-low/40 border border-surface-container-high/60 rounded-xl p-5">
                <h4 className="font-headline-sm text-sm font-bold text-on-surface uppercase tracking-wider mb-1 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  Tingkat Keberhasilan Studi per Angkatan
                </h4>
                <p className="text-xs text-on-surface-variant mb-4">
                  Memantau rasio mahasiswa yang berhasil menyelesaikan seluruh kewajiban akademik tanpa melampaui batas Drop Out
                </p>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={successCohortData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="cohortLabel" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Bar dataKey="rate" name="Keberhasilan Studi (%)" fill={COLORS.emerald} radius={[4, 4, 0, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Tabel Detail Keberhasilan Studi per Angkatan */}
              <div className="bg-surface-container-low/30 border border-surface-container-high/60 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-surface-container-low border-b border-surface-container-high flex items-center justify-between">
                  <h5 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                    Tabel Evaluasi Keberhasilan Studi per Angkatan
                  </h5>
                  <span className="text-[11px] text-outline font-medium">PDDIKTI Verified</span>
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container-low/80 border-b border-surface-container-high text-outline text-[11px] font-semibold">
                    <tr>
                      <th className="py-2.5 px-4">Angkatan (Cohort)</th>
                      <th className="py-2.5 px-4 text-right">Lulus Dalam Batas Masa Studi</th>
                      <th className="py-2.5 px-4 text-right">Total Mahasiswa Lulus</th>
                      <th className="py-2.5 px-4 text-right">Tingkat Keberhasilan (%)</th>
                      <th className="py-2.5 px-4 text-right">Status Evaluasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high/60 bg-surface-container-lowest font-medium">
                    {successCohortData.map((row) => (
                      <tr key={row.cohort} className="hover:bg-surface-container-low/40 transition-colors">
                        <td className="py-2.5 px-4 text-on-surface font-semibold">{row.cohortLabel}</td>
                        <td className="py-2.5 px-4 text-right text-emerald-700 font-bold tabular-nums">
                          {row.successCount} mhs
                        </td>
                        <td className="py-2.5 px-4 text-right text-on-surface tabular-nums">
                          {row.total} mhs
                        </td>
                        <td className="py-2.5 px-4 text-right font-extrabold text-emerald-700 tabular-nums">
                          {row.rateFormatted}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Memenuhi Target
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GraduateDetailModal;
