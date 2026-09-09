import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardMetrics } from '@/logicDump/dashboardMetrics';
import { InteractiveMetricModal } from '@/components/dashboard/InteractiveMetricModal/InteractiveMetricModal';

/**
 * Halaman Utama Dasbor Eksekutif KOMET (PRD Bagian 6 & code.html + screen.png).
 * 
 * Mengintegrasikan seluruh komponen UI visual:
 * 1. Header Dasbor Eksekutif & Ekspor Report.
 * 2. 4 Top Executive KPI Cards (Total Active Students, Total Graduates, Total MBKM, Reporting Period).
 * 3. Student Overview Cards (Persentase Mahasiswa Asing, Student Intake, Persentase Penurunan Maba).
 * 4. Graduate Overview Cards (Average IPK per Prodi, S1, S2, % Lulus Tepat Waktu, % Keberhasilan Studi).
 * 5. MBKM Overview Cards (% MBKM vs Eligible, Total MBKM Aktif, Mahasiswa Eligible).
 * 6. Interactive Modal dengan visualisasi tren 5 tahun (Line/Area/Bar) dan tabel audit rincian.
 */
export const DashboardPage = () => {
  const [activeModalMetric, setActiveModalMetric] = useState(null);
  const [modalOriginRect, setModalOriginRect] = useState(null);

  // Menghitung metrik agregat yang diisolasi di folder logicDump/
  const metrics = useMemo(() => getDashboardMetrics(), []);

  /**
   * Helper untuk membuka modal dengan koordinat fisik kartu
   */
  const handleOpenModal = (metricKey, originRect) => {
    setModalOriginRect(originRect);
    setActiveModalMetric(metricKey);
  };

  return (
    <div className="flex flex-col w-full gap-6 max-w-7xl mx-auto">
      {/* Header Halaman */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-surface-container-high">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight">
              Dashboard
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-primary-fixed/50 text-primary font-bold text-[11px]">
              Live Sevima Sync
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-3xl">
            Sistem pemantauan longitudinal KPI institusi, analitik kohor, dan evaluasi capaian IKU
            Kemendikbudristek berbasis data Sevima Feeder terverifikasi.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-primary hover:bg-primary-container text-on-primary rounded-lg font-label-md text-label-md shadow-sm transition-colors cursor-pointer"
            onClick={() => alert('Mengekspor ringkasan eksekutif KPI & audit longitudinal ke PDF/Excel...')}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">file_download</span>
            <span>Export Summary Report</span>
          </button>
        </div>
      </div>

      {/* 1. TOP SUMMARY CARDS (4 Kolom) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Active Students */}
        <div
          className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm hover:border-primary hover:shadow-md transition-all cursor-pointer relative group"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            handleOpenModal('active_students', {
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
            });
          }}
        >
          <div className="flex items-center justify-between">
            <span className="font-caption text-caption text-on-surface-variant font-medium">
              Total Active Students
            </span>
            <div className="w-8 h-8 rounded-lg bg-primary-fixed/50 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[18px]">groups</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="font-metric-display text-metric-display text-on-surface font-extrabold leading-none">
              {metrics.topSummary.activeStudents}
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="inline-flex items-center text-xs font-semibold text-emerald-600">
                <span className="material-symbols-outlined text-[14px]">arrow_upward</span>{' '}
                {metrics.topSummary.activeStudentsGrowth}
              </span>
              <span className="text-[11px] font-medium text-primary flex items-center gap-0.5 group-hover:underline">
                Lihat Tren <span className="material-symbols-outlined text-[12px]">open_in_new</span>
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Graduates */}
        <div
          className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm hover:border-primary hover:shadow-md transition-all cursor-pointer relative group"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            handleOpenModal('total_graduates', {
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
            });
          }}
        >
          <div className="flex items-center justify-between">
            <span className="font-caption text-caption text-on-surface-variant font-medium">
              Total Graduates (PDDIKTI)
            </span>
            <div className="w-8 h-8 rounded-lg bg-secondary-fixed/50 flex items-center justify-center text-secondary group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[18px]">school</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="font-metric-display text-metric-display text-on-surface font-extrabold leading-none">
              {metrics.topSummary.totalGraduates}
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="inline-flex items-center text-xs font-semibold text-emerald-600">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>{' '}
                {metrics.topSummary.totalGraduatesGrowth}
              </span>
              <span className="text-[11px] font-medium text-outline group-hover:text-primary flex items-center gap-0.5 group-hover:underline">
                Lihat Tren <span className="material-symbols-outlined text-[12px]">open_in_new</span>
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Total MBKM Aktif */}
        <div
          className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm hover:border-primary hover:shadow-md transition-all cursor-pointer relative group"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            handleOpenModal('total_mbkm', {
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
            });
          }}
        >
          <div className="flex items-center justify-between">
            <span className="font-caption text-caption text-on-surface-variant font-medium">
              Total MBKM Aktif
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-tertiary group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[18px]">handshake</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="font-metric-display text-metric-display text-on-surface font-extrabold leading-none">
              {metrics.topSummary.totalMbkm}
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="inline-flex items-center text-xs font-semibold text-emerald-600">
                <span className="material-symbols-outlined text-[14px]">arrow_upward</span>{' '}
                {metrics.topSummary.totalMbkmGrowth}
              </span>
              <span className="text-[11px] font-medium text-outline group-hover:text-primary flex items-center gap-0.5 group-hover:underline">
                Lihat Tren <span className="material-symbols-outlined text-[12px]">open_in_new</span>
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Reporting Period */}
        <div className="bg-gradient-to-br from-primary to-primary-container p-4 rounded-xl text-on-primary shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-caption text-caption text-on-primary-container/80 font-medium">
              Reporting Period
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-semibold uppercase tracking-wider text-white">
              Active Period
            </span>
          </div>
          <div className="mt-3">
            <div className="font-headline-lg text-headline-lg font-bold text-white leading-tight">
              {metrics.topSummary.reportingPeriod}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="inline-flex items-center gap-1 text-xs text-primary-fixed">
                <span className="material-symbols-outlined text-[14px]">verified</span> Data Sevima Locked
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. STUDENT OVERVIEW SECTION */}
      <div className="flex flex-col gap-3 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎓</span>
            <h2 className="font-headline-lg text-headline-md font-bold text-on-surface">
              Student Overview
            </h2>
            {/* Bagian ini juga tidak perlu jadi hapus saja */}
            {/* <span className="text-xs text-outline font-normal">
              (Formula kebutuhanData.md terstandarisasi)
            </span> */}
          </div>
          <Link
            className="font-label-md text-label-md text-primary hover:text-primary-container inline-flex items-center gap-1 font-semibold transition-colors"
            to="/student-data"
          >
            View Student Data <span className="material-symbols-outlined text-[16px]">groups</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card: Persentase Mahasiswa Asing */}
          <div
            className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/30 shadow-sm hover:border-primary hover:shadow-md transition-all cursor-pointer relative group flex flex-col justify-between"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              handleOpenModal('intl_students', {
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
              });
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold mt-0.5">
                  Persentase Mahasiswa Asing
                </h3>
                <span className="text-[11px] text-outline font-medium">
                  Non-WNI Status Aktif / Total Aktif
                </span>
              </div>
              <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-surface-container-high"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray="100, 100"
                    strokeWidth="3.5"
                  />
                  <path
                    className="text-primary transition-all duration-300"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray={`${metrics.studentOverview.intlStudents.pct.replace('%', '')}, 100`}
                    strokeLinecap="round"
                    strokeWidth="3.5"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px] text-primary">public</span>
                </div>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="font-metric-display text-3xl font-extrabold text-on-surface">
                  {metrics.studentOverview.intlStudents.pct}
                </span>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                  Target: {metrics.studentOverview.intlStudents.target}
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1.5">
                <strong>{metrics.studentOverview.intlStudents.count}</strong> mahasiswa non-WNI dari
                total <strong>{metrics.studentOverview.intlStudents.total}</strong> student body aktif.
              </p>
              <div className="w-full bg-surface-container-high rounded-full h-2 mt-3 overflow-hidden">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: metrics.studentOverview.intlStudents.barWidth }}
                ></div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-outline mt-3 pt-2 border-t border-surface-container-high">
                <span>Formula: Non WNI / Total Aktif</span>
                <span className="text-primary font-semibold group-hover:underline flex items-center gap-0.5">
                  Lihat Tren <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                </span>
              </div>
            </div>
          </div>

          {/* Card: Student Intake */}
          <div
            className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/30 shadow-sm hover:border-primary hover:shadow-md transition-all cursor-pointer relative group flex flex-col justify-between"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              handleOpenModal('student_intake', {
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
              });
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold mt-0.5">
                  Student Intake
                </h3>
                <span className="text-[11px] text-outline font-medium">Semester 1 Status Aktif</span>
              </div>
              <div className="p-2 rounded-lg bg-surface-container text-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="font-metric-display text-3xl font-extrabold text-on-surface">
                  {metrics.studentOverview.intake.count}
                </span>
                <span className="text-xs text-on-surface-variant font-medium">maba aktif</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1.5">
                Kapasitas terisi <strong>{metrics.studentOverview.intake.filledPct}</strong> dari
                target daya tampung {metrics.studentOverview.intake.target} kursi.
              </p>
              <div className="flex items-center justify-between text-xs mt-2 text-outline font-medium">
                <span>Target: {metrics.studentOverview.intake.target}</span>
                <span className="text-secondary font-semibold">
                  {metrics.studentOverview.intake.filledPct} filled
                </span>
              </div>
              <div className="w-full bg-surface-container-high rounded-full h-2 mt-1 overflow-hidden">
                <div
                  className="bg-secondary h-2 rounded-full"
                  style={{ width: metrics.studentOverview.intake.filledPct }}
                ></div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-outline mt-3 pt-2 border-t border-surface-container-high">
                <span>Σ Mahasiswa Semester 1</span>
                <span className="text-primary font-semibold group-hover:underline flex items-center gap-0.5">
                  Lihat Tren <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                </span>
              </div>
            </div>
          </div>

          {/* Card: Persentase Penurunan Maba */}
          <div
            className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/30 shadow-sm hover:border-primary hover:shadow-md transition-all cursor-pointer relative group flex flex-col justify-between"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              handleOpenModal('intake_growth', {
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
              });
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold mt-0.5">
                  Persentase Penurunan Mahasiswa Baru (5 Thn)
                </h3>
                <span className="text-[11px] text-outline font-medium">
                  Avg YoY Rate Formula ((B-A)/A)+...
                </span>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">trending_up</span>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="font-metric-display text-3xl font-extrabold text-emerald-600">
                    {metrics.studentOverview.intakeGrowth.rate}
                  </span>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                    {metrics.studentOverview.intakeGrowth.label}
                  </span>
                </div>
                <div className="w-24 h-8">
                  <svg className="w-full h-full" viewBox="0 0 96 32">
                    <defs>
                      <linearGradient id="spark-grad" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <polygon
                      fill="url(#spark-grad)"
                      points="0,28 10,25 22,23 34,22 46,18 58,16 70,12 82,10 96,6 96,32 0,32"
                    />
                    <path
                      d="M0,28 L10,25 L22,23 L34,22 L46,18 L58,16 L70,12 L82,10 L96,6"
                      fill="none"
                      stroke="#10b981"
                      strokeLinecap="round"
                      strokeWidth="2.5"
                    />
                    <circle cx="96" cy="6" fill="#059669" r="3" />
                  </svg>
                </div>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1.5">
                Rerata perubahan intake 5 tahun stabil dalam tren peningkatan penerimaan.
              </p>
              <div className="flex items-center justify-between text-[11px] text-outline mt-3 pt-2 border-t border-surface-container-high">
                <span>Sparkline 5 Tahun (Area Chart)</span>
                <span className="text-primary font-semibold group-hover:underline flex items-center gap-0.5">
                  Lihat Tren <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. GRADUATE OVERVIEW SECTION */}
      <div className="flex flex-col gap-3 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📜</span>
            <h2 className="font-headline-lg text-headline-md font-bold text-on-surface">
              Graduate Overview
            </h2>
            <span className="text-xs text-outline font-normal">
              (IPK per Prodi, Sarjana S1, Magister S2, Lulus Tepat Waktu & Keberhasilan Studi)
            </span>
          </div>
          <Link
            className="font-label-md text-label-md text-primary hover:text-primary-container inline-flex items-center gap-1 font-semibold transition-colors"
            to="/graduate-data"
          >
            View Graduate Data <span className="material-symbols-outlined text-[16px]">school</span>
          </Link>
        </div>

        {/* Container Grid dengan items-stretch agar tinggi kedua kolom seimbang sempurna */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* Kolom Kiri: Multi-bar IPK per Prodi (Scrollbar & Batasan max-h dihapus penuh) */}
          <div
            className="lg:col-span-4 bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/30 shadow-sm hover:border-primary transition-all cursor-pointer group flex flex-col justify-between hover:shadow-md h-full"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              handleOpenModal('gpa_prodi', {
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
              });
            }}
          >
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
                <div>
                  <span className="text-[11px] font-semibold text-outline uppercase tracking-wider">
                    Multi-Bar Metrik
                  </span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold mt-0.5">
                    Average IPK per Program Studi
                  </h3>
                </div>
                <span className="p-1.5 rounded-lg bg-surface-container text-primary material-symbols-outlined text-[18px]">
                  bar_chart
                </span>
              </div>

              {/* Daftar program studi ditampilkan penuh tanpa scrollbar */}
              <div className="mt-3 space-y-2.5">
                {metrics.graduateOverview.gpaByProgram.map((item) => {
                  const gpaNum = typeof item.gpa === 'number' ? item.gpa : parseFloat(item.gpa) || 3.5;
                  const barPct = ((gpaNum / 4.0) * 100).toFixed(1);
                  const isS2 = item.program?.toLowerCase().includes('magister') || item.program?.toLowerCase().includes('s2');

                  return (
                    <div key={item.program} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="truncate max-w-[200px]">{item.program}</span>
                        <span className={`${isS2 ? 'text-secondary' : 'text-primary'} font-bold`}>
                          {item.gpa}
                        </span>
                      </div>
                      <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`${isS2 ? 'bg-secondary' : 'bg-primary'} h-1.5 rounded-full`}
                          style={{ width: `${barPct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-outline mt-4 pt-2 border-t border-surface-container-high">
              <span>{metrics.graduateOverview.gpaByProgram.length} Program Studi Terakreditasi</span>
              <span className="text-primary font-semibold group-hover:underline flex items-center gap-0.5">
                Lihat Tren <span className="material-symbols-outlined text-[12px]">open_in_new</span>
              </span>
            </div>
          </div>

          {/* Kolom Kanan: 4 Kotak Metrik Kelulusan yang stretch menyamai tinggi kartu sebelah */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4 h-full items-stretch">
            {/* Card: IPK Sarjana (S1) */}
            <div
              className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/30 shadow-sm hover:border-primary hover:shadow-md transition-all cursor-pointer relative group flex flex-col justify-between h-full"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                handleOpenModal('gpa_s1', {
                  top: rect.top,
                  left: rect.left,
                  width: rect.width,
                  height: rect.height,
                });
              }}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-outline uppercase tracking-wider">
                    Jenjang Sarjana
                  </span>
                  <span className="p-1.5 rounded-lg bg-surface-container text-primary material-symbols-outlined text-[16px]">
                    school
                  </span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold mt-0.5">
                  Average IPK Sarjana (S1)
                </h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-metric-display text-3xl font-extrabold text-on-surface">
                    {metrics.graduateOverview.gpaS1}
                  </span>
                  <span className="text-xs text-outline font-medium">/ 4.00</span>
                </div>
                <p className="font-caption text-caption text-on-surface-variant mt-1.5">
                  Cum Laude: 44.2% (152 wisudawan sarjana)
                </p>
                <div className="w-full bg-surface-container-high rounded-full h-1.5 mt-3 overflow-hidden">
                  <div
                    className="bg-primary h-1.5 rounded-full"
                    style={{ width: `${(Number(metrics.graduateOverview.gpaS1) / 4.0) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-outline mt-3 pt-2 border-t border-surface-container-high">
                <span>Target Institusi: ≥ 3.25</span>
                <span className="text-primary font-semibold flex items-center gap-0.5 group-hover:underline">
                  Lihat Tren <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                </span>
              </div>
            </div>

            {/* Card: IPK Magister (S2) */}
            <div
              className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/30 shadow-sm hover:border-primary hover:shadow-md transition-all cursor-pointer relative group flex flex-col justify-between h-full"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                handleOpenModal('gpa_s2', {
                  top: rect.top,
                  left: rect.left,
                  width: rect.width,
                  height: rect.height,
                });
              }}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-outline uppercase tracking-wider">
                    Jenjang Magister
                  </span>
                  <span className="p-1.5 rounded-lg bg-surface-container text-secondary material-symbols-outlined text-[16px]">
                    workspace_premium
                  </span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold mt-0.5">
                  Average IPK Magister (S2)
                </h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-metric-display text-3xl font-extrabold text-on-surface">
                    {metrics.graduateOverview.gpaS2}
                  </span>
                  <span className="text-xs text-outline font-medium">/ 4.00</span>
                </div>
                <p className="font-caption text-caption text-on-surface-variant mt-1.5">
                  Tesis publikasi terindeks Scopus Q1/Q2
                </p>
                <div className="w-full bg-surface-container-high rounded-full h-1.5 mt-3 overflow-hidden">
                  <div
                    className="bg-secondary h-1.5 rounded-full"
                    style={{ width: `${(Number(metrics.graduateOverview.gpaS2) / 4.0) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-outline mt-3 pt-2 border-t border-surface-container-high">
                <span>Target Institusi: ≥ 3.50</span>
                <span className="text-primary font-semibold flex items-center gap-0.5 group-hover:underline">
                  Lihat Tren <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                </span>
              </div>
            </div>

            {/* Card: Persentase Lulus Tepat Waktu */}
            <div
              className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/30 shadow-sm hover:border-primary hover:shadow-md transition-all cursor-pointer relative group flex flex-col justify-between h-full"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                handleOpenModal('ontime_grad', {
                  top: rect.top,
                  left: rect.left,
                  width: rect.width,
                  height: rect.height,
                });
              }}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-outline uppercase tracking-wider">
                    Formula 8.2.2
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                    Exceeded
                  </span>
                </div>
                <div className="flex items-start justify-between mt-1">
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                      Persentase Lulus Tepat Waktu
                    </h3>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="font-metric-display text-3xl font-extrabold text-on-surface">
                        {metrics.graduateOverview.onTimeGradRate}
                      </span>
                      <span className="text-xs text-emerald-600 font-semibold">
                        Target {metrics.graduateOverview.onTimeTarget}
                      </span>
                    </div>
                  </div>
                  <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
                    <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-surface-container-high"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeDasharray="100, 100"
                        strokeWidth="3.5"
                      />
                      <path
                        className="text-emerald-500 transition-all duration-300"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeDasharray={`${metrics.graduateOverview.onTimeGradRate.replace('%', '')}, 100`}
                        strokeLinecap="round"
                        strokeWidth="3.5"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[16px] text-emerald-600">
                        timer
                      </span>
                    </div>
                  </div>
                </div>
                <p className="font-caption text-caption text-on-surface-variant mt-1.5">
                  Lulus tepat 4 tahun (A) / intake angkatan (B) x 100%
                </p>
              </div>
              <div className="flex items-center justify-between text-[10px] text-outline mt-3 pt-2 border-t border-surface-container-high">
                <span>Kohor S1 4 Tahun</span>
                <span className="text-primary font-semibold flex items-center gap-0.5 group-hover:underline">
                  Lihat Tren <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                </span>
              </div>
            </div>

            {/* Card: Persentase Keberhasilan Studi */}
            <div
              className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/30 shadow-sm hover:border-primary hover:shadow-md transition-all cursor-pointer relative group flex flex-col justify-between h-full"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                handleOpenModal('study_success', {
                  top: rect.top,
                  left: rect.left,
                  width: rect.width,
                  height: rect.height,
                });
              }}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-outline uppercase tracking-wider">
                    Formula 8.2.3
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                    Exceeded
                  </span>
                </div>
                <div className="flex items-start justify-between mt-1">
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                      Persentase Keberhasilan Studi
                    </h3>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="font-metric-display text-3xl font-extrabold text-on-surface">
                        {metrics.graduateOverview.studySuccessRate}
                      </span>
                      <span className="text-xs text-emerald-600 font-semibold">
                        Target {metrics.graduateOverview.studySuccessTarget}
                      </span>
                    </div>
                  </div>
                  <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
                    <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-surface-container-high"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeDasharray="100, 100"
                        strokeWidth="3.5"
                      />
                      <path
                        className="text-primary transition-all duration-300"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeDasharray={`${metrics.graduateOverview.studySuccessRate.replace('%', '')}, 100`}
                        strokeLinecap="round"
                        strokeWidth="3.5"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[16px] text-primary">
                        verified
                      </span>
                    </div>
                  </div>
                </div>
                <p className="font-caption text-caption text-on-surface-variant mt-1.5">
                  Lulus s/d 7 tahun (A) / intake angkatan (B) x 100%
                </p>
              </div>
              <div className="flex items-center justify-between text-[10px] text-outline mt-3 pt-2 border-t border-surface-container-high">
                <span>Masa Studi ≤ 7 Tahun</span>
                <span className="text-primary font-semibold flex items-center gap-0.5 group-hover:underline">
                  Lihat Tren <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. MBKM OVERVIEW SECTION */}
      <div className="flex flex-col gap-3 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🧭</span>
            <h2 className="font-headline-lg text-headline-md font-bold text-on-surface">
              MBKM Overview
            </h2>
            <span className="text-xs text-outline font-normal">
              (Formula: MBKM / Eligible Sem 7 x 100% - MBKM Aktif, Selesai & Evaluasi)
            </span>
          </div>
          <Link
            className="font-label-md text-label-md text-primary hover:text-primary-container inline-flex items-center gap-1 font-semibold transition-colors"
            to="/mbkm-data"
          >
            View MBKM Data <span className="material-symbols-outlined text-[16px]">handshake</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card: % MBKM vs Eligible */}
          <div
            className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/30 shadow-sm hover:border-primary hover:shadow-md transition-all cursor-pointer relative group flex flex-col justify-between"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              handleOpenModal('mbkm_eligible_pct', {
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
              });
            }}
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-outline uppercase tracking-wider">
                    Formula 8.3.1 (IKU 2)
                  </span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold mt-0.5">
                    Persentase MBKM vs Eligible
                  </h3>
                  <span className="text-[11px] text-outline font-medium">Semester 7 Aktif</span>
                </div>
                <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
                  <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-surface-container-high"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeDasharray="100, 100"
                      strokeWidth="3.5"
                    />
                    <path
                      className="text-primary transition-all duration-300"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeDasharray={`${metrics.mbkmOverview.mbkmVsEligiblePct.replace('%', '')}, 100`}
                      strokeLinecap="round"
                      strokeWidth="3.5"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[16px] text-primary">
                      pie_chart
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <span className="font-metric-display text-3xl font-extrabold text-on-surface">
                    {metrics.mbkmOverview.mbkmVsEligiblePct}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                    IKU Memenuhi
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1.5">
                  <strong>{metrics.mbkmOverview.activeMbkm}</strong> mahasiswa MBKM dari total{' '}
                  <strong>{metrics.mbkmOverview.eligibleSem7}</strong> eligible semester 7 (≥ 80 SKS).
                </p>
                <div className="w-full bg-surface-container-high rounded-full h-2 mt-3 overflow-hidden">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: metrics.mbkmOverview.mbkmVsEligiblePct }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-outline mt-3 pt-2 border-t border-surface-container-high">
              <span>MBKM / Eligible Sem 7 x 100%</span>
              <span className="text-primary font-semibold group-hover:underline flex items-center gap-0.5">
                Lihat Tren <span className="material-symbols-outlined text-[12px]">open_in_new</span>
              </span>
            </div>
          </div>

          {/* Card: Total MBKM Aktif */}
          <div
            className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/30 shadow-sm hover:border-primary hover:shadow-md transition-all cursor-pointer relative group flex flex-col justify-between"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              handleOpenModal('total_mbkm', {
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
              });
            }}
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-outline uppercase tracking-wider">
                    Aktivitas MBKM
                  </span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold mt-0.5">
                    Total MBKM Aktif
                  </h3>
                  <span className="text-[11px] text-outline font-medium">Status Selesai & Evaluasi</span>
                </div>
                <div className="p-2 rounded-lg bg-surface-container text-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">verified</span>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <span className="font-metric-display text-3xl font-extrabold text-on-surface">
                    {metrics.mbkmOverview.activeMbkm}
                  </span>
                  <span className="text-xs text-on-surface-variant font-medium">peserta aktif</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1.5">
                  Magang Industri: 36 • Pertukaran: 18 • Studi Independen: 14 • Riset/Kemanusiaan: 6
                </p>
                <div className="w-full bg-surface-container-high rounded-full h-2 mt-3 overflow-hidden">
                  <div
                    className="bg-secondary h-2 rounded-full"
                    style={{ width: `${metrics.mbkmOverview.activeMbkm}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-outline mt-3 pt-2 border-t border-surface-container-high">
              <span>Magang, Riset, Studi, Proyek</span>
              <span className="text-primary font-semibold group-hover:underline flex items-center gap-0.5">
                Lihat Tren <span className="material-symbols-outlined text-[12px]">open_in_new</span>
              </span>
            </div>
          </div>

          {/* Card: Total Mahasiswa Eligible */}
          <div
            className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/30 shadow-sm hover:border-primary hover:shadow-md transition-all cursor-pointer relative group flex flex-col justify-between"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              handleOpenModal('eligible_sem7', {
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
              });
            }}
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-outline uppercase tracking-wider">
                    Kohor Semester 7
                  </span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold mt-0.5">
                    Total Mahasiswa Eligible
                  </h3>
                  <span className="text-[11px] text-outline font-medium">Semester 7 Aktif</span>
                </div>
                <div className="p-2 rounded-lg bg-amber-100 text-tertiary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">checklist</span>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <span className="font-metric-display text-3xl font-extrabold text-on-surface">
                    {metrics.mbkmOverview.eligibleSem7}
                  </span>
                  <span className="text-xs text-on-surface-variant font-medium">mahasiswa</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1.5">
                  Syarat terverifikasi telah menyelesaikan beban akademik institusi ≥ 80 SKS.
                </p>
                <div className="w-full bg-surface-container-high rounded-full h-2 mt-3 overflow-hidden">
                  <div className="bg-tertiary-fixed-dim h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-outline mt-3 pt-2 border-t border-surface-container-high">
              <span>Eligible: Beban Studi ≥ 80 SKS</span>
              <span className="text-primary font-semibold group-hover:underline flex items-center gap-0.5">
                Lihat Tren <span className="material-symbols-outlined text-[12px]">open_in_new</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Detail Metrik Interaktif */}
      <InteractiveMetricModal
        metricKey={activeModalMetric}
        originRect={modalOriginRect}
        onClose={() => {
          setActiveModalMetric(null);
          setModalOriginRect(null);
        }}
      />
    </div>
  );
};

