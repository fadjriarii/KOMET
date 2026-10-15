import { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useOriginDelta } from './useOriginDelta';
import { useModalLifecycle } from './useModalLifecycle';
import { modalStyle } from './modalStyle';
import { ModalHeader } from './ModalHeader';

/**
 * Modal - Reusable Popup / Modal Dialog dengan Quick Look Style Animation & Aesthetics
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
  height = 'h-[78vh] min-h-[500px] max-h-[82vh]',
  footer,
  originRect, // { left, top, width, height } koordinat card pemanggil
  showCloseButton = false,
}) {
  const panelRef = useRef(null);
  const titleId = useId();
  const originDelta = useOriginDelta(originRect);
  const { isRendered, isAnimatingIn } = useModalLifecycle(isOpen, onClose, panelRef);

  if (!isRendered) return null;

  const style = modalStyle(isAnimatingIn, originDelta);
  const portalTarget = document.getElementById('content-modal-root') || document.body;

  return createPortal(
    <div
      onClick={() => onClose?.()}
      className="absolute inset-0 pointer-events-auto flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden select-none z-50"
    >
      {/* Backdrop Blur khusus untuk area konten */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 bg-slate-900/35 backdrop-blur-md transition-opacity duration-700 ease-out pointer-events-none ${
          isAnimatingIn ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Wrapper Animasi Popup + Helper Text */}
      <div
        style={style}
        className={`relative w-full ${maxWidth} flex flex-col items-center will-change-transform z-10 pointer-events-none`}
      >
        {/* Sheet Modal Box */}
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          aria-label={title ? undefined : 'Rincian data'}
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
          className={`w-full ${height} pointer-events-auto bg-white/95 backdrop-blur-xl rounded-2xl md:rounded-3xl border border-white/60 ring-1 ring-black/[0.08] shadow-[0_24px_50px_-12px_rgba(0,0,0,0.3),0_0_0_1px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col select-auto outline-none`}
        >
          {/* Modal Window Header Bar */}
          <ModalHeader
            title={title}
            titleId={titleId}
            subtitle={subtitle}
            showCloseButton={showCloseButton}
            onClose={onClose}
          />

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto custom-scrollbar scroll-smooth flex-1 text-gray-800 text-sm flex flex-col">
            {children}
          </div>

          {/* Optional Footer */}
          {footer && (
            <div className="px-6 py-3.5 bg-gray-50/80 border-t border-gray-100 flex items-center justify-end gap-2.5 shrink-0">
              {footer}
            </div>
          )}
        </div>

        {/* Helper text di luar bawah popup */}
        <button
          type="button"
          onClick={() => onClose?.()}
          className="mt-2 text-center text-[11px] font-medium text-white/80 hover:text-white bg-slate-900/30 hover:bg-slate-900/45 backdrop-blur-sm px-3.5 py-1 rounded-full border border-white/10 shadow-xs select-none pointer-events-auto transition-all cursor-pointer"
        >
          Click outside to close
        </button>
      </div>
    </div>,
    portalTarget,
  );
}
