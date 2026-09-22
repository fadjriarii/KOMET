import { Outlet, useLocation } from 'react-router-dom';
import { useDashboardStore } from '@/store/useDashboardStore';
import { Sidebar } from '../Sidebar/Sidebar';
import { Navbar } from '../Navbar/Navbar';
import { Footer } from '../Footer/Footer';

/**
 * Komponen MainLayout — Pembungkus tata letak utama aplikasi KOMET Dashboard
 * yang dikonversi langsung dari struktur `code.html`.
 * 
 * Struktur Layout:
 * - `<Sidebar />` di render pada posisi sticky di sisi kiri mulai dari top: 0.
 * - Sisi kanan berisi `<Navbar />` dan `<main>` yang merender `{children || <Outlet />}`.
 * - `<Footer />` berada di bagian paling bawah dan dinonaktifkan khusus untuk halaman Dashboard ('/').
 *
 * @param {Object} props
 * @param {React.ReactNode} [props.children] - Konten halaman yang dirender di dalam layout.
 * @param {boolean} [props.showFooter] - Override eksplisit untuk visibilitas footer.
 * @returns {JSX.Element} Elemen JSX MainLayout
 */
export const MainLayout = ({ children, showFooter }) => {
  const location = useLocation();
  const isStudentDataPage = location.pathname === '/student-data';
  const isGraduateDataPage = location.pathname === '/graduate-data';
  const isMbkmDataPage = location.pathname === '/mbkm-data';

  // Footer disembunyikan di halaman dashboard ('/'), Student Data ('/student-data'), Graduate Data ('/graduate-data'), dan MBKM Data ('/mbkm-data')
  const shouldRenderFooter = showFooter ?? (location.pathname !== '/' && !isStudentDataPage && !isGraduateDataPage && !isMbkmDataPage);

  return (
    <div className="bg-background font-body-md text-on-surface antialiased min-h-screen flex flex-col">
      {/* Middle Layout Body: Sidebar (Full dari paling atas) + Right Area (Navbar + Main Content) */}
      <div className="flex-1 flex relative w-full items-stretch">
        {/* Sticky Sidebar Component - Starts from top:0 */}
        <Sidebar />

        {/* Right Content Area: Navbar di atas Main Content */}
        <div className="flex-1 min-w-0 flex flex-col transition-all duration-300 ease-in-out">
          {/* Top Navbar */}
          <Navbar />

          {/* Main Content Dashboard Area */}
          <main
            className="flex-1 min-w-0 bg-background px-margin-desktop py-space-lg"
            id="main-content-wrapper"
          >
            {children || <Outlet />}
          </main>
        </div>
      </div>

      {/* Full-width Footer Area across entire bottom (hanya tampil jika diizinkan) */}
      {shouldRenderFooter && <Footer />}
    </div>
  );
};



