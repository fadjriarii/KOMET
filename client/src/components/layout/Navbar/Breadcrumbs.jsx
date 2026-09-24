import { ChevronRight } from 'lucide-react';
import { useNavigation } from '../../../context/useNavigation';

export default function Breadcrumbs() {
  const { activeGroup, activeLabel } = useNavigation();

  return (
    <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs md:text-sm font-medium">
      <span className="text-gray-500 hover:text-gray-800 transition-colors">
        {activeGroup}
      </span>
      <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
      <span className="text-gray-900 font-semibold">
        {activeLabel}
      </span>
    </nav>
  );
}
