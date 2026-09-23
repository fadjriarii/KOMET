import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Modal - Reusable Popup / Modal Dialog dengan macOS Quick Look Style Animation & Aesthetics
 * Popup membesar dari titik asal card yang diklik (originRect) dan mengecil kembali ke card saat ditutup.
 * Diposisikan tepat di area konten (antara batas kanan sidebar hingga tepi kanan, dan di bawah navbar).
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-2xl', // max-w-sm | max-w-md | max-w-lg | max-w-xl | max-w-2xl | max-w-4xl
  footer,
  originRect, // { left, top, width, height } koordinat card pemanggil
  showCloseButton = true,
}) {
  const [isRendered, setIsRendered] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const [cachedDelta, setCachedDelta] = useState(null);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && isOpen) {
        onClose?.();
      }
    }

    if (isOpen) {
      // Hitung offset titik tengah card terhadap titik tengah area konten tab
      if (originRect) {
        const portalTarget = document.getElementById('content-modal-root');
        const targetRect = portalTarget
          ? portalTarget.getBoundingClientRect()
          : { left: 0, top: 64, width: window.innerWidth, height: window.innerHeight - 64 };

        const contentCenterX = targetRect.left + targetRect.width / 2;
        const contentCenterY = targetRect.top + targetRect.height / 2;
        const cardCenterX = originRect.left + originRect.width / 2;
        const cardCenterY = originRect.top + originRect.height / 2;

        setCachedDelta({
          dx: Math.round(cardCenterX - contentCenterX),
          dy: Math.round(cardCenterY - contentCenterY),
        });
      }

      setIsRendered(true);
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);

      // Delay 25ms untuk memastikan initial transform terpasang sebelum transisi scale & position
      const timer = setTimeout(() => {
        setIsAnimatingIn(true);
      }, 25);

      return () => {
        clearTimeout(timer);
      };
    } else {
      setIsAnimatingIn(false);
      const timer = setTimeout(() => {
        setIsRendered(false);
      }, 1000); // Durasi 1000ms sesuai preferensi transisi yang sangat halus

      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleKeyDown);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose, originRect]);

  // Clean-up overflow & listener saat unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  if (!isRendered) return null;

  // Style transform dinamis untuk ekspansi/kolaps dari posisi card (macOS Quick Look)
  const initialTransform = cachedDelta
    ? `translate3d(${cachedDelta.dx}px, ${cachedDelta.dy}px, 0) scale(0.25)`
    : 'translate3d(0, -32px, 0) scale(0.92)';

  const activeTransform = 'translate3d(0, 0, 0) scale(1)';

  const modalStyle = {
    transform: isAnimatingIn ? activeTransform : initialTransform,
    opacity: isAnimatingIn ? 1 : 0,
    transition: 'transform 1000ms cubic-bezier(0.16, 1, 0.3, 1), opacity 900ms cubic-bezier(0.16, 1, 0.3, 1)',
  };

  const portalTarget = document.getElementById('content-modal-root') || document.body;

  return createPortal(
    <div className="absolute inset-0 pointer-events-auto flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden select-none">
      {/* Backdrop Blur khusus untuk area konten (Navbar & Sidebar tetap jernih & bebas blur) */}
      <div 
        onClick={(e) => {
          e.stopPropagation();
          onClose?.();
        }}
        aria-hidden="true"
        className={`absolute inset-0 bg-slate-900/35 backdrop-blur-md transition-opacity duration-1000 ease-out ${
          isAnimatingIn ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* macOS Window / Sheet Modal Box (Center di area konten) */}
      <div 
        onClick={(e) => e.stopPropagation()}
        style={modalStyle}
        className={`relative w-full ${maxWidth} bg-white/95 backdrop-blur-xl rounded-2xl md:rounded-3xl border border-white/60 ring-1 ring-black/[0.08] shadow-[0_24px_50px_-12px_rgba(0,0,0,0.3),0_0_0_1px_rgba(0,0,0,0.04)] overflow-hidden z-10 flex flex-col max-h-[82vh] will-change-transform select-auto`}
      >
        {/* Modal Window Header Bar */}
        <div className="px-6 py-4 border-b border-gray-100/90 flex items-center justify-between select-none bg-gradient-to-b from-gray-50/90 to-white">
          <div>
            {title && <h3 className="text-sm md:text-base font-bold text-gray-900 leading-tight">{title}</h3>}
            {subtitle && <p className="text-[11px] text-gray-500 font-medium leading-tight mt-0.5">{subtitle}</p>}
          </div>

          {showCloseButton && (
            <button
              onClick={onClose}
              aria-label="Close popup"
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100/80 active:bg-gray-200/80 rounded-xl transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 text-gray-800 text-sm">
          {children}
        </div>

        {/* Optional Footer */}
        {footer && (
          <div className="px-6 py-3.5 bg-gray-50/80 border-t border-gray-100 flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>

      {/* Helper text di luar bawah popup (English only) */}
      <div 
        className={`mt-3.5 z-10 text-center text-xs font-medium text-white/85 bg-slate-900/50 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/15 shadow-sm transition-opacity duration-1000 ease-out select-none pointer-events-none ${
          isAnimatingIn ? 'opacity-100' : 'opacity-0'
        }`}
      >
        Click outside to exit
      </div>
    </div>,
    portalTarget
  );
}
