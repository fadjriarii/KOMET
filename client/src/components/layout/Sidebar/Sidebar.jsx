import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useDashboardStore } from '@/store/useDashboardStore';
import sidebarLogo from '@/assets/sidebarLogo.png';

/**
 * Komponen Sidebar — Menyediakan navigasi utama aplikasi KOMET Dashboard
 * dengan arsitektur Dual-Wrapper Full-Body Slide Translation:
 * 
 * 1. Fully Collapsed State: Saat `isSidebarOpen: false`, outer wrapper memiliki `width: 0`,
 *    inner wrapper `translateX(-256px)`, dan `opacity-0 pointer-events-none`.
 * 2. Hover to Open (Dynamic Floating Button): Zona hover di tepi kiri layar yang memunculkan
 *    tombol "Open Sidebar" melayang yang dinamis mengikuti koordinat vertikal kursor (`mouseY`).
 * 3. Dual-Wrapper Full-Body Slide:
 *    - Outer Wrapper (`<aside>`): Mengatur alokasi ruang lebar pada layout dashboard (`0px` s/d `256px`).
 *    - Inner Wrapper (`<div>`): Memiliki lebar tetap `w-64` (256px) dan bergeser secara fisik
 *      menggunakan `transform: translateX(...)` sehingga seluruh logo, navigasi, dan icon meluncur mulus
 *      ke kiri tanpa terkompresi atau terpotong.
 * 4. Exact Navbar Alignment: Container logo memiliki tinggi `h-16` dan `border-b` yang sejajar mulus dengan Navbar.
 * 5. Clean Control: Tombol manual collapse dihilangkan sesuai permintaan karena gestur drag, hover zone,
 *    dan tombol logo navbar telah menangani seluruh kendali status buka/tutup.
 *
 * @returns {JSX.Element} Komponen Sidebar
 */
export const Sidebar = () => {
  const isSidebarOpen = useDashboardStore((state) => state.isSidebarOpen);
  const setSidebarOpen = useDashboardStore((state) => state.setSidebarOpen);

  // Status sub-navigasi akordeon "Student Navigation"
  const [isStudentNavExpanded, setIsStudentNavExpanded] = useState(true);

  // State untuk melacak posisi vertikal kursor dan status hover pada trigger zone
  const [mouseY, setMouseY] = useState(152);
  const [isHoveringEdge, setIsHoveringEdge] = useState(false);

  // State & Ref untuk Fluid Drag-to-Close (Full-Body Slide)
  const [isDragging, setIsDragging] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const isDraggingRef = useRef(false);
  const currentWidthRef = useRef(256);

  // Sinkronisasi posisi dan lebar saat status buka/tutup berubah
  useEffect(() => {
    if (isSidebarOpen) {
      setSidebarWidth(256);
      currentWidthRef.current = 256;
    } else {
      setSidebarWidth(0);
      currentWidthRef.current = 0;
    }
  }, [isSidebarOpen]);

  /**
   * Handler pelacak gerakan kursor di zona tepi kiri saat sidebar tertutup.
   */
  const handleEdgeMouseMove = useCallback((e) => {
    setMouseY(e.clientY);
  }, []);

  /**
   * Handler inisiasi fluid drag pada tepi kanan sidebar.
   * Menggeser inner wrapper secara transform translateX bersamaan dengan penyesuaian outer width.
   */
  const handleDragStart = useCallback((e) => {
    e.preventDefault();
    if (e.button !== 0) return; // Hanya klik kiri

    isDraggingRef.current = true;
    setIsDragging(true);
    currentWidthRef.current = 256;

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    const handleMouseMove = (moveEvent) => {
      if (!isDraggingRef.current) return;
      // Posisi X mouse mengontrol lebar outer wrapper dan offset pergeseran inner wrapper
      const newWidth = Math.max(0, Math.min(256, moveEvent.clientX));
      currentWidthRef.current = newWidth;
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      setIsDragging(false);

      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      // Snap & Animate: Jika digeser melewati threshold (< 120px), tutup penuh
      if (currentWidthRef.current < 120) {
        setSidebarOpen(false);
        setSidebarWidth(0);
        currentWidthRef.current = 0;
      } else {
        // Jika dilepas sebelum batas threshold, kembalikan ke posisi terbuka penuh 256px
        setSidebarOpen(true);
        setSidebarWidth(256);
        currentWidthRef.current = 256;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [setSidebarOpen]);

  // Bersihkan event listener jika komponen di-unmount selama drag
  useEffect(() => {
    return () => {
      isDraggingRef.current = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, []);

  // Hitung offset translasi X fisik untuk Inner Wrapper: dari 0px (buka) hingga -256px (tutup)
  const translateXOffset = isSidebarOpen
    ? sidebarWidth - 256
    : -256;

  return (
    <>
      {/* Dynamic Left Edge Hover Trigger & Floating Button saat sidebar tertutup */}
      {!isSidebarOpen && (
        <div
          className="fixed top-16 left-0 w-8 h-[calc(100vh-64px)] z-50 group pointer-events-auto cursor-pointer"
          id="sidebar-hover-zone"
          onMouseEnter={() => setIsHoveringEdge(true)}
          onMouseLeave={() => setIsHoveringEdge(false)}
          onMouseMove={handleEdgeMouseMove}
        >
          {/* Floating Expand Button yang bergerak mengikuti kursor Y */}
          <button
            aria-label="Open Sidebar"
            className={`group/btn fixed left-0 z-50 flex items-center justify-center rounded-r-full rounded-l-none pl-2 pr-3.5 py-3 shadow-xl bg-primary text-white hover:bg-primary-container cursor-pointer transition-transform duration-75 ease-out border border-l-0 border-primary-fixed/30 focus:outline-none ${
              isHoveringEdge
                ? 'opacity-100 scale-100 pointer-events-auto'
                : 'opacity-0 scale-95 pointer-events-none'
            }`}
            id="sidebar-floating-expand-btn"
            style={{
              top: `${Math.max(80, Math.min(window.innerHeight - 60, mouseY))}px`,
              transform: 'translateY(-50%)',
            }}
            title="Open Sidebar"
            type="button"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="material-symbols-outlined text-[18px] shrink-0 transition-transform duration-200 group-hover/btn:translate-x-0.5">
              chevron_right
            </span>
            <span className="text-xs font-semibold whitespace-nowrap overflow-hidden transition-all duration-200 max-w-0 group-hover/btn:max-w-xs group-hover/btn:ml-1.5 opacity-0 group-hover/btn:opacity-100">
              Open Sidebar
            </span>
          </button>
        </div>
      )}

      {/* OUTER WRAPPER: Mengatur lebar ruang layout yang ditempati sidebar */}
      <aside
        className={`sticky top-0 h-screen shrink-0 relative select-none overflow-hidden z-40 ${
          isDragging
            ? 'transition-none'
            : 'transition-all duration-300 ease-in-out'
        } ${
          isSidebarOpen
            ? 'opacity-100 pointer-events-auto'
            : 'w-0 opacity-0 pointer-events-none'
        }`}
        style={{
          width: isSidebarOpen ? `${sidebarWidth}px` : '0px',
        }}
        id="app-sidebar"
      >
        {/* INNER WRAPPER: Badan fisik sidebar dengan lebar tetap 256px yang meluncur via transform: translateX */}
        <div
          className={`w-64 h-full bg-white border-r border-surface-container-high flex flex-col justify-between absolute top-0 left-0 ${
            isDragging
              ? 'transition-none'
              : 'transition-transform duration-300 ease-in-out'
          }`}
          style={{
            transform: `translateX(${translateXOffset}px)`,
          }}
          id="app-sidebar-body"
        >
          {/* Resize / Drag Handle di Tepi Kanan Inner Wrapper */}
          {isSidebarOpen && (
            <div
              aria-label="Drag to resize or close sidebar"
              className="absolute right-0 top-0 w-2.5 h-full cursor-col-resize hover:bg-primary/40 active:bg-primary/60 transition-colors z-50 select-none"
              id="sidebar-drag-handle"
              title="Tarik ke kiri untuk menutup sidebar"
              onMouseDown={handleDragStart}
            />
          )}

          <div className="flex flex-col min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
            {/* Sidebar Logo Container — Memiliki tinggi h-16 dan border-b yang selaras persis dengan Navbar */}
            <div
              className="h-16 px-2 border-b border-surface-container-high flex items-center justify-center shrink-0 overflow-hidden"
              id="sidebar-logo-container"
            >
              <div className="w-full h-full flex items-center justify-center overflow-hidden p-0.5">
                <img
                  alt="i3L KOMET Logo"
                  className="h-full w-auto max-w-full object-contain block shrink-0"
                  id="sidebar-logo-img"
                  src={sidebarLogo}
                />
              </div>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 px-3 pt-2 pb-4 space-y-2 overflow-x-hidden">
              <button
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-surface-container-high/60 transition-colors cursor-pointer select-none text-left group overflow-hidden"
                id="student-nav-toggle"
                type="button"
                onClick={() => setIsStudentNavExpanded((prev) => !prev)}
              >
                <span className="text-[11px] font-semibold text-on-surface-variant tracking-wider uppercase group-hover:text-on-surface transition-colors whitespace-nowrap overflow-hidden text-ellipsis">
                  Student Navigation
                </span>
                <span
                  className={`material-symbols-outlined text-[18px] text-on-surface-variant shrink-0 transition-transform duration-300 ease-in-out ${
                    isStudentNavExpanded ? 'rotate-180' : 'rotate-0'
                  }`}
                  id="student-nav-chevron"
                >
                  expand_more
                </span>
              </button>

              <div
                className={`space-y-1 overflow-hidden transition-all duration-300 ease-in-out pl-3 ${
                  isStudentNavExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
                id="student-nav-links"
              >
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-2.5 py-2 rounded-lg font-medium transition-colors text-sm overflow-hidden ${
                      isActive
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                    }`
                  }
                >
                  <span className="material-symbols-outlined text-[20px] shrink-0">dashboard</span>
                  <span className="font-label-md text-label-md whitespace-nowrap overflow-hidden text-ellipsis">
                    Dashboard
                  </span>
                </NavLink>

                <NavLink
                  to="/student-data"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-2.5 py-2 rounded-lg font-medium transition-colors text-sm overflow-hidden ${
                      isActive
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                    }`
                  }
                >
                  <span className="material-symbols-outlined text-[20px] shrink-0">groups</span>
                  <span className="font-label-md text-label-md whitespace-nowrap overflow-hidden text-ellipsis">
                    Student Data
                  </span>
                </NavLink>

                <NavLink
                  to="/graduate-data"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-2.5 py-2 rounded-lg font-medium transition-colors text-sm overflow-hidden ${
                      isActive
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                    }`
                  }
                >
                  <span className="material-symbols-outlined text-[20px] shrink-0">school</span>
                  <span className="font-label-md text-label-md whitespace-nowrap overflow-hidden text-ellipsis">
                    Graduate Data
                  </span>
                </NavLink>

                <NavLink
                  to="/mbkm-data"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-2.5 py-2 rounded-lg font-medium transition-colors text-sm overflow-hidden ${
                      isActive
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                    }`
                  }
                >
                  <span className="material-symbols-outlined text-[20px] shrink-0">handshake</span>
                  <span className="font-label-md text-label-md whitespace-nowrap overflow-hidden text-ellipsis">
                    MBKM Data
                  </span>
                </NavLink>
              </div>
            </nav>
          </div>

          {/* Sidebar Bottom Section */}
          <div className="flex flex-col gap-space-2xs p-3 border-t border-surface-container-high shrink-0 bg-white overflow-hidden">
            <nav className="flex flex-col gap-1 overflow-hidden">
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-2.5 py-2 rounded-lg font-medium transition-colors text-sm overflow-hidden ${
                    isActive
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[20px] shrink-0">settings</span>
                <span className="font-label-md text-label-md whitespace-nowrap overflow-hidden text-ellipsis">
                  Settings
                </span>
              </NavLink>
            </nav>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
