import MenuGroup from './MenuGroup';

export default function SidebarNav() {
  return (
    <nav className="flex-1 overflow-y-auto p-4 space-y-2">
      <MenuGroup title="Student Navigation">
        {/* 📍 TEMPAT KUSTOMISASI: Nanti <a> diganti dengan <NavLink> dari react-router-dom */}
        <a 
          href="#" 
          className="px-3.5 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100/70 rounded-lg transition-colors flex items-center gap-2"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-transparent"></span>
          Overview
        </a>
        <a 
          href="#" 
          className="px-3.5 py-2 text-sm font-medium text-digital-blue-700 bg-digital-blue-50/80 rounded-lg transition-colors flex items-center gap-2 font-semibold"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-digital-blue-600"></span>
          Student Data
        </a>
        <a 
          href="#" 
          className="px-3.5 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100/70 rounded-lg transition-colors flex items-center gap-2"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-transparent"></span>
          Graduates
        </a>
        <a 
          href="#" 
          className="px-3.5 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100/70 rounded-lg transition-colors flex items-center gap-2"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-transparent"></span>
          MBKM
        </a>
      </MenuGroup>

      {/* Jika nanti ada grup menu baru, cukup panggil <MenuGroup> lagi di sini */}
    </nav>
  );
}
