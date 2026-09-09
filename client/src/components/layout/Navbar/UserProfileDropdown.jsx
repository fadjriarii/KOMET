import { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Profil pengguna dummy untuk fase mock (belum ada autentifikasi backend). */
const MOCK_USER = {
  initials: 'HS',
  name: 'Dr. Ir. Hendra S., M.Sc.',
  role: 'Academic Directorate',
  email: 'hendra.soelistyo@i3l.ac.id',
};

/** Daftar aksi pada dropdown profil (teks UI Bahasa Inggris). */
const PROFILE_ACTIONS = [
  { key: 'account', label: 'Account Management', icon: Settings2 },
];

/**
 * Dropdown profil pengguna pada navbar kanan.
 * Membuka panel melayang (elevasi Level 3) berisi identitas, aksi akun,
 * dan tombol Sign Out. Klik di luar area akan menutup dropdown.
 */
export const UserProfileDropdown = () => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Menutup dropdown saat pengguna mengklik di luar komponen.
  useEffect(() => {
    if (!open) return undefined;

    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-3 border-l border-surface-container-high bg-transparent p-0 pl-3 text-left transition-opacity hover:opacity-90"
      >
        {/* Avatar inisial dengan ring lembut berwarna primary */}
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-on-primary shadow-sm ring-2 ring-primary/20">
          {MOCK_USER.initials}
        </span>
        <span className="hidden flex-col text-left md:flex">
          <span className="font-label-md text-label-md font-semibold leading-tight text-on-surface">
            {MOCK_USER.name}
          </span>
          <span className="mt-0.5 text-[11px] leading-none text-on-surface-variant">
            {MOCK_USER.role}
          </span>
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-outline transition-transform duration-200',
            open && 'rotate-180',
          )}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-card border border-[#E2E8F0] bg-white shadow-level-3"
        >
          {/* Header identitas */}
          <div className="border-b border-surface-container-high bg-surface-container-low p-3.5">
            <div className="text-xs font-semibold leading-snug text-on-surface">
              {MOCK_USER.name}
            </div>
            <div className="mt-0.5 truncate text-[11px] leading-tight text-on-surface-variant">
              {MOCK_USER.email}
            </div>
          </div>

          {/* Aksi akun */}
          <div className="space-y-0.5 p-1.5">
            {PROFILE_ACTIONS.map(({ key, label, icon: Icon }) => (
              <a
                key={key}
                href="#"
                role="menuitem"
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-on-surface transition-colors hover:bg-surface-container-low hover:text-primary"
              >
                <Icon className="h-[18px] w-[18px] text-outline" aria-hidden="true" />
                {label}
              </a>
            ))}
          </div>

          {/* Sign out */}
          <div className="border-t border-surface-container-high p-1.5">
            <a
              href="#"
              role="menuitem"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-error transition-colors hover:bg-error-container/40"
            >
              <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
              Sign Out
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
