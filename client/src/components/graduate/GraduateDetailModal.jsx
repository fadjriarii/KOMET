// Modal detail lulusan — menerima data analitik dari halaman sebagai props
import React, { useEffect, useMemo, useState } from 'react';
import { TotalGraduatesView } from './views/TotalGraduatesView';
import { GpaOverviewView } from './views/GpaOverviewView';
import { OnTimeGraduationView } from './views/OnTimeGraduationView';
import { StudySuccessView } from './views/StudySuccessView';

/**
 * Props:
 * - metricType: 'total-graduates' | 'gpa-overview' | 'on-time-graduation' | 'study-success'
 * - originRect: { top, left, width, height }
 * - onClose: () => void
 * - analytics: objek hasil pre-komputasi dari halaman (lihat GraduateDataPage)
 */
export const GraduateDetailModal = ({ metricType, originRect, onClose, analytics = {} }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const raf = requestAnimationFrame(() => setIsAnimating(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Tutup saat Escape ditekan
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => { setIsMounted(false); onClose(); }, 280);
  };

  // Data analitik dari props (semua komputasi dilakukan di halaman/backend)
  const {
    totalCount = 0,
    yearTrendData = [],
    predikatData = [],
    prodiGpaData = [],
    facultyGpaData = [],
    gpaBandsData = [],
    s1Gpa = { average: '0.00' },
    s2Gpa = { average: '0.00' },
    onTimeRateS1 = { rate: '0.0%' },
    onTimeRateS2 = { rate: '0.0%' },
    studySuccessRateS1 = { rate: '0.0%' },
    studySuccessRateS2 = { rate: '0.0%' },
    onTimeCohortData = [],
    onTimeCohortDataS2 = [],
    successCohortData = [],
    successCohortDataS2 = [],
  } = analytics;

  // Chart diurutkan ascending (lama → baru)
  const onTimeChartData = useMemo(() => [...onTimeCohortData].sort((a, b) => a.cohort - b.cohort), [onTimeCohortData]);
  const onTimeChartDataS2 = useMemo(() => [...onTimeCohortDataS2].sort((a, b) => a.cohort - b.cohort), [onTimeCohortDataS2]);
  const successChartData = useMemo(() => [...successCohortData].sort((a, b) => a.cohort - b.cohort), [successCohortData]);
  const successChartDataS2 = useMemo(() => [...successCohortDataS2].sort((a, b) => a.cohort - b.cohort), [successCohortDataS2]);

  const winW = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const winH = typeof window !== 'undefined' ? window.innerHeight : 768;
  const originTop = originRect ? originRect.top + originRect.height / 2 : winH / 2;
  const originLeft = originRect ? originRect.left + originRect.width / 2 : winW / 2;
  const deltaX = originLeft - winW / 2;
  const deltaY = originTop - winH / 2;

  const transformStyle = isAnimating
    ? 'translate(-50%, -50%) scale(1)'
    : `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px)) scale(0.2)`;

  // Konfigurasi header sesuai metricType — semua tipe menggunakan aksen amber
  const MODAL_CONFIG = {
    'total-graduates':    { title: 'Total Lulusan & Tren Tahunan (PDDIKTI)', badge: 'Graduate Body Registry', icon: 'school', iconBg: 'bg-amber-100 text-amber-900' },
    'gpa-overview':       { title: 'Analitik & Distribusi IPK Lulusan', badge: 'Academic GPA Performance', icon: 'grade', iconBg: 'bg-amber-100 text-amber-900' },
    'on-time-graduation': { title: 'Analitik Kelulusan Tepat Waktu per Angkatan', badge: 'On-Time Graduation KPI', icon: 'timer', iconBg: 'bg-amber-100 text-amber-900' },
    'study-success':      { title: 'Analitik Keberhasilan Studi per Angkatan', badge: 'Study Success Rate KPI', icon: 'verified_user', iconBg: 'bg-amber-100 text-amber-900' },
  };
  const config = MODAL_CONFIG[metricType] || MODAL_CONFIG['gpa-overview'];

  if (!isMounted) return null;

  return (
    <div
      id="graduate-detail-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm transition-opacity duration-300"
      style={{ opacity: isAnimating ? 1 : 0 }}
      onClick={(e) => { if (e.target.id === 'graduate-detail-modal-backdrop') handleClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        style={{
          transform: transformStyle,
          opacity: isAnimating ? 1 : 0,
          transition: 'transform 350ms cubic-bezier(0.16, 1, 0.3, 1), opacity 300ms ease-out',
        }}
        className="fixed top-1/2 left-1/2 w-[min(94vw,62rem)] max-h-[92vh] z-50 bg-surface-container-lowest shadow-2xl rounded-2xl border border-outline-variant/40 overflow-hidden flex flex-col will-change-transform"
      >
        {/* Header modal dengan aksen kuning (#d97706) untuk semua tipe */}
        <div className="p-5 border-b border-surface-container-high flex items-start justify-between bg-surface-container-low/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.iconBg}`}>
              <span className="material-symbols-outlined text-[24px]">{config.icon}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">{config.badge}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                  Data Terverifikasi PDDIKTI
                </span>
              </div>
              <h3 className="font-headline-lg text-lg font-bold text-on-surface mt-0.5">{config.title}</h3>
            </div>
          </div>
          <button
            className="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer shrink-0"
            type="button"
            onClick={handleClose}
            aria-label="Tutup modal"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Konten view sesuai metricType */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-surface-container-lowest">
          {metricType === 'total-graduates' && (
            <TotalGraduatesView totalCount={totalCount} yearTrendData={yearTrendData} predikatData={predikatData} />
          )}
          {metricType === 'gpa-overview' && (
            <GpaOverviewView s1Gpa={s1Gpa} s2Gpa={s2Gpa} prodiGpaData={prodiGpaData} facultyGpaData={facultyGpaData} gpaBandsData={gpaBandsData} />
          )}
          {metricType === 'on-time-graduation' && (
            <OnTimeGraduationView
              onTimeRateS1={onTimeRateS1} onTimeRateS2={onTimeRateS2}
              onTimeCohortData={onTimeCohortData} onTimeCohortDataS2={onTimeCohortDataS2}
              onTimeChartData={onTimeChartData} onTimeChartDataS2={onTimeChartDataS2}
            />
          )}
          {metricType === 'study-success' && (
            <StudySuccessView
              studySuccessRateS1={studySuccessRateS1} studySuccessRateS2={studySuccessRateS2}
              successCohortData={successCohortData} successCohortDataS2={successCohortDataS2}
              successChartData={successChartData} successChartDataS2={successChartDataS2}
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-surface-container-high bg-surface-container-low/40 flex items-center justify-between text-xs shrink-0">
          <span className="text-[11px] text-outline">Sumber data: PDDIKTI &amp; Sevima Feeder</span>
          <button
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition-colors cursor-pointer"
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

export default GraduateDetailModal;
