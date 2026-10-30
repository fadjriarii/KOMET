import { X } from 'lucide-react';
import logoSidebar from '../../../assets/I3L-KOMET.webp';

export default function SidebarLogo({ onClose }) {
  return (
    <div className="relative h-16 flex items-center justify-center border-b border-gray-100 bg-white flex-shrink-0 px-1 py-1">
      <img src={logoSidebar} alt="i3L KOMET Logo" className="h-full w-full object-contain" />
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup menu"
          className="lg:hidden absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-11 h-11 rounded-xl bg-white/90 text-gray-500 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200/70 shadow-sm transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}
