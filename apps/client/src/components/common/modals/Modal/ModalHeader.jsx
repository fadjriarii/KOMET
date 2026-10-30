import { X } from 'lucide-react';

/** Bar header sheet modal: judul + subtitle + tombol tutup. */
export function ModalHeader({ title, titleId, subtitle, showCloseButton, onClose }) {
  return (
    <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100/90 flex items-center justify-between gap-3 select-none bg-gradient-to-b from-gray-50/90 to-white shrink-0">
      <div>
        {title && (
          <h3 id={titleId} className="text-sm md:text-base font-bold text-gray-900 leading-tight">
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="text-[11px] text-gray-500 font-medium leading-tight mt-0.5">{subtitle}</p>
        )}
      </div>

      {showCloseButton && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup popup"
          className="max-sm:inline-flex max-sm:items-center max-sm:justify-center max-sm:w-11 max-sm:h-11 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100/80 active:bg-gray-200/80 rounded-xl transition-all cursor-pointer"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
