import { useEffect, useState } from 'react';
import Navbar from './Navbar/Navbar';
import Sidebar from './Sidebar/Sidebar';

const DESKTOP_QUERY = '(min-width: 1024px)';

function isDesktopViewport() {
  return typeof window === 'undefined' || !window.matchMedia
    ? true
    : window.matchMedia(DESKTOP_QUERY).matches;
}

export default function MainLayout({ children }) {
  const [isDesktop, setIsDesktop] = useState(isDesktopViewport);
  // Di bawah lg sidebar adalah drawer: tidak mendorong konten dan mulai tertutup.
  const [isSidebarOpen, setIsSidebarOpen] = useState(isDesktopViewport);
  const [dragWidth, setDragWidth] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const media = window.matchMedia(DESKTOP_QUERY);
    const handleChange = (event) => {
      setIsDesktop(event.matches);
      if (!event.matches) setIsSidebarOpen(false);
    };
    media.addEventListener?.('change', handleChange);
    return () => media.removeEventListener?.('change', handleChange);
  }, []);

  // Lebar aktif untuk margin konten. Di mobile drawer tidak pernah mendorong konten.
  const currentSidebarWidth = !isDesktop
    ? 0
    : isDragging
      ? (dragWidth ?? 0)
      : isSidebarOpen
        ? 256
        : 0;

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-gray-50">
      {/* Navbar di bagian atas full width */}
      <Navbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
      />

      {/* Container di bawah Navbar */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar di sisi kiri (z-40 menimpa navbar dan konten saat drawer mobile) */}
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          isDesktop={isDesktop}
          dragWidth={dragWidth}
          setDragWidth={setDragWidth}
          isDragging={isDragging}
          setIsDragging={setIsDragging}
        />

        {/* Konten Utama Aplikasi: Menyesuaikan margin dengan transisi 1000ms tanpa menggeser Navbar */}
        <main
          style={{
            marginLeft: `${currentSidebarWidth}px`,
            transition: isDragging ? 'none' : 'margin-left 1000ms ease-in-out',
          }}
          className="flex-1 overflow-y-auto p-4 sm:p-6 min-w-0"
        >
          {children}
        </main>

        {/* Modal Portal Root Khusus Area Konten (Center di antara Sidebar & Sisi Kanan, di bawah Navbar) */}
        <div
          id="content-modal-root"
          style={{
            left: `${currentSidebarWidth}px`,
            transition: isDragging ? 'none' : 'left 1000ms ease-in-out',
          }}
          className="absolute top-0 bottom-0 right-0 z-20 pointer-events-none"
        />
      </div>
    </div>
  );
}
