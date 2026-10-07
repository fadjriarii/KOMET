import { ChevronRight } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { NAV_ITEMS } from '../../../constants/navigation';

export default function Breadcrumbs() {
  const { pathname } = useLocation();
  const current = NAV_ITEMS.find((item) => item.path === pathname);

  return (
    <nav
      aria-label="Breadcrumb"
      className="hidden sm:flex items-center gap-1.5 text-xs md:text-sm font-medium"
    >
      <span className="text-gray-500 hover:text-gray-800 transition-colors">
        {current?.group ?? NAV_ITEMS[0].group}
      </span>
      <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
      <span className="text-gray-900 font-semibold">
        {current?.label ?? 'Halaman Tidak Dikenal'}
      </span>
    </nav>
  );
}
