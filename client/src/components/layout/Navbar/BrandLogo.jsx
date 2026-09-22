import sidebarLogo from '@/assets/sidebarLogo.png';
import navbarLogo from '@/assets/navbarLogo.png';
import { useDashboardStore } from '@/store/useDashboardStore';

/**
 * Brand logo pada navbar kiri.
 * Logika sesuai konteks file 5 & 6:
 * - Sidebar TERBUKA  -> sidebarLogo.png (logo penuh, ditemani divider)
 * - Sidebar TERTUTUP -> navbarLogo.png (versi ringkas untuk rail)
 */
export const BrandLogo = () => {
  const sidebarOpen = useDashboardStore((s) => s.sidebarOpen);

  return (
    <div className="flex shrink-0 items-center">
      <img
        src={sidebarOpen ? sidebarLogo : navbarLogo}
        alt={sidebarOpen ? 'i3L KOMET Logo' : 'KOMET Logo'}
        className={sidebarOpen ? 'block h-11 w-auto object-contain' : 'block h-10 w-auto object-contain'}
      />
      {/* Divider vertikal hanya saat mode terbuka, sesuai code.html */}
      {sidebarOpen && <div className="ml-4 hidden h-6 w-px bg-slate-300 sm:block" />}
    </div>
  );
};
