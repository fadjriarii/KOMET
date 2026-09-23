import { useState, useRef, useEffect } from 'react';
import { ChevronDown, User, LogOut, ShieldCheck } from 'lucide-react';

export default function UserProfile() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // 📍 TEMPAT KUSTOMISASI: Nanti ganti dengan data dari Context (misal: AuthContext) atau hasil fetch API.
  const userFullName = "Dr. Ir. Hendra S., M.Sc.";
  const userRole = "Administrator";
  const userInitials = "HS";

  // Tutup dropdown saat klik di luar elemen dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        aria-expanded={isDropdownOpen}
        aria-haspopup="true"
        className="flex items-center gap-2.5 p-1.5 pl-2 pr-3 rounded-full hover:bg-gray-100 active:bg-gray-200/70 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-digital-blue-500/20"
      >
        {/* Avatar dengan warna digital-blue-600 sebagai brand accent */}
        <div className="w-8 h-8 rounded-full bg-digital-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
          {userInitials}
        </div>

        <div className="hidden md:flex flex-col text-left">
          <span className="text-xs font-semibold text-gray-800 leading-tight">{userFullName}</span>
          <span className="text-[10px] text-gray-500 font-normal leading-tight">{userRole}</span>
        </div>

        <ChevronDown 
          size={14} 
          className={`text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-100 rounded-xl shadow-xl py-1.5 z-50 text-gray-800 transition-all animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-900 truncate">{userFullName}</p>
            <p className="text-[11px] text-gray-500">{userRole}</p>
          </div>
          
          <div className="py-1">
            <button 
              onClick={() => setIsDropdownOpen(false)}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-digital-blue-50 hover:text-digital-blue-700 transition-colors cursor-pointer"
            >
              <User size={15} className="text-gray-500" />
              <span>Profil Pengguna</span>
            </button>
            <button 
              onClick={() => setIsDropdownOpen(false)}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-digital-blue-50 hover:text-digital-blue-700 transition-colors cursor-pointer"
            >
              <ShieldCheck size={15} className="text-gray-500" />
              <span>Keamanan & Akun</span>
            </button>
          </div>

          <div className="border-t border-gray-100 pt-1">
            <button 
              onClick={() => setIsDropdownOpen(false)}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <LogOut size={15} />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}