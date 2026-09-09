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
  Legend,
  ComposedChart,
  Area,
  Line,
} from 'recharts';
import { mahasiswaData } from '@/data/KomatQAmit_DB_DataDump';
import {
  getActiveStudentsData,
  groupActiveStudentsByProdi,
  groupActiveStudentsByFaculty,
  groupActiveStudentsByJenjang,
  getForeignStudentTrend5Years,
  getIntakeTrend5Years,
  getIntakeFluctuation5Years,
} from '@/logicDump/studentMetrics';

/**
 * Palet warna modern berbasis Material 3 / Tailwind KOMET
 */
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
  cyan: '#0891b2',
  pieColors: ['#006192', '#0d9488', '#d97706', '#6b5778', '#e11d48', '#4f46e5'],
  jenjangColors: ['#006192', '#d97706'],
};

/**
 * Tooltip kustom untuk visualisasi bar chart dan pie chart (Active Students)
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  const name = label || item.name;
  const value = item.value;
  const percentage = item.payload?.percentage;

  return (
    <div className="rounded-lg border border-surface-container-high bg-white px-3 py-2 shadow-xl">
      <p className="text-xs font-semibold text-on-surface">{name}</p>
      <p className="text-xs text-on-surface-variant tabular-nums mt-0.5">
        Mahasiswa Aktif: <span className="font-bold text-primary">{value?.toLocaleString('en-US')}</span>
      </p>
      {percentage && (
        <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
          Proporsi: {percentage}
        </p>
      )}
    </div>
  );
};

/**
 * Tooltip kustom khusus untuk visualisasi tren 5 tahun Mahasiswa Asing
 */
const ForeignTrendTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  const dataPoint = payload[0]?.payload;
  if (!dataPoint) return null;

  return (
    <div className="rounded-lg border border-surface-container-high bg-white px-3.5 py-2.5 shadow-xl min-w-[210px]">
      <div className="flex items-center justify-between border-b border-surface-container-high pb-1.5 mb-1.5">
        <p className="text-xs font-bold text-on-surface">{dataPoint.cohortLabel || `Cohort ${label}`}</p>
        <span className="text-[11px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
          {dataPoint.percentageFormatted || `${dataPoint.percentage}%`}
        </span>
      </div>
      <div className="space-y-1 text-xs">
        <div className="flex items-center justify-between text-on-surface-variant">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            WNA Aktif:
          </span>
          <span className="font-bold text-on-surface tabular-nums">
            {dataPoint.foreignActive?.toLocaleString('en-US')} mhs
          </span>
        </div>
        <div className="flex items-center justify-between text-on-surface-variant">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            Total Mahasiswa Aktif:
          </span>
          <span className="font-bold text-on-surface tabular-nums">
            {dataPoint.totalActive?.toLocaleString('en-US')} mhs
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * Tooltip kustom khusus untuk visualisasi tren 5 tahun Intake Mahasiswa Baru
 */
const IntakeTrendTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  const dataPoint = payload[0]?.payload;
  if (!dataPoint) return null;

  const isNeg = dataPoint.growthNum !== null && dataPoint.growthNum < 0;
  const isPos = dataPoint.growthNum !== null && dataPoint.growthNum >= 0;

  return (
    <div className="rounded-lg border border-surface-container-high bg-white px-3.5 py-2.5 shadow-xl min-w-[210px]">
      <div className="flex items-center justify-between border-b border-surface-container-high pb-1.5 mb-1.5">
        <p className="text-xs font-bold text-on-surface">{dataPoint.cohortLabel || `Angkatan ${label}`}</p>
        <span
          className={`text-[11px] font-extrabold px-2 py-0.5 rounded border ${
            isNeg
              ? 'text-red-700 bg-red-50 border-red-200'
              : isPos
              ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
              : 'text-outline bg-slate-50 border-slate-200'
          }`}
        >
          {dataPoint.growth}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs text-on-surface-variant">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary"></span>
          Total Intake:
        </span>
        <span className="font-bold text-on-surface tabular-nums">
          {dataPoint.intake?.toLocaleString('en-US')} Mahasiswa
        </span>
      </div>
    </div>
  );
};

/**
 * Tooltip kustom khusus untuk visualisasi BarChart Fluktuasi Intake 5 Tahun
 */
const FluctuationTrendTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  const dataPoint = payload[0]?.payload;
  if (!dataPoint) return null;

  return (
    <div className="rounded-lg border border-surface-container-high bg-white px-3.5 py-2.5 shadow-xl min-w-[220px]">
      <div className="flex items-center justify-between border-b border-surface-container-high pb-1.5 mb-1.5">
        <p className="text-xs font-bold text-on-surface">Tahun {dataPoint.year}</p>
        <span
          className={`text-[11px] font-extrabold px-2 py-0.5 rounded border ${
            dataPoint.deltaPercentage !== null && dataPoint.deltaPercentage >= 0
              ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
              : dataPoint.deltaPercentage !== null
              ? 'text-rose-700 bg-rose-50 border-rose-200'
              : 'text-outline bg-slate-50 border-slate-200'
          }`}
        >
          {dataPoint.deltaFormatted}
        </span>
      </div>
      <div className="space-y-1 text-xs">
        <div className="flex items-center justify-between text-on-surface-variant">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            Total Intake:
          </span>
          <span className="font-bold text-on-surface tabular-nums">
            {dataPoint.absolutCount?.toLocaleString('en-US')} Mahasiswa
          </span>
        </div>
        <div className="flex items-center justify-between text-on-surface-variant">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span>
            Perubahan YoY:
          </span>
          <span className="font-bold text-[#D97706] tabular-nums">
            {dataPoint.deltaFormatted}
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * Komponen Detail Modal yang bersifat dinamis dan context-aware:
 * 1. Jika `metricType === 'active-students'`: Menampilkan visualisasi data Recharts
 *    (Distribusi per Prodi, Komparasi per Fakultas, dan Proporsi Jenjang S1 vs S2).
 * 2. Jika `metricType === 'foreign-students'`: Mengisolasi dan HANYA merender grafik tren 5 tahun
 *    rasio mahasiswa asing aktif terhadap total mahasiswa aktif.
 * 3. Jika `metricType === 'intake-students'`: Mengisolasi dan HANYA merender grafik tren 5 tahun
 *    intake mahasiswa baru semester 1 aktif.
 * 4. Jika `metricType === 'intake-fluctuation'`: Mengisolasi dan HANYA merender grafik fluktuasi
 *    intake mahasiswa baru 5 tahun terakhir.
 *
 * Mempertahankan animasi zoom macOS-style (maximize/minimize) dari posisi kartu asal.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Status visibilitas modal
 * @param {Function} props.onClose - Handler untuk menutup modal
 * @param {Object|null} [props.originRect] - Koordinat fisik {top, left, width, height} elemen pemicu
 * @param {string} [props.metricType='active-students'] - Jenis metrik terpilih ('active-students' | 'foreign-students' | 'intake-students' | 'intake-fluctuation')
 * @param {Array<Object>} [props.data=mahasiswaData] - Dataset sumber mahasiswa
 */
export const DetailModal = ({
  isOpen,
  onClose,
  originRect,
  metricType = 'active-students',
  data = mahasiswaData,
}) => {
  // State untuk mengontrol lifecycle animasi 2 tahap macOS-style
  const [isMounted, setIsMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Sinkronisasi kemunculan modal saat isOpen berubah
  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
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
  }, [isOpen]);

  // Penutupan dengan animasi minimize kembali ke posisi asal (originRect)
  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsMounted(false);
      if (onClose) onClose();
    }, 350);
  };

  // Kalkulasi data chart murni dari mahasiswa berstatus 'Aktif'
  const activeStudents = useMemo(() => getActiveStudentsData(data), [data]);
  const prodiData = useMemo(() => groupActiveStudentsByProdi(activeStudents), [activeStudents]);
  const facultyData = useMemo(() => groupActiveStudentsByFaculty(activeStudents), [activeStudents]);
  const jenjangData = useMemo(() => groupActiveStudentsByJenjang(activeStudents), [activeStudents]);

  // Kalkulasi tren 5 tahun mahasiswa asing aktif
  const foreignTrendData = useMemo(() => getForeignStudentTrend5Years(data), [data]);

  // Kalkulasi tren 5 tahun intake mahasiswa baru
  const intakeTrendData = useMemo(() => getIntakeTrend5Years(data), [data]);

  // Kalkulasi fluktuasi intake mahasiswa baru 5 tahun
  const fluctuationData = useMemo(() => getIntakeFluctuation5Years(data), [data]);

  // Data terurut terbaru ke terlama (Newest to Oldest) untuk tabel
  const sortedForeignTableData = useMemo(() => {
    return [...foreignTrendData].sort((a, b) => Number(b.year) - Number(a.year));
  }, [foreignTrendData]);

  const sortedIntakeTableData = useMemo(() => {
    return [...intakeTrendData].sort((a, b) => Number(b.year) - Number(a.year));
  }, [intakeTrendData]);

  const sortedFluctuationTableData = useMemo(() => {
    return [...fluctuationData.chartData].sort((a, b) => Number(b.year) - Number(a.year));
  }, [fluctuationData.chartData]);

  if (!isMounted && !isOpen) return null;

  // Hitung transformasi geometris macOS-style
  const hasOrigin = Boolean(originRect && originRect.width && originRect.height);
  let transformStyle = 'translate(-50%, -50%) scale(1)';
  let originOpacity = 1;

  if (hasOrigin && !isAnimating) {
    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = window.innerHeight / 2;
    const cardCenterX = originRect.left + originRect.width / 2;
    const cardCenterY = originRect.top + originRect.height / 2;
    const deltaX = cardCenterX - viewportCenterX;
    const deltaY = cardCenterY - viewportCenterY;

    const targetModalWidth = Math.min(window.innerWidth * 0.94, 960);
    const targetModalHeight = Math.min(window.innerHeight * 0.92, 740);
    const scaleX = Math.max(0.2, originRect.width / targetModalWidth);
    const scaleY = Math.max(0.2, originRect.height / targetModalHeight);
    const scale = Math.min(scaleX, scaleY);

    transformStyle = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px)) scale(${scale})`;
    originOpacity = 0;
  } else if (!hasOrigin && !isAnimating) {
    transformStyle = 'translate(-50%, -50%) scale(0.88)';
    originOpacity = 0;
  }

  // Header configuration berdasarkan context metricType
  const isForeignMetric = metricType === 'foreign-students';
  const isIntakeMetric = metricType === 'intake-students';
  const isFluctuationMetric = metricType === 'intake-fluctuation';

  let headerIcon = 'groups';
  let headerBadge = 'Student Body KPI';
  let headerTitle = 'Rincian Mahasiswa Aktif';
  let headerIconBg = 'bg-primary-fixed/50 text-primary';

  if (isForeignMetric) {
    headerIcon = 'public';
    headerBadge = 'International Cohort KPI';
    headerTitle = 'Persentase Mahasiswa Asing - Tren & Analisis';
    headerIconBg = 'bg-secondary-fixed/50 text-secondary';
  } else if (isIntakeMetric) {
    headerIcon = 'how_to_reg';
    headerBadge = 'Admissions & Intake KPI';
    headerTitle = 'Intake Mahasiswa Baru - Tren & Analisis';
    headerIconBg = 'bg-amber-100 text-tertiary';
  } else if (isFluctuationMetric) {
    headerIcon = fluctuationData.isPositive ? 'trending_up' : 'trending_down';
    headerBadge = 'Fluctuation & Growth KPI';
    headerTitle = 'Grafik Fluktuasi Intake Mahasiswa Baru (5 Tahun)';
    headerIconBg = fluctuationData.isPositive
      ? 'bg-emerald-100 text-emerald-700'
      : 'bg-rose-100 text-rose-700';
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-0 transition-opacity duration-300 ease-out ${
        isAnimating
          ? 'bg-black/50 backdrop-blur-sm opacity-100'
          : 'bg-black/0 backdrop-blur-none opacity-0 pointer-events-none'
      }`}
      id="student-detail-modal-backdrop"
      onClick={(e) => {
        if (e.target.id === 'student-detail-modal-backdrop') {
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
        className="fixed top-1/2 left-1/2 w-[min(94vw,60rem)] max-h-[92vh] z-50 bg-surface-container-lowest shadow-2xl rounded-2xl border border-outline-variant/40 overflow-hidden flex flex-col will-change-transform"
        id="student-detail-modal-box"
      >
        {/* Header Modal */}
        <div className="p-5 border-b border-surface-container-high flex items-start justify-between bg-surface-container-low/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${headerIconBg}`}>
              <span className="material-symbols-outlined text-[24px]">{headerIcon}</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                  {headerBadge}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                  Status: Aktif Only
                </span>
              </div>
              <h3 className="font-headline-lg text-lg font-bold text-on-surface mt-0.5 truncate">
                {headerTitle}
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

        {/* Isi Konten Modal Berdasarkan Kondisi MetricType */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-surface-container-lowest">
          {isForeignMetric ? (
            /* ========================================================================= */
            /* TAMPILAN KHUSUS: PERSENTASE MAHASISWA ASING (5-YEAR TREND CHART ONLY)     */
            /* ========================================================================= */
            <div className="space-y-6">
              {/* Ringkasan Banner Mahasiswa Asing */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-low p-4 rounded-xl border border-surface-container-high">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
                    Definisi & Ruang Lingkup
                  </span>
                  <p className="text-xs font-semibold text-on-surface mt-1">
                    Persentase mahasiswa berkewarganegaraan Asing (Non-WNI) terhadap total mahasiswa aktif pada tiap periode.
                  </p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    Formula: (Jumlah Mahasiswa Asing / Total Mahasiswa) × 100%
                  </p>
                </div>
                <div className="text-right sm:border-l sm:border-surface-container-high sm:pl-4">
                  <div className="text-[11px] text-outline font-semibold uppercase">
                    Persentase Angkatan Terkini
                  </div>
                  <div className="font-metric-display text-2xl font-extrabold text-secondary">
                    {foreignTrendData.length > 0
                      ? `${foreignTrendData[foreignTrendData.length - 1].percentageFormatted}`
                      : '0.0%'}
                  </div>
                  {foreignTrendData.length > 0 && foreignTrendData[foreignTrendData.length - 1].deltaFormatted !== '-' && (
                    <div className={`text-xs font-semibold mt-0.5 ${
                      foreignTrendData[foreignTrendData.length - 1].deltaPercentage >= 0
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                    }`}>
                      {foreignTrendData[foreignTrendData.length - 1].deltaFormatted}
                    </div>
                  )}
                </div>
              </div>

              {/* Chart Utama: Tren 5 Tahun Persentase Mahasiswa Asing */}
              <div className="bg-surface-container-low/40 border border-surface-container-high/60 rounded-xl p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h4 className="font-headline-sm text-sm font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                      Tren 5 Tahun: Persentase Mahasiswa Asing
                    </h4>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Perkembangan jumlah dan persentase mahasiswa internasional aktif antar angkatan 5 tahun terakhir
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-3 text-xs bg-white px-3 py-1.5 rounded-lg border border-surface-container-high shadow-xs">
                    <span className="flex items-center gap-1.5 font-medium text-on-surface">
                      <span className="w-3 h-3 rounded bg-amber-500/30 border border-amber-600"></span> Persentase Asing (%)
                    </span>
                    <span className="flex items-center gap-1.5 font-medium text-on-surface">
                      <span className="w-3 h-3 rounded bg-primary/20 border border-primary"></span> Total Mahasiswa
                    </span>
                  </div>
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={foreignTrendData}
                      margin={{ top: 16, right: 24, bottom: 8, left: -10 }}
                    >
                      <defs>
                        <linearGradient id="foreignRatioGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#d97706" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#d97706" stopOpacity={0.03} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="#E2E8F0" strokeDasharray="3 3" />
                      <XAxis
                        dataKey="cohortLabel"
                        tick={{ fontSize: 11, fill: '#6f7882' }}
                        axisLine={{ stroke: '#E2E8F0' }}
                        tickLine={false}
                      />
                      <YAxis
                        yAxisId="left"
                        tick={{ fontSize: 11, fill: '#6f7882' }}
                        axisLine={false}
                        tickLine={false}
                        unit="%"
                        allowDecimals={true}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 11, fill: '#6f7882' }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <RechartsTooltip content={<ForeignTrendTooltip />} />
                      <Bar
                        yAxisId="right"
                        dataKey="foreignActive"
                        name="WNA Aktif"
                        fill="#006192"
                        opacity={0.25}
                        radius={[4, 4, 0, 0]}
                        barSize={36}
                      />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="percentage"
                        name="Persentase Asing (%)"
                        stroke="#d97706"
                        strokeWidth={3}
                        fill="url(#foreignRatioGradient)"
                        dot={{ r: 4.5, fill: '#d97706', strokeWidth: 0 }}
                        activeDot={{ r: 6.5, fill: '#d97706', stroke: '#fef3c7', strokeWidth: 2 }}
                        isAnimationActive
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Rincian Tabel Angkatan (Newest to Oldest) */}
              <div className="bg-surface-container-low/30 border border-surface-container-high/60 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-surface-container-low border-b border-surface-container-high flex items-center justify-between">
                  <h5 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                    Tabel Rekapitulasi Mahasiswa Asing (5 Tahun Terakhir)
                  </h5>
                  <span className="text-[11px] text-outline font-medium">PDDikti Verified</span>
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container-low/80 border-b border-surface-container-high text-outline text-[11px] font-semibold">
                    <tr>
                      <th className="py-2.5 px-4">Angkatan / Periode</th>
                      <th className="py-2.5 px-4 text-right">Jumlah Mahasiswa Asing</th>
                      <th className="py-2.5 px-4 text-right">Total Seluruh Mahasiswa</th>
                      <th className="py-2.5 px-4 text-right">Persentase (%)</th>
                      <th className="py-2.5 px-4 text-right">Pertumbuhan dari Periode Lalu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high/60 bg-surface-container-lowest font-medium">
                    {sortedForeignTableData.map((row, idx) => {
                      const isLatest = idx === 0;
                      return (
                        <tr
                          key={row.year}
                          className={`${
                            isLatest ? 'bg-primary-fixed/20 font-bold' : 'hover:bg-surface-container-low/40'
                          } transition-colors`}
                        >
                          <td className="py-2.5 px-4 text-on-surface flex items-center gap-2">
                            <span>{row.cohortLabel}</span>
                            {isLatest && (
                              <span className="text-[10px] px-2 py-0.2 bg-primary text-white rounded font-bold">
                                Terkini
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-right text-on-surface tabular-nums">
                            {row.foreignActive.toLocaleString('en-US')} Mhs
                          </td>
                          <td className="py-2.5 px-4 text-right text-on-surface tabular-nums">
                            {row.totalActive.toLocaleString('en-US')} Mhs
                          </td>
                          <td className="py-2.5 px-4 text-right text-amber-700 font-bold tabular-nums">
                            {row.percentageFormatted}
                          </td>
                          <td className={`py-2.5 px-4 text-right font-semibold tabular-nums ${
                            row.deltaPercentage === null
                              ? 'text-outline'
                              : row.deltaPercentage >= 0
                              ? 'text-emerald-600'
                              : 'text-rose-600'
                          }`}>
                            {row.deltaFormatted}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : isIntakeMetric ? (
            /* ========================================================================= */
            /* TAMPILAN KHUSUS: INTAKE MAHASISWA BARU (5-YEAR INTAKE TREND CHART ONLY)  */
            /* ========================================================================= */
            <div className="space-y-6">
              {/* Ringkasan Banner Intake Mahasiswa Baru */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-low p-4 rounded-xl border border-surface-container-high">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
                    Definisi & Ruang Lingkup Intake (5 Tahun)
                  </span>
                  <p className="text-xs font-semibold text-on-surface mt-1">
                    Jumlah total mahasiswa baru semester 1 yang berstatus aktif pada 5 tahun terakhir.
                  </p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    Data memetakan angkatan/cohort mahasiswa baru aktif dan perbandingan laju intake tahunan.
                  </p>
                </div>
                <div className="text-right sm:border-l sm:border-surface-container-high sm:pl-4">
                  <div className="text-[11px] text-outline font-semibold uppercase">
                    Intake Angkatan Terkini
                  </div>
                  <div className="font-metric-display text-2xl font-extrabold text-primary">
                    {intakeTrendData.length > 0
                      ? `${intakeTrendData[intakeTrendData.length - 1].intake.toLocaleString('en-US')} Mahasiswa`
                      : '0 Mahasiswa'}
                  </div>
                  {intakeTrendData.length > 0 && (
                    <div
                      className={`text-xs font-semibold mt-0.5 ${
                        intakeTrendData[intakeTrendData.length - 1].growthNum !== null &&
                        intakeTrendData[intakeTrendData.length - 1].growthNum < 0
                          ? 'text-red-600'
                          : intakeTrendData[intakeTrendData.length - 1].growthNum !== null &&
                            intakeTrendData[intakeTrendData.length - 1].growthNum >= 0
                          ? 'text-emerald-600'
                          : 'text-outline'
                      }`}
                    >
                      {intakeTrendData[intakeTrendData.length - 1].growth}
                    </div>
                  )}
                </div>
              </div>

              {/* Chart Utama: Tren 5 Tahun Intake Mahasiswa Baru */}
              <div className="bg-surface-container-low/40 border border-surface-container-high/60 rounded-xl p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h4 className="font-headline-sm text-sm font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                      Tren 5 Tahun: Intake Mahasiswa Baru
                    </h4>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Jumlah mahasiswa baru terdaftar aktif per angkatan dalam rentang 5 tahun terakhir
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 text-xs bg-white px-3 py-1.5 rounded-lg border border-surface-container-high shadow-xs">
                    <span className="w-3 h-3 rounded bg-primary"></span>
                    <span className="font-medium text-on-surface">Intake Mahasiswa Baru</span>
                  </div>
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={intakeTrendData}
                      margin={{ top: 16, right: 24, bottom: 8, left: -10 }}
                    >
                      <CartesianGrid vertical={false} stroke="#E2E8F0" strokeDasharray="3 3" />
                      <XAxis
                        dataKey="cohortLabel"
                        tick={{ fontSize: 11, fill: '#6f7882' }}
                        axisLine={{ stroke: '#E2E8F0' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#6f7882' }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <RechartsTooltip content={<IntakeTrendTooltip />} />
                      <Bar
                        dataKey="intake"
                        name="Intake Mahasiswa"
                        fill="#006192"
                        radius={[6, 6, 0, 0]}
                        barSize={44}
                        isAnimationActive
                      >
                        {intakeTrendData.map((entry, index) => (
                          <Cell
                            key={`intake-cell-${index}`}
                            fill={index === intakeTrendData.length - 1 ? '#006192' : '#3884b2'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Rincian Tabel Angkatan (Newest to Oldest) */}
              <div className="bg-surface-container-low/30 border border-surface-container-high/60 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-surface-container-low border-b border-surface-container-high flex items-center justify-between">
                  <h5 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                    Tabel Rekapitulasi Intake Mahasiswa Baru (5 Tahun Terakhir)
                  </h5>
                  <span className="text-[11px] text-outline font-medium">PDDikti & Sevima Verified</span>
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container-low/80 border-b border-surface-container-high text-outline text-[11px] font-semibold">
                    <tr>
                      <th className="py-2.5 px-4">Angkatan / Cohort</th>
                      <th className="py-2.5 px-4 text-right">Intake (Mahasiswa Baru)</th>
                      <th className="py-2.5 px-4 text-right">Pertumbuhan dari periode lalu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high/60 bg-surface-container-lowest font-medium">
                    {sortedIntakeTableData.map((row, idx) => {
                      const isLatest = idx === 0;
                      const isNeg = row.growthNum !== null && row.growthNum < 0;
                      const isPos = row.growthNum !== null && row.growthNum >= 0;

                      return (
                        <tr
                          key={row.year}
                          className={`${
                            isLatest ? 'bg-primary-fixed/20 font-bold' : 'hover:bg-surface-container-low/40'
                          } transition-colors`}
                        >
                          <td className="py-2.5 px-4 text-on-surface flex items-center gap-2">
                            <span>{row.cohortLabel}</span>
                            {isLatest && (
                              <span className="text-[10px] px-2 py-0.2 bg-primary text-white rounded font-bold">
                                Cohort Terkini
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-right text-on-surface font-bold tabular-nums">
                            {row.intake.toLocaleString('en-US')} Mahasiswa
                          </td>
                          <td
                            className={`py-2.5 px-4 text-right font-semibold tabular-nums ${
                              isNeg ? 'text-red-600' : isPos ? 'text-emerald-600' : 'text-outline'
                            }`}
                          >
                            {row.growth}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : isFluctuationMetric ? (
            /* ========================================================================= */
            /* TAMPILAN KHUSUS: FLUKTUASI INTAKE MAHASISWA BARU (5-YEAR BARCHART CLEAN)  */
            /* ========================================================================= */
            <div className="space-y-6">
              {/* Ringkasan Banner Fluktuasi */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-low p-4 rounded-xl border border-surface-container-high">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
                    Definisi & Ringkasan Perubahan (5 Tahun)
                  </span>
                  <p className="text-xs font-semibold text-on-surface mt-1">
                    Rata-rata tingkat perubahan jumlah mahasiswa baru (intake) yang dihitung dari perbandingan 5 tahun terakhir.
                  </p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    Menampilkan pertumbuhan tahunan dan rata-rata kumulatif penerimaan mahasiswa baru.
                  </p>
                </div>
                <div className="text-right sm:border-l sm:border-surface-container-high sm:pl-4">
                  <div className="text-[11px] text-outline font-semibold uppercase">
                    Rata-Rata Perubahan
                  </div>
                  <div
                    className={`font-metric-display text-2xl font-extrabold ${
                      fluctuationData.isPositive ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {fluctuationData.finalAverage}
                  </div>
                  <div
                    className={`text-xs font-semibold mt-0.5 ${
                      fluctuationData.isPositive ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    Status: {fluctuationData.trendBadge}
                  </div>
                </div>
              </div>

              {/* Chart Utama: BarChart Sederhana & Bersih Fluktuasi Intake */}
              <div className="bg-surface-container-low/40 border border-surface-container-high/60 rounded-xl p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h4 className="font-headline-sm text-sm font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#006192]"></span>
                      Grafik Intake Mahasiswa Baru (5 Tahun Terakhir)
                    </h4>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Jumlah penerimaan mahasiswa baru per tahun dengan indikasi persentase perubahan tahunan
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 text-xs bg-white px-3 py-1.5 rounded-lg border border-surface-container-high shadow-xs">
                    <span className="w-3 h-3 rounded bg-[#006192]"></span>
                    <span className="font-medium text-on-surface">Intake Mahasiswa (Jumlah)</span>
                  </div>
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={fluctuationData.chartData}
                      margin={{ top: 16, right: 24, bottom: 8, left: -10 }}
                    >
                      <CartesianGrid vertical={false} stroke="#E2E8F0" strokeDasharray="3 3" />
                      <XAxis
                        dataKey="year"
                        tick={{ fontSize: 11, fill: '#6f7882' }}
                        axisLine={{ stroke: '#E2E8F0' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#6f7882' }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <RechartsTooltip content={<FluctuationTrendTooltip />} />
                      <Bar
                        dataKey="absolutCount"
                        name="Intake Mahasiswa"
                        fill="#006192"
                        radius={[6, 6, 0, 0]}
                        barSize={44}
                        isAnimationActive
                      >
                        {fluctuationData.chartData.map((entry, index) => (
                          <Cell
                            key={`fluc-cell-${index}`}
                            fill={index === fluctuationData.chartData.length - 1 ? '#006192' : '#3884b2'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Rincian Tabel Perubahan 5 Tahun (Newest to Oldest) */}
              <div className="bg-surface-container-low/30 border border-surface-container-high/60 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-surface-container-low border-b border-surface-container-high flex items-center justify-between">
                  <h5 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                    Tabel Rekapitulasi Perubahan Intake (5 Tahun Terakhir)
                  </h5>
                  <span className="text-[11px] text-outline font-medium">PDDikti & Sevima Verified</span>
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container-low/80 border-b border-surface-container-high text-outline text-[11px] font-semibold">
                    <tr>
                      <th className="py-2.5 px-4">Tahun</th>
                      <th className="py-2.5 px-4 text-right">Jumlah Intake</th>
                      <th className="py-2.5 px-4 text-right">Persentase Perubahan (YoY)</th>
                      <th className="py-2.5 px-4 text-right">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high/60 bg-surface-container-lowest font-medium">
                    {sortedFluctuationTableData.map((row, idx) => {
                      const isLatest = idx === 0;
                      const isPos = row.deltaPercentage !== null && row.deltaPercentage >= 0;
                      return (
                        <tr
                          key={row.year}
                          className={`${
                            isLatest ? 'bg-primary-fixed/20 font-bold' : 'hover:bg-surface-container-low/40'
                          } transition-colors`}
                        >
                          <td className="py-2.5 px-4 text-on-surface flex items-center gap-2">
                            <span>Tahun {row.year}</span>
                            {isLatest && (
                              <span className="text-[10px] px-2 py-0.2 bg-primary text-white rounded font-bold">
                                Terkini
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-right text-on-surface font-bold tabular-nums">
                            {row.absolutCount.toLocaleString('en-US')} Mahasiswa
                          </td>
                          <td
                            className={`py-2.5 px-4 text-right font-bold tabular-nums ${
                              row.deltaPercentage === null
                                ? 'text-outline'
                                : isPos
                                ? 'text-emerald-600'
                                : 'text-rose-600'
                            }`}
                          >
                            {row.deltaFormatted}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            {row.deltaPercentage === null ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-bold border border-slate-200">
                                -
                              </span>
                            ) : isPos ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                                Tumbuh
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-50 text-rose-700 font-bold border border-rose-200">
                                Menyusut
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* TAMPILAN STANDAR: TOTAL MAHASISWA AKTIF (3 VISUALISASI BERSIH)            */
            /* ========================================================================= */
            <div className="space-y-6">
              {/* Ringkasan Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-low p-4 rounded-xl border border-surface-container-high">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
                    Populasi Mahasiswa Aktif
                  </span>
                  <p className="text-xs font-semibold text-on-surface mt-1">
                    Distribusi seluruh mahasiswa dengan status keaktifan "Aktif" di lingkungan akademik
                  </p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    Data disinkronkan secara ketat memfilter hanya record mahasiswa berstatus aktif.
                  </p>
                </div>
                <div className="text-right sm:border-l sm:border-surface-container-high sm:pl-4">
                  <div className="text-[11px] text-outline font-semibold uppercase">
                    Total Mahasiswa Aktif
                  </div>
                  <div className="font-metric-display text-2xl font-extrabold text-primary">
                    {activeStudents.length.toLocaleString('en-US')}
                  </div>
                  <div className="text-xs font-semibold text-emerald-600 mt-0.5">100% Terverifikasi</div>
                </div>
              </div>

              {/* Visualisasi 1: Bar Chart Mahasiswa Aktif per Program Studi */}
              <div className="bg-surface-container-low/40 border border-surface-container-high/60 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary"></span>
                      Distribusi per Program Studi
                    </h4>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      Jumlah mahasiswa aktif pada masing-masing Program Studi
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-primary bg-primary-fixed/40 px-2 py-0.5 rounded">
                    {prodiData.length} Program Studi
                  </span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={prodiData}
                      layout="vertical"
                      margin={{ top: 8, right: 24, bottom: 8, left: 130 }}
                    >
                      <CartesianGrid horizontal={false} stroke="#E2E8F0" strokeDasharray="3 3" />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 10, fill: '#6f7882' }}
                        axisLine={{ stroke: '#E2E8F0' }}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 10, fill: '#334155' }}
                        axisLine={false}
                        tickLine={false}
                        width={130}
                      />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="count"
                        fill={COLORS.primary}
                        radius={[0, 4, 4, 0]}
                        isAnimationActive
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Baris 2 Kolom untuk Visualisasi Fakultas dan Jenjang */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Visualisasi 2: Bar Chart Mahasiswa Aktif per Fakultas */}
                <div className="bg-surface-container-low/40 border border-surface-container-high/60 rounded-xl p-4 flex flex-col justify-between">
                  <div className="mb-3">
                    <h4 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                      Distribusi per Fakultas
                    </h4>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      Komparasi jumlah mahasiswa aktif antar Fakultas
                    </p>
                  </div>
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={facultyData}
                        margin={{ top: 12, right: 12, bottom: 20, left: -10 }}
                      >
                        <CartesianGrid vertical={false} stroke="#E2E8F0" strokeDasharray="3 3" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 9, fill: '#6f7882' }}
                          axisLine={{ stroke: '#E2E8F0' }}
                          tickLine={false}
                          interval={0}
                          angle={-10}
                          textAnchor="end"
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: '#6f7882' }}
                          axisLine={false}
                          tickLine={false}
                          allowDecimals={false}
                        />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]} isAnimationActive>
                          {facultyData.map((entry, index) => (
                            <Cell
                              key={`faculty-cell-${index}`}
                              fill={COLORS.pieColors[index % COLORS.pieColors.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Visualisasi 3: Donut/Pie Chart Jenjang Sarjana vs Magister */}
                <div className="bg-surface-container-low/40 border border-surface-container-high/60 rounded-xl p-4 flex flex-col justify-between">
                  <div className="mb-3">
                    <h4 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                      Distribusi Jenjang Pendidikan
                    </h4>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      Proporsi jenjang pendidikan Sarjana (S1) vs Magister (S2)
                    </p>
                  </div>
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={jenjangData}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={4}
                          isAnimationActive
                        >
                          {jenjangData.map((entry, index) => (
                            <Cell
                              key={`jenjang-cell-${index}`}
                              fill={COLORS.jenjangColors[index % COLORS.jenjangColors.length]}
                            />
                          ))}
                        </Pie>
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          formatter={(value, entry) => (
                            <span className="text-xs font-medium text-on-surface">
                              {value}: <span className="font-bold">{entry.payload?.count}</span> ({entry.payload?.percentage})
                            </span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div className="p-4 border-t border-surface-container-high bg-surface-container-low/40 flex items-center justify-between text-xs shrink-0">
          <span className="text-[11px] text-outline">Sumber data: PDDIKTI & Sevima Feeder (Filter: Aktif)</span>
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

export default DetailModal;
