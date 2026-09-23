import { ChevronRight } from 'lucide-react';

export default function Breadcrumbs() {
  // 📍 TEMPAT KUSTOMISASI: Nanti gunakan hook seperti useLocation() dari react-router-dom untuk generate path dinamis.
  return (
    <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs md:text-sm font-medium">
      <span className="text-gray-500 hover:text-gray-800 transition-colors cursor-pointer">
        Student
      </span>
      <ChevronRight size={14} className="text-gray-400" />
      <span className="text-gray-900 font-semibold">
        Dashboard
      </span>
    </nav>
  );
}