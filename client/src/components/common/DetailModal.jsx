// Shell modal universal dengan animasi zoom dari kartu asal (macOS-style)
// Props: isOpen, onClose, originRect, title, badge, icon, iconBgClass, verifiedLabel, children
import React, { useEffect, useState } from 'react';

const DetailModal = ({
  isOpen,
  onClose,
  originRect = null,
  title,
  badge,
  icon = 'analytics',
  iconBgClass = 'bg-primary-fixed/60 text-primary',
  verifiedLabel = null,
  children,
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      // Double RAF memastikan transisi CSS berjalan setelah elemen ter-mount
      const r1 = requestAnimationFrame(() => {
        const r2 = requestAnimationFrame(() => setIsAnimating(true));
        return () => cancelAnimationFrame(r2);
      });
      return () => cancelAnimationFrame(r1);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setIsMounted(false), 360);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Tutup saat Escape ditekan
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => { setIsMounted(false); onClose(); }, 320);
  };

  if (!isMounted) return null;

  // Hitung transformasi zoom dari koordinat kartu asal
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 768;
  let transformOpen = 'translate(-50%, -50%) scale(1)';
  let transformClose = 'translate(-50%, -50%) scale(0.88)';
  const opacityClose = 0;

  if (originRect?.width && originRect?.height) {
    const dx = originRect.left + originRect.width / 2 - vw / 2;
    const dy = originRect.top + originRect.height / 2 - vh / 2;
    const modalW = Math.min(vw * 0.94, 992);
    const modalH = Math.min(vh * 0.92, 740);
    const scale = Math.min(Math.max(0.15, originRect.width / modalW), Math.max(0.15, originRect.height / modalH));
    transformClose = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(${scale})`;
  }

  return (
    <div
      id="detail-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm transition-opacity duration-300"
      style={{ opacity: isAnimating ? 1 : opacityClose }}
      onClick={(e) => { if (e.target.id === 'detail-modal-backdrop') handleClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-modal-title"
        style={{
          transform: isAnimating ? transformOpen : transformClose,
          opacity: isAnimating ? 1 : 0,
          transition: 'transform 350ms cubic-bezier(0.16, 1, 0.3, 1), opacity 300ms ease-out',
        }}
        className="fixed top-1/2 left-1/2 w-[min(94vw,62rem)] max-h-[92vh] z-50 bg-surface-container-lowest shadow-2xl rounded-2xl border border-outline-variant/40 overflow-hidden flex flex-col will-change-transform"
      >
        {/* Header modal */}
        <div className="p-5 border-b border-surface-container-high flex items-start justify-between bg-surface-container-low/40 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBgClass}`}>
              <span className="material-symbols-outlined text-[24px]">{icon}</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {badge && (
                  <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">{badge}</span>
                )}
                {verifiedLabel && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                    {verifiedLabel}
                  </span>
                )}
              </div>
              <h3 id="detail-modal-title" className="font-headline-lg text-lg font-bold text-on-surface mt-0.5 leading-snug">
                {title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            aria-label="Tutup modal"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer shrink-0 ml-3"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Konten view dirender oleh halaman masing-masing */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-surface-container-lowest">
          {children}
        </div>

        {/* Footer dengan tombol tutup aksen kuning — seragam di semua modal */}
        <div className="p-4 border-t border-surface-container-high bg-surface-container-low/40 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-outline">Sumber data: PDDIKTI &amp; Sevima Feeder</span>
          <button
            type="button"
            aria-label="Tutup modal"
            onClick={handleClose}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-sm transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailModal;
