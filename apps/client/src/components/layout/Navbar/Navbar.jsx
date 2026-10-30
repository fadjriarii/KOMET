import { Menu } from 'lucide-react';
import logoNavbar from '../../../assets/KOMET.webp';
import Breadcrumbs from './Breadcrumbs';
import UserProfile from './UserProfile';

export default function Navbar({ isSidebarOpen, onToggleSidebar }) {
  return (
    <header className="h-16 bg-white text-gray-800 flex items-center justify-between pr-3 sm:pr-4 lg:pr-6 pl-0 border-b border-gray-200/80 z-30 select-none w-full relative">
      {/* Sisi Kiri: Menu mobile, Logo Navbar, dan Breadcrumbs */}
      <div className="flex items-center h-full min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? 'Tutup menu' : 'Buka menu'}
          aria-expanded={isSidebarOpen}
          aria-controls="app-sidebar"
          className="lg:hidden inline-flex items-center justify-center w-11 h-11 ml-1 sm:ml-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200/70 transition-colors cursor-pointer flex-shrink-0"
        >
          <Menu size={20} />
        </button>

        {/* Di layar kecil logo cukup selebar isinya (tanpa garis pemisah, karena
            breadcrumb baru muncul di sm); di desktop tetap selebar sidebar. */}
        <div className="w-28 sm:w-48 lg:w-64 h-16 flex items-center justify-center px-2 sm:px-3 sm:border-r border-gray-100 flex-shrink-0">
          <img
            src={logoNavbar}
            alt="KOMET Logo"
            className="h-8 sm:h-9 lg:h-10 w-auto object-contain max-w-full"
          />
        </div>

        {/* Breadcrumbs dengan posisi fix tidak pernah bergeser */}
        <div className="hidden sm:block pl-4 lg:pl-6 min-w-0 flex-1 overflow-hidden">
          <Breadcrumbs />
        </div>
      </div>

      {/* Sisi Kanan: Profile & Actions */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <UserProfile />
      </div>
    </header>
  );
}
