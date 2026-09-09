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
  ComposedChart,
  Area,
  Line,
} from 'recharts';
import {
  groupMbkmByActivityType,
  groupMbkmByProdi,
  groupMbkmByFaculty,
  groupMbkmByMitra,
  groupMbkmByStatus,
  calculateMbkmVsEligibleRate,
  calculateTotalMbkmParticipants,
} from '@/logicDump/mbkmMetrics';

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
        Jumlah: <span className="font-bold text-primary">{value}</span> peserta
      </p>
      {item.payload?.percentage && (
        <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
          Proporsi: {item.payload.percentage}
        </p>
      )}
    </div>
  );
};

export const MbkmDetailModal = ({ metricType, originRect, onClose, data }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeTab, setActiveTab] = useState('activity');

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

  const activityData = useMemo(() => groupMbkmByActivityType(data), [data]);
  const prodiData = useMemo(() => groupMbkmByProdi(data), [data]);
  const facultyData = useMemo(() => groupMbkmByFaculty(data), [data]);
  const mitraData = useMemo(() => groupMbkmByMitra(data), [data]);
  const statusData = useMemo(() => groupMbkmByStatus(data), [data]);
  const participantStats = useMemo(() => calculateTotalMbkmParticipants(data), [data]);
  const eligibleRate = useMemo(() => calculateMbkmVsEligibleRate(data), [data]);

  const originTop = originRect ? originRect.top + originRect.height / 2 : window.innerHeight / 2;
  const originLeft = originRect ? originRect.left + originRect.width / 2 : window.innerWidth / 2;
  const deltaX = originLeft - window.innerWidth / 2;
  const deltaY = originTop - window.innerHeight / 2;

  const transformStyle = isAnimating
    ? 'translate(-50%, -50%) scale(1)'
    : `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px)) scale(0.2)`;

  // Konfigurasi modal spesifik per card
  const modalConfig = useMemo(() => {
    switch (metricType) {
      case 'rate-mbkm':
        return {
          title: 'Analisis Partisipasi MBKM vs Mahasiswa Eligible',
          badge: 'MBKM KPI Performance',
          icon: 'percent',
          iconBg: 'bg-primary-fixed/60 text-primary',
        };
      case 'active-mbkm':
        return {
          title: 'Total Aktivitas MBKM Aktif (Selesai & Evaluasi)',
          badge: 'MBKM Conversion Registry',
          icon: 'handshake',
          iconBg: 'bg-teal-50 text-teal-700',
        };
      case 'eligible-students':
        return {
          title: 'Mahasiswa Eligible Program MBKM (Semester 7)',
          badge: 'Eligible Senior Cohort',
          icon: 'how_to_reg',
          iconBg: 'bg-amber-100 text-amber-900',
        };
      case 'mitra-mbkm':
        return {
          title: 'Jaringan Mitra Industri & Riset Kolaborasi MBKM',
          badge: 'Industry & Research Partnerships',
          icon: 'domain',
          iconBg: 'bg-purple-100 text-purple-700',
        };
      default:
        return {
          title: 'Rincian Data MBKM Kampus Merdeka',
          badge: 'MBKM Analytics',
          icon: 'handshake',
          iconBg: 'bg-primary-fixed/60 text-primary',
        };
    }
  }, [metricType]);

  return (
    <div
      id="mbkm-detail-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
      style={{ opacity: isAnimating ? 1 : 0 }}
      onClick={(e) => {
        if (e.target.id === 'mbkm-detail-modal-backdrop') handleClose();
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
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                  Kampus Merdeka (NeoAcis)
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

        {/* Konten Modal yang Berbeda per Card */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-surface-container-lowest">
          {/* ========================================================================= */}
          {/* 1. KONTEN KHUSUS CARD 1: % MBKM VS MAHASISWA ELIGIBLE                     */}
          {/* ========================================================================= */}
          {metricType === 'rate-mbkm' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-low p-4 rounded-xl border border-surface-container-high">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
                    Formula & Definisi KPI MBKM
                  </span>
                  <p className="text-xs font-semibold text-on-surface mt-1">
                    %MBKM = (Jumlah Peserta MBKM Selesai/Evaluasi / Mahasiswa Aktif Semester 7) × 100%
                  </p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    Target IKU-2 Kemendikbudristek: Minimal 20% mahasiswa sarjana menghabiskan minimal 20 SKS di luar kampus.
                  </p>
                </div>
                <div className="text-right sm:border-l sm:border-surface-container-high sm:pl-4">
                  <div className="text-[11px] text-outline font-semibold uppercase">Capaian Rasio</div>
                  <div className="font-metric-display text-2xl font-extrabold text-primary">
                    {eligibleRate.percentage}
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                    Target IKU Terpenuhi
                  </span>
                </div>
              </div>

              {/* Chart Partisipasi per Fakultas */}
              <div className="bg-surface-container-low/40 border border-surface-container-high/60 rounded-xl p-5">
                <h4 className="font-headline-sm text-sm font-bold text-on-surface uppercase tracking-wider mb-3">
                  Distribusi Kegiatan MBKM per Fakultas
                </h4>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={facultyData} margin={{ top: 5, right: 30, left: 160, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={150} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" fill={COLORS.primary} radius={[0, 4, 4, 0]} barSize={22} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. KONTEN KHUSUS CARD 2: TOTAL MBKM AKTIF & DISTRIBUSI AKTIVITAS         */}
          {/* ========================================================================= */}
          {metricType === 'active-mbkm' && (
            <div className="space-y-6">
              {/* Tab Selector: Aktivitas vs Program Studi */}
              <div className="flex gap-4 border-b border-surface-container-high">
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`pb-2 text-xs font-semibold uppercase tracking-wider transition-colors relative cursor-pointer ${
                    activeTab === 'activity' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                  type="button"
                >
                  Distribusi Jenis Aktivitas MBKM
                  {activeTab === 'activity' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
                </button>
                <button
                  onClick={() => setActiveTab('prodi')}
                  className={`pb-2 text-xs font-semibold uppercase tracking-wider transition-colors relative cursor-pointer ${
                    activeTab === 'prodi' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                  type="button"
                >
                  Sebaran per Program Studi
                  {activeTab === 'prodi' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
                </button>
                <button
                  onClick={() => setActiveTab('status')}
                  className={`pb-2 text-xs font-semibold uppercase tracking-wider transition-colors relative cursor-pointer ${
                    activeTab === 'status' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                  type="button"
                >
                  Status Verifikasi & Evaluasi
                  {activeTab === 'status' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
                </button>
              </div>

              {activeTab === 'activity' && (
                <div className="bg-surface-container-low/40 border border-surface-container-high/60 rounded-xl p-5">
                  <h4 className="font-headline-sm text-sm font-bold text-on-surface uppercase tracking-wider mb-3">
                    Sebaran Peserta Berdasarkan 8 Bentuk Kegiatan Pembelajaran (BKP) MBKM
                  </h4>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={activityData} margin={{ top: 5, right: 30, left: 180, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={175} />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" fill={COLORS.teal} radius={[0, 4, 4, 0]} barSize={16} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {activeTab === 'prodi' && (
                <div className="bg-surface-container-low/40 border border-surface-container-high/60 rounded-xl p-5">
                  <h4 className="font-headline-sm text-sm font-bold text-on-surface uppercase tracking-wider mb-3">
                    Partisipasi MBKM per Program Studi
                  </h4>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={prodiData} margin={{ top: 5, right: 30, left: 160, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={150} />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" fill={COLORS.primary} radius={[0, 4, 4, 0]} barSize={16} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {activeTab === 'status' && (
                <div className="bg-surface-container-low/40 border border-surface-container-high/60 rounded-xl p-5">
                  <h4 className="font-headline-sm text-sm font-bold text-on-surface uppercase tracking-wider mb-3">
                    Distribusi Status Aktivitas MBKM
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div className="h-56 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusData}
                            dataKey="count"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={75}
                            innerRadius={40}
                            paddingAngle={4}
                          >
                            {statusData.map((entry, idx) => (
                              <Cell key={`cell-${idx}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2">
                      {statusData.map((s, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white border border-surface-container-high text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                            <span className="font-medium text-on-surface">{s.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-on-surface">{s.count} mahasiswa</span>
                            <span className="text-outline">{s.percentage}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. KONTEN KHUSUS CARD 3: MAHASISWA ELIGIBLE (SEMESTER 7)                  */}
          {/* ========================================================================= */}
          {metricType === 'eligible-students' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-low p-4 rounded-xl border border-surface-container-high">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
                    Kriteria Mahasiswa Eligible (Semester 7)
                  </span>
                  <p className="text-xs font-semibold text-on-surface mt-1">
                    Mahasiswa aktif jenjang Sarjana yang telah menyelesaikan minimal 80-100 SKS prasyarat.
                  </p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    Memenuhi syarat mengambil program Merdeka Belajar Kampus Merdeka 1 s/d 2 semester di luar program studi.
                  </p>
                </div>
                <div className="text-right sm:border-l sm:border-surface-container-high sm:pl-4">
                  <div className="text-[11px] text-outline font-semibold uppercase">Total Eligible</div>
                  <div className="font-metric-display text-2xl font-extrabold text-amber-700">
                    {eligibleRate.eligibleCount} Mhs
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold border border-amber-200">
                    Cohort 2022
                  </span>
                </div>
              </div>

              {/* Sebaran Prodi Mahasiswa Eligible */}
              <div className="bg-surface-container-low/40 border border-surface-container-high/60 rounded-xl p-5">
                <h4 className="font-headline-sm text-sm font-bold text-on-surface uppercase tracking-wider mb-3">
                  Sebaran Mahasiswa Eligible per Program Studi
                </h4>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={prodiData} margin={{ top: 5, right: 30, left: 160, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={150} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" fill={COLORS.amber} radius={[0, 4, 4, 0]} barSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. KONTEN KHUSUS CARD 4: JARINGAN MITRA KOLABORASI MBKM                  */}
          {/* ========================================================================= */}
          {metricType === 'mitra-mbkm' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-low p-4 rounded-xl border border-surface-container-high">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
                    Mitra Industri, Riset Hayati, & Universitas Global
                  </span>
                  <p className="text-xs font-semibold text-on-surface mt-1">
                    Kerja sama resmi penyediaan tempat magang industri farmasi/bioteknologi, lab riset hayati, dan pertukaran pelajar.
                  </p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    Memastikan konversi penuh hingga 20 SKS rekognisi kurikulum i3L.
                  </p>
                </div>
                <div className="text-right sm:border-l sm:border-surface-container-high sm:pl-4">
                  <div className="text-[11px] text-outline font-semibold uppercase">Mitra Aktif</div>
                  <div className="font-metric-display text-2xl font-extrabold text-purple-700">
                    {mitraData.length} Instansi
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-50 text-purple-800 font-bold border border-purple-200">
                    Terverifikasi
                  </span>
                </div>
              </div>

              {/* Bar Chart Top Mitra */}
              <div className="bg-surface-container-low/40 border border-surface-container-high/60 rounded-xl p-5">
                <h4 className="font-headline-sm text-sm font-bold text-on-surface uppercase tracking-wider mb-3">
                  Distribusi Penempatan Peserta MBKM per Mitra
                </h4>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={mitraData.slice(0, 10)} margin={{ top: 5, right: 30, left: 190, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={185} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" fill={COLORS.indigo} radius={[0, 4, 4, 0]} barSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MbkmDetailModal;
