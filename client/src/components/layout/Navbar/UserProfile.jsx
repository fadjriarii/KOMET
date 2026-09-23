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
          className={`text-gray-400 transition-transform duration-1000 ease-out ${isDropdownOpen ? 'rotate-180 text-digital-blue-600' : ''}`} 
        />
      </button>

      {/* Dropdown Menu dengan animasi halus 1000ms standar modern 2025/2026 */}
      <div 
        className={`absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-md border border-gray-100/90 rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.04)] py-1.5 z-50 text-gray-800 origin-top-right transition-all duration-500 ease-out ${
          isDropdownOpen
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto visible'
            : 'opacity-0 scale-95 -translate-y-2 pointer-events-none invisible'
        }`}
      >
        <div className="px-4 py-2.5 border-b border-gray-100/80">
          <p className="text-xs font-bold text-gray-900 truncate">{userFullName}</p>
          <p className="text-[11px] text-gray-500 font-medium">{userRole}</p>
        </div>
        
        <div className="p-1.5 space-y-0.5">
          <button 
            onClick={() => setIsDropdownOpen(false)}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-digital-blue-50/80 hover:text-digital-blue-700 rounded-xl transition-colors duration-200 cursor-pointer group"
          >
            <User size={15} className="text-gray-400 group-hover:text-digital-blue-600 transition-colors" />
            <span>Profil Pengguna</span>
          </button>
          <button 
            onClick={() => setIsDropdownOpen(false)}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-digital-blue-50/80 hover:text-digital-blue-700 rounded-xl transition-colors duration-200 cursor-pointer group"
          >
            <ShieldCheck size={15} className="text-gray-400 group-hover:text-digital-blue-600 transition-colors" />
            <span>Keamanan & Akun</span>
          </button>
        </div>

        <div className="border-t border-gray-100/80 p-1.5 pt-1">
          <button 
            onClick={() => setIsDropdownOpen(false)}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50/80 rounded-xl transition-colors duration-200 cursor-pointer group"
          >
            <LogOut size={15} className="text-red-500 group-hover:translate-x-0.5 transition-transform" />
            <span>Keluar</span>
          </button>
        </div>
      </div>
    </div>
  );
}