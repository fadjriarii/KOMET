import { create } from 'zustand';

/**
 * Store global Zustand untuk mengelola state dasbor dan tata letak aplikasi KOMET.
 * Menyimpan status pembukaan sidebar (terbuka atau tertutup/collapse) yang
 * dikonsumsi bersama oleh MainLayout, Sidebar, dan Navbar (BrandLogo).
 *
 * @typedef {Object} DashboardState
 * @property {boolean} isSidebarOpen - Menandakan apakah sidebar dalam posisi terbuka (true) atau tertutup (false).
 * @property {() => void} toggleSidebar - Aksi untuk membalikkan (toggle) status isSidebarOpen.
 * @property {(open: boolean) => void} setSidebarOpen - Aksi untuk menetapkan status isSidebarOpen secara eksplisit.
 */
export const useDashboardStore = create((set) => ({
  /** Status keterbukaan sidebar: true = terbuka (w-64), false = tertutup (collapsed) */
  isSidebarOpen: true,

  /**
   * Mengubah status keterbukaan sidebar menjadi kebalikannya.
   */
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  /**
   * Menetapkan status keterbukaan sidebar secara eksplisit.
   * @param {boolean} open - Nilai boolean status sidebar yang diinginkan.
   */
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
}));


