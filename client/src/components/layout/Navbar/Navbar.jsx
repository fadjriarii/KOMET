import { useEffect, useRef, useState, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useDashboardStore } from '@/store/useDashboardStore';
import navbarLogo from '@/assets/navbarLogo.png';

/**
 * Komponen Navbar — Dikonversi secara presisi dan fungsional dari `<header>` pada `code.html`.
 * 
 * Interaktivitas & Fungsionalitas:
 * - Animasi live progress radial Sevima Cloud Sync (0% -> 100%) dengan status dinamis.
 * - Penutupan dropdown (Sync, Notifikasi, User Profile) saat klik di luar area (click outside).
 * - Transisi logo adaptif saat sidebar dibuka/ditutup.
 * - Breadcrumb dinamis yang mengikuti rute aktif (Dashboard, Student Data, Graduate Data, MBKM Data).
 *
 * @returns {JSX.Element} Komponen Navbar
 */
export const Navbar = () => {
  const isSidebarOpen = useDashboardStore((state) => state.isSidebarOpen);
  const toggleSidebar = useDashboardStore((state) => state.toggleSidebar);
  const location = useLocation();

  // Pemetaan rute ke label breadcrumb dinamis
  const currentBreadcrumb = useMemo(() => {
    const path = location.pathname;
    if (path === '/student-data') {
      return { section: 'Student', page: 'Student Data', path: '/student-data' };
    }
    if (path === '/graduate-data') {
      return { section: 'Student', page: 'Graduate Data', path: '/graduate-data' };
    }
    if (path === '/mbkm-data') {
      return { section: 'Student', page: 'MBKM Data', path: '/mbkm-data' };
    }
    if (path === '/settings') {
      return { section: 'System', page: 'Settings', path: '/settings' };
    }
    return { section: 'Student', page: 'Dashboard', path: '/' };
  }, [location.pathname]);

  // Status popover & simulasi sinkronisasi Sevima
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [syncProgress, setSyncProgress] = useState(100);
  const [syncStatusText, setSyncStatusText] = useState('Sinkronisasi Berhasil!');
  const [syncDetailText, setSyncDetailText] = useState('Data KOMET terbarui dengan PDDIKTI & Sevima.');

  // Status dropdown notifikasi & profil
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const syncWrapperRef = useRef(null);
  const notificationWrapperRef = useRef(null);
  const profileWrapperRef = useRef(null);

  // Click outside listener untuk menutup popover
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (syncWrapperRef.current && !syncWrapperRef.current.contains(event.target)) {
        setIsSyncModalOpen(false);
      }
      if (notificationWrapperRef.current && !notificationWrapperRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
      if (profileWrapperRef.current && !profileWrapperRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handler simulasi proses Sevima Sync sesuai code.html
  const handleTriggerSync = () => {
    if (isSyncing) {
      setIsSyncModalOpen((prev) => !prev);
      return;
    }

    setIsSyncing(true);
    setIsSynced(false);
    setIsSyncModalOpen(true);
    setSyncProgress(0);
    setSyncStatusText('Menyinkronkan data Sevima API...');
    setSyncDetailText('Mengambil data mahasiswa & PDDIKTI...');

    let current = 0;
    const interval = setInterval(() => {
      current += 4;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setSyncProgress(100);
        setIsSyncing(false);
        setIsSynced(true);
        setSyncStatusText('Sinkronisasi Berhasil!');
        setSyncDetailText('Data KOMET terbarui dengan PDDIKTI & Sevima.');
        setTimeout(() => setIsSynced(false), 4500);
      } else {
        setSyncProgress(current);
        if (current > 35 && current <= 70) {
          setSyncStatusText('Memproses konversi data MBKM & IKU...');
          setSyncDetailText('Sinkronisasi 386 catatan peserta & registrasi...');
        } else if (current > 70) {
          setSyncStatusText('Memvalidasi kelulusan & IPK alumni...');
          setSyncDetailText('Memperbarui metrik mutu akademik S1 & S2...');
        }
      }
    }, 50);
  };

  return (
    <header className="sticky top-0 z-30 bg-surface-container-lowest border-b border-surface-container-high px-8 h-16 flex items-center justify-between shadow-sm transition-all duration-300">
      {/* Navbar Left: Collapsed Logo & Breadcrumb */}
      <div className="flex items-center gap-4 min-w-0">
        {!isSidebarOpen && (
          <div
            className="transition-opacity duration-300 flex items-center shrink-0 opacity-100"
            id="navbar-brand-logo"
          >
            <button
              type="button"
              onClick={toggleSidebar}
              className="flex items-center gap-2 cursor-pointer focus:outline-none"
              title="Open Sidebar"
            >
              <img
                alt="KOMET Logo"
                className="h-10 md:h-11 w-auto object-contain block"
                src={navbarLogo}
              />
            </button>
            <div className="h-6 w-px bg-slate-300 ml-4 hidden sm:block"></div>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
          <Link to="/" className="hover:text-primary transition-colors cursor-pointer">
            {currentBreadcrumb.section}
          </Link>
          <span className="material-symbols-outlined text-[14px] text-outline select-none">chevron_right</span>
          <span className="text-on-surface font-semibold">
            {currentBreadcrumb.page}
          </span>
        </div>
      </div>

      {/* Navbar Right: Sync, Notifications, Profile */}
      <div className="flex items-center gap-3 relative">
        {/* Sync Sevima Button & Container */}
        <div className="relative" id="sync-wrapper" ref={syncWrapperRef}>
          <button
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition shadow-sm cursor-pointer ${
              isSynced
                ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                : isSyncing
                ? 'border-primary text-primary bg-primary-fixed/20'
                : 'border-surface-container-high bg-white hover:bg-surface-container-low text-slate-700 hover:border-primary/40 active:scale-95'
            }`}
            id="sevima-sync-btn"
            type="button"
            onClick={handleTriggerSync}
          >
            {isSyncing ? (
              <div className="relative w-4 h-4 flex items-center justify-center">
                <svg className="w-4 h-4 -rotate-90" viewBox="0 0 24 24">
                  <circle
                    className="text-surface-container-high"
                    cx="12"
                    cy="12"
                    fill="none"
                    r="9"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  />
                  <circle
                    className="text-primary transition-all duration-150 ease-out"
                    cx="12"
                    cy="12"
                    fill="none"
                    r="9"
                    stroke="currentColor"
                    strokeDasharray="56.54"
                    strokeDashoffset={56.54 - 56.54 * (syncProgress / 100)}
                    strokeLinecap="round"
                    strokeWidth="2.5"
                  />
                </svg>
              </div>
            ) : (
              <span
                className={`material-symbols-outlined text-[16px] ${
                  isSynced ? 'text-emerald-600' : 'text-primary'
                }`}
                id="sevima-btn-icon"
              >
                {isSynced ? 'check_circle' : 'sync'}
              </span>
            )}
            <span id="sevima-btn-label">
              {isSyncing ? 'Syncing...' : isSynced ? 'Tersinkron' : 'Sync Sevima'}
            </span>
          </button>

          {/* Sevima Sync Modal */}
          {isSyncModalOpen && (
            <div
              className="absolute top-12 left-0 z-50 w-80 p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-xl flex flex-col gap-3 transition-all duration-300 animate-in fade-in slide-in-from-top-2"
              id="sevima-sync-modal"
            >
              <div className="flex items-center justify-between border-b border-surface-container-high pb-2.5">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                    API Integration
                  </span>
                  <h4 className="font-headline-sm text-xs font-bold text-on-surface">
                    Sevima Cloud Sync
                  </h4>
                </div>
                <button
                  className="text-outline hover:text-on-surface text-sm p-1 rounded-md hover:bg-surface-container transition-colors cursor-pointer"
                  id="sevima-close-modal"
                  type="button"
                  onClick={() => setIsSyncModalOpen(false)}
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>

              <div className="flex items-center gap-4 py-1.5">
                <div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-surface-container-high"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeDasharray="100, 100"
                      strokeWidth="3.2"
                    />
                    <path
                      className={
                        syncProgress >= 100
                          ? 'text-emerald-500 transition-all duration-300'
                          : 'text-primary transition-all duration-100 ease-out'
                      }
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      id="sevima-modal-progress"
                      stroke="currentColor"
                      strokeDasharray={`${syncProgress.toFixed(1)}, 100`}
                      strokeLinecap="round"
                      strokeWidth="3.2"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span
                      className="font-headline-sm text-xs font-extrabold text-on-surface"
                      id="sevima-modal-pct"
                    >
                      {Math.round(syncProgress)}%
                    </span>
                  </div>
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <span
                    className={`text-xs font-semibold leading-snug ${
                      syncProgress >= 100 ? 'text-emerald-600' : 'text-on-surface'
                    }`}
                    id="sevima-modal-status"
                  >
                    {syncStatusText}
                  </span>
                  <span
                    className="text-[11px] text-on-surface-variant mt-0.5 leading-tight"
                    id="sevima-modal-detail"
                  >
                    {syncDetailText}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-outline pt-2 border-t border-surface-container-high">
                <span>Endpoint: api.sevima.i3l.ac.id</span>
                <span
                  className="font-semibold text-primary flex items-center gap-1"
                  id="sevima-sync-state"
                >
                  {syncProgress >= 100 ? (
                    <>
                      <span className="material-symbols-outlined text-sm text-emerald-600">
                        check_circle
                      </span>
                      <span className="text-emerald-600 font-semibold">Tersinkronisasi</span>
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
                      <span className="text-primary font-semibold">Live Sync</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative" id="notification-wrapper" ref={notificationWrapperRef}>
          <button
            aria-label="Notifications"
            className="relative p-2 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors flex items-center justify-center cursor-pointer"
            id="notification-bell-btn"
            type="button"
            onClick={() => {
              setIsNotificationOpen((prev) => !prev);
              setIsProfileOpen(false);
              setIsSyncModalOpen(false);
            }}
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error ring-2 ring-surface-container-lowest"></span>
          </button>

          {isNotificationOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-96 z-50 bg-white rounded-2xl shadow-2xl border border-surface-container-high overflow-hidden animate-in fade-in slide-in-from-top-2"
              id="notification-dropdown"
            >
              <div className="p-4 bg-surface-container-lowest border-b border-surface-container-high flex items-start justify-between gap-2">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h4 className="font-headline-sm text-sm font-bold text-on-surface">
                      Riwayat Sinkronisasi
                    </h4>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                      3 Log Baru
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-0.5 leading-tight">
                    Catatan sinkronisasi data Sevima & PDDIKTI
                  </p>
                </div>
                <button
                  className="text-[11px] font-semibold text-primary hover:text-primary-container transition-colors cursor-pointer"
                  type="button"
                  onClick={() => setIsNotificationOpen(false)}
                >
                  Tandai Dibaca
                </button>
              </div>

              <div className="max-h-[340px] overflow-y-auto divide-y divide-surface-container-high/60">
                <div className="p-3.5 hover:bg-surface-container-low transition-colors flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-xs text-on-surface">
                        Sinkronisasi Sevima Feeder Berhasil
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant mt-1 leading-snug">
                      Sinkronisasi 4,218 data mahasiswa & status registrasi Semester Ganjil 2025/2026.
                    </p>
                    <div className="flex flex-col gap-0.5 mt-1.5 text-[10px] text-outline">
                      <span className="font-medium text-slate-700">
                        Oleh: Dr. Ir. Hendra S., M.Sc. (Academic Directorate)
                      </span>
                      <span>Hari ini, 10:42 WIB</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 hover:bg-surface-container-low transition-colors flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-fixed/50 flex items-center justify-center text-primary flex-shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[18px]">sync</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-xs text-on-surface">
                        Sinkronisasi Data Kelulusan (PDDIKTI)
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant mt-1 leading-snug">
                      Pembaruan 892 data kelulusan & yudisium cohort 2020-2024.
                    </p>
                    <div className="flex flex-col gap-0.5 mt-1.5 text-[10px] text-outline">
                      <span className="font-medium text-slate-700">
                        Oleh: BAAK System Scheduler (Auto-Sync)
                      </span>
                      <span>Kemarin, 23:15 WIB</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 hover:bg-surface-container-low transition-colors flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-tertiary flex-shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[18px]">published_with_changes</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-xs text-on-surface">
                        Sinkronisasi Data MBKM & Mitra
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant mt-1 leading-snug">
                      386 data konversi SKS & laporan magang/pertukaran pelajar.
                    </p>
                    <div className="flex flex-col gap-0.5 mt-1.5 text-[10px] text-outline">
                      <span className="font-medium text-slate-700">
                        Oleh: Sari Wulandari, S.Kom. (Subbag Akademik)
                      </span>
                      <span>28 Agu 2025, 14:20 WIB</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-surface-container-low border-t border-surface-container-high flex items-center justify-between text-xs">
                <span className="font-semibold text-primary hover:text-primary-container transition-colors inline-flex items-center gap-1 cursor-pointer">
                  Lihat Semua Audit Log
                  <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                </span>
                <button
                  className="px-2.5 py-1 rounded-md text-outline hover:bg-surface-container-high text-xs font-semibold transition-colors cursor-pointer"
                  id="notification-close-btn"
                  type="button"
                  onClick={() => setIsNotificationOpen(false)}
                >
                  Tutup
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative" id="profile-wrapper" ref={profileWrapperRef}>
          <button
            className="flex items-center gap-3 pl-3 border-l border-surface-container-high cursor-pointer hover:opacity-90 transition-opacity bg-transparent p-0 border-t-0 border-r-0 border-b-0 text-left"
            id="user-profile-btn"
            type="button"
            onClick={() => {
              setIsProfileOpen((prev) => !prev);
              setIsNotificationOpen(false);
              setIsSyncModalOpen(false);
            }}
          >
            <div className="w-8 h-8 rounded-full bg-primary text-on-primary font-bold text-xs flex items-center justify-center ring-2 ring-primary/20 shadow-sm">
              HS
            </div>
            <div className="flex flex-col text-left">
              <span className="font-label-md text-label-md text-on-surface leading-tight font-semibold">
                Dr. Ir. Hendra S., M.Sc.
              </span>
              <span className="text-[11px] text-on-surface-variant leading-none mt-0.5">
                Academic Directorate
              </span>
            </div>
            <span className="material-symbols-outlined text-outline text-base">expand_more</span>
          </button>

          {isProfileOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-64 z-50 bg-white rounded-xl shadow-xl border border-surface-container-high overflow-hidden animate-in fade-in slide-in-from-top-2"
              id="user-profile-dropdown"
            >
              <div className="p-3.5 bg-surface-container-low border-b border-surface-container-high">
                <div className="font-semibold text-xs text-on-surface leading-snug">
                  Dr. Ir. Hendra S., M.Sc.
                </div>
                <div className="text-[11px] text-on-surface-variant leading-tight truncate mt-0.5">
                  hendra.soelistyo@i3l.ac.id
                </div>
              </div>
              <div className="p-1.5 space-y-0.5">
                <a
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-on-surface hover:bg-surface-container-low hover:text-primary transition-colors"
                  href="#/settings"
                  onClick={() => setIsProfileOpen(false)}
                >
                  <span className="material-symbols-outlined text-[18px] text-outline">
                    manage_accounts
                  </span>
                  <span>Management Akun</span>
                </a>
              </div>
              <div className="p-1.5 border-t border-surface-container-high">
                <button
                  type="button"
                  className="flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-error hover:bg-error-container/40 transition-colors text-left cursor-pointer"
                  onClick={() => setIsProfileOpen(false)}
                >
                  <span className="material-symbols-outlined text-[18px] text-error">logout</span>
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};


