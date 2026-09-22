// Modal detail mahasiswa — menerima data analitik pre-komputasi dari halaman sebagai props
import React, { useEffect, useMemo, useState } from 'react';
import { ActiveStudentsView } from './views/ActiveStudentsView';
import { ForeignStudentsView } from './views/ForeignStudentsView';
import { IntakeTrendView } from './views/IntakeTrendView';
import { IntakeFluctuationView } from './views/IntakeFluctuationView';

/**
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - originRect: { top, left, width, height } | null
 * - metricType: 'active-students' | 'foreign-students' | 'intake-students' | 'intake-fluctuation'
 * - analytics: objek hasil pre-komputasi dari halaman (lihat StudentDataPage)
 */
export const DetailModal = ({
  isOpen,
  onClose,
  originRect,
  metricType = 'active-students',
  analytics = {},
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      const r1 = requestAnimationFrame(() => {
        const r2 = requestAnimationFrame(() => setIsAnimating(true));
        return () => cancelAnimationFrame(r2);
      });
      return () => cancelAnimationFrame(r1);
    } else {
      setIsAnimating(false);
      setIsMounted(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => { setIsMounted(false); if (onClose) onClose(); }, 350);
  };

  // Data analitik dari props
  const {
    activeStudents = [],
    prodiData = [],
    facultyData = [],
    jenjangData = [],
    foreignTrendData = [],
    intakeTrendData = [],
    fluctuationData = { isPositive: true, chartData: [] },
  } = analytics;

  // Tabel diurutkan baru → lama
  const sortedForeignTableData = useMemo(
    () => [...foreignTrendData].sort((a, b) => Number(b.year) - Number(a.year)),
    [foreignTrendData]
  );
  const sortedIntakeTableData = useMemo(
    () => [...intakeTrendData].sort((a, b) => Number(b.year) - Number(a.year)),
    [intakeTrendData]
  );
  const sortedFluctuationTableData = useMemo(
    () => [...(fluctuationData.chartData || [])].sort((a, b) => Number(b.year) - Number(a.year)),
    [fluctuationData.chartData]
  );

  if (!isMounted && !isOpen) return null;

  // Transformasi animasi zoom dari kartu asal
  const hasOrigin = Boolean(originRect?.width && originRect?.height);
  let transformStyle = 'translate(-50%, -50%) scale(1)';
  let closedOpacity = 0;

  if (hasOrigin && !isAnimating) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const dx = (originRect.left + originRect.width / 2) - vw / 2;
    const dy = (originRect.top + originRect.height / 2) - vh / 2;
    const mW = Math.min(vw * 0.94, 960);
    const mH = Math.min(vh * 0.92, 740);
    const scale = Math.min(Math.max(0.2, originRect.width / mW), Math.max(0.2, originRect.height / mH));
    transformStyle = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(${scale})`;
  } else if (!hasOrigin && !isAnimating) {
    transformStyle = 'translate(-50%, -50%) scale(0.88)';
  }

  // Konfigurasi header — aksen kuning seragam
  const HEADER_MAP = {
    'active-students':    { icon: 'groups',    badge: 'Student Body KPI',       title: 'Rincian Mahasiswa Aktif',                          iconBg: 'bg-amber-100 text-amber-900' },
    'foreign-students':   { icon: 'public',    badge: 'International Cohort KPI', title: 'Persentase Mahasiswa Asing - Tren & Analisis',   iconBg: 'bg-amber-100 text-amber-900' },
    'intake-students':    { icon: 'how_to_reg', badge: 'Admissions & Intake KPI', title: 'Intake Mahasiswa Baru - Rincian Semester & Tren', iconBg: 'bg-amber-100 text-amber-900' },
    'intake-fluctuation': { icon: fluctuationData.isPositive ? 'trending_up' : 'trending_down', badge: 'Fluctuation & Growth KPI', title: 'Grafik Fluktuasi Intake Mahasiswa Baru (5 Tahun)', iconBg: 'bg-amber-100 text-amber-900' },
  };
  const h = HEADER_MAP[metricType] || HEADER_MAP['active-students'];

  return (
    <div
      id="student-detail-modal-backdrop"
      className={`fixed inset-0 z-50 flex items-center justify-center p-0 transition-opacity duration-300 ease-out ${
        isAnimating ? 'bg-black/45 backdrop-blur-sm opacity-100' : 'bg-black/0 backdrop-blur-none opacity-0 pointer-events-none'
      }`}
      onClick={(e) => { if (e.target.id === 'student-detail-modal-backdrop') handleClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        style={{
          transform: transformStyle,
          opacity: isAnimating ? 1 : closedOpacity,
          transition: 'transform 350ms cubic-bezier(0.16, 1, 0.3, 1), opacity 300ms ease-out',
        }}
        className="fixed top-1/2 left-1/2 w-[min(94vw,62rem)] max-h-[92vh] z-50 bg-surface-container-lowest shadow-2xl rounded-2xl border border-outline-variant/40 overflow-hidden flex flex-col will-change-transform"
      >
        {/* Header modal — aksen kuning (#d97706) seragam */}
        <div className="p-5 border-b border-surface-container-high flex items-start justify-between bg-surface-container-low/40 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${h.iconBg}`}>
              <span className="material-symbols-outlined text-[24px]">{h.icon}</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">{h.badge}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                  Status: Aktif Only
                </span>
              </div>
              <h3 className="font-headline-lg text-lg font-bold text-on-surface mt-0.5 truncate">{h.title}</h3>
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
          {metricType === 'foreign-students' ? (
            <ForeignStudentsView foreignTrendData={foreignTrendData} sortedForeignTableData={sortedForeignTableData} />
          ) : metricType === 'intake-students' ? (
            <IntakeTrendView intakeTrendData={intakeTrendData} sortedIntakeTableData={sortedIntakeTableData} />
          ) : metricType === 'intake-fluctuation' ? (
            <IntakeFluctuationView fluctuationData={fluctuationData} sortedFluctuationTableData={sortedFluctuationTableData} />
          ) : (
            <ActiveStudentsView activeStudents={activeStudents} prodiData={prodiData} facultyData={facultyData} jenjangData={jenjangData} />
          )}
        </div>

        {/* Footer dengan tombol tutup aksen kuning */}
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

export default DetailModal;
