// Modal detail MBKM — menerima data analitik pre-komputasi dari halaman sebagai props
import React, { useEffect, useMemo, useState } from 'react';
import { MbkmRateView } from './views/MbkmRateView';
import { MbkmActiveActivitiesView } from './views/MbkmActiveActivitiesView';
import { MbkmEligibleStudentsView } from './views/MbkmEligibleStudentsView';
import { MbkmPartnersView } from './views/MbkmPartnersView';

/**
 * Props:
 * - metricType: 'rate-mbkm' | 'active-mbkm' | 'eligible-students' | 'mitra-mbkm'
 * - originRect: { top, left, width, height }
 * - onClose: () => void
 * - analytics: objek hasil pre-komputasi dari halaman (lihat MbkmDataPage)
 * - eligibleCount: number
 */
export const MbkmDetailModal = ({
  metricType,
  originRect,
  onClose,
  analytics = {},
  eligibleCount = 0,
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const raf = requestAnimationFrame(() => setIsAnimating(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => { setIsMounted(false); onClose(); }, 280);
  };

  // Data analitik dari props — tidak ada komputasi di sini
  const {
    activityData = [],
    prodiData = [],
    facultyData = [],
    mitraData = [],
    statusData = [],
    participantStats = { count: 0, selesaiCount: 0, evaluasiCount: 0, berjalanCount: 0 },
    eligibleRate = { percentage: '0.0%', numPercentage: 0 },
  } = analytics;

  const winW = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const winH = typeof window !== 'undefined' ? window.innerHeight : 768;
  const originTop = originRect ? originRect.top + originRect.height / 2 : winH / 2;
  const originLeft = originRect ? originRect.left + originRect.width / 2 : winW / 2;
  const deltaX = originLeft - winW / 2;
  const deltaY = originTop - winH / 2;

  const transformStyle = isAnimating
    ? 'translate(-50%, -50%) scale(1)'
    : `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px)) scale(0.2)`;

  // Konfigurasi header modal — semua menggunakan aksen kuning untuk konsistensi
  const MODAL_CONFIG = {
    'rate-mbkm':         { title: 'Analisis Partisipasi MBKM vs Mahasiswa Eligible', badge: 'MBKM KPI Performance', icon: 'percent', iconBg: 'bg-amber-100 text-amber-900' },
    'active-mbkm':       { title: 'Total Aktivitas MBKM Aktif (Selesai & Evaluasi)', badge: 'MBKM Conversion Registry', icon: 'handshake', iconBg: 'bg-amber-100 text-amber-900' },
    'eligible-students': { title: 'Mahasiswa Eligible Program MBKM (Semester 7)', badge: 'Eligible Senior Cohort', icon: 'how_to_reg', iconBg: 'bg-amber-100 text-amber-900' },
    'mitra-mbkm':        { title: 'Jaringan Mitra Industri & Riset Kolaborasi MBKM', badge: 'Industry & Research Partnerships', icon: 'domain', iconBg: 'bg-amber-100 text-amber-900' },
  };
  const config = MODAL_CONFIG[metricType] || MODAL_CONFIG['rate-mbkm'];

  if (!isMounted) return null;

  return (
    <div
      id="mbkm-detail-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm transition-opacity duration-300"
      style={{ opacity: isAnimating ? 1 : 0 }}
      onClick={(e) => { if (e.target.id === 'mbkm-detail-modal-backdrop') handleClose(); }}
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
        {/* Header modal — aksen kuning (#d97706) seragam dengan semua modal */}
        <div className="p-5 border-b border-surface-container-high flex items-start justify-between bg-surface-container-low/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.iconBg}`}>
              <span className="material-symbols-outlined text-[24px]">{config.icon}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">{config.badge}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                  Kampus Merdeka (NeoAcis)
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
          {metricType === 'rate-mbkm' && (
            <MbkmRateView participantStats={participantStats} eligibleCount={eligibleCount} eligibleRate={eligibleRate} facultyData={facultyData} />
          )}
          {metricType === 'active-mbkm' && (
            <MbkmActiveActivitiesView activityData={activityData} prodiData={prodiData} statusData={statusData} />
          )}
          {metricType === 'eligible-students' && (
            <MbkmEligibleStudentsView eligibleCount={eligibleCount} prodiData={prodiData} />
          )}
          {metricType === 'mitra-mbkm' && (
            <MbkmPartnersView mitraData={mitraData} />
          )}
        </div>

        {/* Footer dengan tombol tutup aksen kuning */}
        <div className="p-4 border-t border-surface-container-high bg-surface-container-low/40 flex items-center justify-end shrink-0">
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

export default MbkmDetailModal;
