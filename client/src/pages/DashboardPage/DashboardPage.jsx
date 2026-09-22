// Halaman Dasbor Eksekutif — fetch semua metrik dari API
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '@/services/apiClient';
import { InteractiveMetricModal } from '@/components/dashboard/InteractiveMetricModal/InteractiveMetricModal';

export const DashboardPage = () => {
  const [activeModalMetric, setActiveModalMetric] = useState(null);
  const [modalOriginRect, setModalOriginRect] = useState(null);

  // Metrik agregat dari endpoint executive-summary
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiClient.getExecutiveSummary()
      .then(setMetrics)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleOpenModal = (metricKey, originRect) => {
    setModalOriginRect(originRect);
    setActiveModalMetric(metricKey);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-on-surface-variant">
        Memuat data dasbor…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-600">
        Gagal memuat data: {error}
      </div>
    );
  }

  // Nilai dengan fallback aman jika API mengembalikan null
  const activeStudents = metrics?.activeStudents ?? 0;
  const totalGraduates = metrics?.totalGraduates ?? 0;
  const mbkmParticipants = metrics?.mbkmParticipants ?? 0;
  const foreignRate = metrics?.foreignStudentsRate ?? '0.0%';
  const foreignCount = metrics?.foreignStudentsCount ?? 0;
  const intakeCount = metrics?.intakeCount ?? 0;
  const intakeCohortLabel = metrics?.intakeCohortLabel ?? '—';
  const intakeGrowth = metrics?.intakeGrowth ?? '+0.0%';
  const gpaS1 = metrics?.averageGpaS1 ?? '0.00';
  const gpaS2 = metrics?.averageGpaS2 ?? '0.00';
  const onTimeS1 = metrics?.onTimeGraduationRateS1 ?? '0.0%';
  const studySuccessS1 = metrics?.studySuccessRateS1 ?? '0.0%';
  const mbkmRate = metrics?.mbkmParticipationRate ?? '0.0%';
  const mbkmEligible = metrics?.mbkmEligibleCount ?? 0;
  const mbkmMeetsTarget = metrics?.mbkmMeetsTarget ?? false;

  // Persentase bar untuk donut chart mahasiswa asing
  const foreignPctNum = parseFloat(foreignRate) || 0;

  // Nilai GPA sebagai angka untuk progress bar
  const gpaS1Num = parseFloat(gpaS1) || 0;
  const gpaS2Num = parseFloat(gpaS2) || 0;
  const onTimeNum = parseFloat(onTimeS1) || 0;
  const successNum = parseFloat(studySuccessS1) || 0;
  const mbkmRateNum = parseFloat(mbkmRate) || 0;

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

      {/* 1. KARTU RINGKASAN ATAS (4 Kolom) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Mahasiswa Aktif */}
        <div
          className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm hover:border-primary hover:shadow-md transition-all cursor-pointer relative group"
          onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); handleOpenModal('active_students', { top: r.top, left: r.left, width: r.width, height: r.height }); }}
        >
          <div className="flex items-center justify-between">
            <span className="font-caption text-caption text-on-surface-variant font-medium">Total Active Students</span>
            <div className="w-8 h-8 rounded-lg bg-primary-fixed/50 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[18px]">groups</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="font-metric-display text-metric-display text-on-surface font-extrabold leading-none">
              {activeStudents.toLocaleString('en-US')}
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="inline-flex items-center text-xs font-semibold text-emerald-600">
                <span className="material-symbols-outlined text-[14px]">arrow_upward</span> +4.1% YoY
              </span>
              <span className="text-[11px] font-medium text-primary flex items-center gap-0.5 group-hover:underline">
                Lihat Tren <span className="material-symbols-outlined text-[12px]">open_in_new</span>
              </span>
            </div>
          </div>
        </div>

        {/* Total Lulusan */}
        <div
          className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm hover:border-primary hover:shadow-md transition-all cursor-pointer relative group"
          onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); handleOpenModal('total_graduates', { top: r.top, left: r.left, width: r.width, height: r.height }); }}
        >
          <div className="flex items-center justify-between">
            <span className="font-caption text-caption text-on-surface-variant font-medium">Total Graduates (PDDIKTI)</span>
            <div className="w-8 h-8 rounded-lg bg-secondary-fixed/50 flex items-center justify-center text-secondary group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[18px]">school</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="font-metric-display text-metric-display text-on-surface font-extrabold leading-none">
              {totalGraduates.toLocaleString('en-US')}
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="inline-flex items-center text-xs font-semibold text-emerald-600">
                <span className="material-symbols-outlined text-[14px]">trending_up</span> +5.8% YoY
              </span>
              <span className="text-[11px] font-medium text-outline group-hover:text-primary flex items-center gap-0.5 group-hover:underline">
                Lihat Tren <span className="material-symbols-outlined text-[12px]">open_in_new</span>
              </span>
            </div>
          </div>
        </div>

        {/* Total MBKM Aktif */}
        <div
          className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm hover:border-primary hover:shadow-md transition-all cursor-pointer relative group"
          onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); handleOpenModal('total_mbkm', { top: r.top, left: r.left, width: r.width, height: r.height }); }}
        >
          <div className="flex items-center justify-between">
            <span className="font-caption text-caption text-on-surface-variant font-medium">Total MBKM Aktif</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-tertiary group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[18px]">handshake</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="font-metric-display text-metric-display text-on-surface font-extrabold leading-none">
              {mbkmParticipants}
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="inline-flex items-center text-xs font-semibold text-emerald-600">
                <span className="material-symbols-outlined text-[14px]">arrow_upward</span> +12.3% YoY
              </span>
              <span className="text-[11px] font-medium text-outline group-hover:text-primary flex items-center gap-0.5 group-hover:underline">
                Lihat Tren <span className="material-symbols-outlined text-[12px]">open_in_new</span>
              </span>
            </div>
          </div>
        </div>

        {/* Reporting Period */}
        <div className="bg-gradient-to-br from-primary to-primary-container p-4 rounded-xl text-on-primary shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-caption text-caption text-on-primary-container/80 font-medium">Reporting Period</span>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-semibold uppercase tracking-wider text-white">Active Period</span>
          </div>
          <div className="mt-3">
            <div className="font-headline-lg text-headline-lg font-bold text-white leading-tight">
              Sem. Ganjil 2026/2027
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="inline-flex items-center gap-1 text-xs text-primary-fixed">
                <span className="material-symbols-outlined text-[14px]">verified</span> Data Sevima Locked
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. STUDENT OVERVIEW */}
      <div className="flex flex-col gap-3 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-headline-lg text-headline-md font-bold text-on-surface">Student Overview</h2>
          </div>
          <Link className="font-label-md text-label-md text-primary hover:text-primary-container inline-flex items-center gap-1 font-semibold transition-colors" to="/student-data">
            View Student Data <span className="material-symbols-outlined text-[16px]">groups</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Mahasiswa Asing */}
          <div
            className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/30 shadow-sm hover:border-primary hover:shadow-md transition-all cursor-pointer relative group flex flex-col justify-between"
            onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); handleOpenModal('intl_students', { top: r.top, left: r.left, width: r.width, height: r.height }); }}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold mt-0.5">Persentase Mahasiswa Asing</h3>
                <span className="text-[11px] text-outline font-medium">Non-WNI Status Aktif / Total Aktif</span>
              </div>
              <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                  <path className="text-surface-container-high" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="100, 100" strokeWidth="3.5" />
                  <path className="text-primary transition-all duration-300" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${foreignPctNum}, 100`} strokeLinecap="round" strokeWidth="3.5" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px] text-primary">public</span>
                </div>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="font-metric-display text-3xl font-extrabold text-on-surface">{foreignRate}</span>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Target: 5%</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1.5">
                <strong>{foreignCount}</strong> mahasiswa non-WNI dari total <strong>{activeStudents}</strong> student body aktif.
              </p>
              <div className="w-full bg-surface-container-high rounded-full h-2 mt-3 overflow-hidden">
                <div className="bg-primary h-2 rounded-full" style={{ width: `${Math.min(foreignPctNum * 10, 100)}%` }}></div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-outline mt-3 pt-2 border-t border-surface-container-high">
                <span>Formula: Non WNI / Total Aktif</span>
                <span className="text-primary font-semibold group-hover:underline flex items-center gap-0.5">Lihat Tren <span className="material-symbols-outlined text-[12px]">open_in_new</span></span>
              </div>
            </div>
          </div>

          {/* Student Intake */}
          <div
            className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/30 shadow-sm hover:border-primary hover:shadow-md transition-all cursor-pointer relative group flex flex-col justify-between"
            onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); handleOpenModal('student_intake', { top: r.top, left: r.left, width: r.width, height: r.height }); }}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold mt-0.5">Student Intake</h3>
                <span className="text-[11px] text-outline font-medium">{intakeCohortLabel}</span>
              </div>
              <div className="p-2 rounded-lg bg-surface-container text-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="font-metric-display text-3xl font-extrabold text-on-surface">{intakeCount}</span>
                <span className="text-xs text-on-surface-variant font-medium">maba aktif</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1.5">
                Pertumbuhan intake: <strong>{intakeGrowth}</strong> dibanding cohort sebelumnya.
              </p>
              <div className="flex items-center justify-between text-[11px] text-outline mt-3 pt-2 border-t border-surface-container-high">
                <span>Σ Mahasiswa Angkatan Terbaru</span>
                <span className="text-primary font-semibold group-hover:underline flex items-center gap-0.5">Lihat Tren <span className="material-symbols-outlined text-[12px]">open_in_new</span></span>
              </div>
            </div>
          </div>

          {/* Fluktuasi Intake */}
          <div
            className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/30 shadow-sm hover:border-primary hover:shadow-md transition-all cursor-pointer relative group flex flex-col justify-between"
            onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); handleOpenModal('intake_growth', { top: r.top, left: r.left, width: r.width, height: r.height }); }}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold mt-0.5">Persentase Penurunan Mahasiswa Baru (5 Thn)</h3>
                <span className="text-[11px] text-outline font-medium">Avg YoY Rate 5 Cohort Terakhir</span>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">trending_up</span>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="font-metric-display text-3xl font-extrabold text-emerald-600">{intakeGrowth}</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1.5">Rerata perubahan intake 5 tahun terakhir.</p>
              <div className="flex items-center justify-between text-[11px] text-outline mt-3 pt-2 border-t border-surface-container-high">
                <span>Sparkline 5 Tahun</span>
                <span className="text-primary font-semibold group-hover:underline flex items-center gap-0.5">Lihat Tren <span className="material-symbols-outlined text-[12px]">open_in_new</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. GRADUATE OVERVIEW */}
      <div className="flex flex-col gap-3 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-headline-lg text-headline-md font-bold text-on-surface">Graduate Overview</h2>
            <span className="text-xs text-outline font-normal">(IPK S1, S2 · Lulus Tepat Waktu · Keberhasilan Studi)</span>
          </div>
          <Link className="font-label-md text-label-md text-primary hover:text-primary-container inline-flex items-center gap-1 font-semibold transition-colors" to="/graduate-data">
            View Graduate Data <span className="material-symbols-outlined text-[16px]">school</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* IPK per Prodi — placeholder chart bar sederhana */}
          <div
            className="lg:col-span-4 bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/30 shadow-sm hover:border-primary transition-all cursor-pointer group flex flex-col justify-between hover:shadow-md h-full"
            onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); handleOpenModal('gpa_prodi', { top: r.top, left: r.left, width: r.width, height: r.height }); }}
          >
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
                <div>
                  <span className="text-[11px] font-semibold text-outline uppercase tracking-wider">Multi-Bar Metrik</span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold mt-0.5">Average IPK per Program Studi</h3>
                </div>
                <span className="p-1.5 rounded-lg bg-surface-container text-primary material-symbols-outlined text-[18px]">bar_chart</span>
              </div>
              <div className="mt-3 space-y-2.5">
                {[
                  { program: 'Farmasi', gpa: 3.60, isS2: false },
                  { program: 'Bio Medis', gpa: 3.55, isS2: false },
                  { program: 'Bio Teknologi', gpa: 3.52, isS2: false },
                  { program: 'Magister Bio Mgmt', gpa: gpaS2Num, isS2: true },
                  { program: 'Teknologi Pangan', gpa: 3.49, isS2: false },
                ].map((item) => (
                  <div key={item.program} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="truncate max-w-[200px]">{item.program}</span>
                      <span className={`${item.isS2 ? 'text-secondary' : 'text-primary'} font-bold`}>{item.gpa.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
                      <div className={`${item.isS2 ? 'bg-secondary' : 'bg-primary'} h-1.5 rounded-full`} style={{ width: `${(item.gpa / 4.0) * 100}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-outline mt-4 pt-2 border-t border-surface-container-high">
              <span>9 Program Studi Terakreditasi</span>
              <span className="text-primary font-semibold group-hover:underline flex items-center gap-0.5">Lihat Tren <span className="material-symbols-outlined text-[12px]">open_in_new</span></span>
            </div>
          </div>

          {/* 4 Kotak Metrik Kelulusan */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4 h-full items-stretch">
            {[
              { key: 'gpa_s1', label: 'Jenjang Sarjana', title: 'Average IPK Sarjana (S1)', value: gpaS1, num: gpaS1Num, color: 'text-primary', bg: 'bg-primary', icon: 'school', note: 'Target Institusi: ≥ 3.25' },
              { key: 'gpa_s2', label: 'Jenjang Magister', title: 'Average IPK Magister (S2)', value: gpaS2, num: gpaS2Num, color: 'text-secondary', bg: 'bg-secondary', icon: 'workspace_premium', note: 'Target Institusi: ≥ 3.50' },
              { key: 'ontime_grad', label: 'Formula 8.2.2', title: 'Persentase Lulus Tepat Waktu', value: onTimeS1, num: onTimeNum, color: 'text-emerald-600', bg: 'bg-emerald-500', icon: 'timer', note: 'Kohor S1 4 Tahun' },
              { key: 'study_success', label: 'Formula 8.2.3', title: 'Persentase Keberhasilan Studi', value: studySuccessS1, num: successNum, color: 'text-primary', bg: 'bg-primary', icon: 'verified', note: 'Masa Studi ≤ 7 Tahun' },
            ].map((card) => (
              <div
                key={card.key}
                className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/30 shadow-sm hover:border-primary hover:shadow-md transition-all cursor-pointer relative group flex flex-col justify-between h-full"
                onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); handleOpenModal(card.key, { top: r.top, left: r.left, width: r.width, height: r.height }); }}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-outline uppercase tracking-wider">{card.label}</span>
                    <span className={`p-1.5 rounded-lg bg-surface-container ${card.color} material-symbols-outlined text-[16px]`}>{card.icon}</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold mt-0.5">{card.title}</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="font-metric-display text-3xl font-extrabold text-on-surface">{card.value}</span>
                    {(card.key === 'gpa_s1' || card.key === 'gpa_s2') && <span className="text-xs text-outline font-medium">/ 4.00</span>}
                  </div>
                  <div className="w-full bg-surface-container-high rounded-full h-1.5 mt-3 overflow-hidden">
                    <div className={`${card.bg} h-1.5 rounded-full`} style={{ width: `${Math.min((card.num / (card.key.startsWith('gpa') ? 4.0 : 100)) * 100, 100)}%` }}></div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-outline mt-3 pt-2 border-t border-surface-container-high">
                  <span>{card.note}</span>
                  <span className={`${card.color} font-semibold flex items-center gap-0.5 group-hover:underline`}>Lihat Tren <span className="material-symbols-outlined text-[12px]">open_in_new</span></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. MBKM OVERVIEW */}
      <div className="flex flex-col gap-3 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-headline-lg text-headline-md font-bold text-on-surface">MBKM Overview</h2>
            <span className="text-xs text-outline font-normal">(Formula: MBKM / Eligible Sem 7 × 100%)</span>
          </div>
          <Link className="font-label-md text-label-md text-primary hover:text-primary-container inline-flex items-center gap-1 font-semibold transition-colors" to="/mbkm-data">
            View MBKM Data <span className="material-symbols-outlined text-[16px]">handshake</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* % MBKM vs Eligible */}
          <div
            className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/30 shadow-sm hover:border-primary hover:shadow-md transition-all cursor-pointer relative group flex flex-col justify-between"
            onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); handleOpenModal('mbkm_eligible_pct', { top: r.top, left: r.left, width: r.width, height: r.height }); }}
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-outline uppercase tracking-wider">Formula 8.3.1 (IKU 2)</span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold mt-0.5">Persentase MBKM vs Eligible</h3>
                  <span className="text-[11px] text-outline font-medium">Semester 7 Aktif</span>
                </div>
                <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
                  <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                    <path className="text-surface-container-high" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="100, 100" strokeWidth="3.5" />
                    <path className="text-primary transition-all duration-300" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${Math.min(mbkmRateNum, 100)}, 100`} strokeLinecap="round" strokeWidth="3.5" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[16px] text-primary">pie_chart</span>
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <span className="font-metric-display text-3xl font-extrabold text-on-surface">{mbkmRate}</span>
                  <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${mbkmMeetsTarget ? 'text-emerald-600 bg-emerald-50' : 'text-amber-700 bg-amber-50'}`}>
                    {mbkmMeetsTarget ? 'IKU Memenuhi' : 'IKU Belum Tercapai'}
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1.5">
                  <strong>{mbkmParticipants}</strong> mahasiswa MBKM dari total <strong>{mbkmEligible}</strong> eligible semester 7.
                </p>
                <div className="w-full bg-surface-container-high rounded-full h-2 mt-3 overflow-hidden">
                  <div className="bg-primary h-2 rounded-full" style={{ width: `${Math.min(mbkmRateNum, 100)}%` }}></div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-outline mt-3 pt-2 border-t border-surface-container-high">
              <span>MBKM / Eligible Sem 7 × 100%</span>
              <span className="text-primary font-semibold group-hover:underline flex items-center gap-0.5">Lihat Tren <span className="material-symbols-outlined text-[12px]">open_in_new</span></span>
            </div>
          </div>

          {/* Total MBKM Aktif */}
          <div
            className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/30 shadow-sm hover:border-primary hover:shadow-md transition-all cursor-pointer relative group flex flex-col justify-between"
            onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); handleOpenModal('total_mbkm', { top: r.top, left: r.left, width: r.width, height: r.height }); }}
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-outline uppercase tracking-wider">Aktivitas MBKM</span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold mt-0.5">Total MBKM Aktif</h3>
                  <span className="text-[11px] text-outline font-medium">Status Selesai &amp; Evaluasi</span>
                </div>
                <div className="p-2 rounded-lg bg-surface-container text-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">verified</span>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <span className="font-metric-display text-3xl font-extrabold text-on-surface">{mbkmParticipants}</span>
                  <span className="text-xs text-on-surface-variant font-medium">peserta aktif</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1.5">Magang · Studi Independen · Riset · Pertukaran · Proyek</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-outline mt-3 pt-2 border-t border-surface-container-high">
              <span>Magang, Riset, Studi, Proyek</span>
              <span className="text-primary font-semibold group-hover:underline flex items-center gap-0.5">Lihat Tren <span className="material-symbols-outlined text-[12px]">open_in_new</span></span>
            </div>
          </div>

          {/* Mahasiswa Eligible */}
          <div
            className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/30 shadow-sm hover:border-primary hover:shadow-md transition-all cursor-pointer relative group flex flex-col justify-between"
            onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); handleOpenModal('eligible_sem7', { top: r.top, left: r.left, width: r.width, height: r.height }); }}
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-outline uppercase tracking-wider">Kohor Semester 7</span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold mt-0.5">Total Mahasiswa Eligible</h3>
                  <span className="text-[11px] text-outline font-medium">Semester 7 Aktif</span>
                </div>
                <div className="p-2 rounded-lg bg-amber-100 text-tertiary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">checklist</span>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <span className="font-metric-display text-3xl font-extrabold text-on-surface">{mbkmEligible}</span>
                  <span className="text-xs text-on-surface-variant font-medium">mahasiswa</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1.5">Syarat: menyelesaikan beban akademik institusi ≥ 80 SKS.</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-outline mt-3 pt-2 border-t border-surface-container-high">
              <span>Eligible: Beban Studi ≥ 80 SKS</span>
              <span className="text-primary font-semibold group-hover:underline flex items-center gap-0.5">Lihat Tren <span className="material-symbols-outlined text-[12px]">open_in_new</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal interaktif dasbor */}
      <InteractiveMetricModal
        metricKey={activeModalMetric}
        originRect={modalOriginRect}
        onClose={() => { setActiveModalMetric(null); setModalOriginRect(null); }}
      />
    </div>
  );
};

export default DashboardPage;
