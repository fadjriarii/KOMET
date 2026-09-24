import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';

/**
 * StudentAngkatanFilter - Filter Angkatan dalam bentuk Multi-Select Checkbox Popover
 * 
 * Fitur:
 * - Default display: "Pilih Tahun" / ringkasan tahun terseleksi.
 * - Opsi "All Time" di bagian atas.
 * - Pilihan 5 tahun ke belakang (rolling 5 years).
 * - Animasi buka/tutup identik dengan navbar dropdown.
 * 
 * @param {Array<string>} selectedYears - Array tahun terpilih (e.g. ['2026', '2025'])
 * @param {function} onChange - Callback ketika pilihan tahun berubah
 * @param {Array<string>} years - Daftar 5 tahun rolling dari backend / logic helper
 * @param {string} label - Label teks di atas filter
 * @param {string} placeholder - Teks default (default: "Pilih Tahun")
 * @param {boolean} disabled - Status disabled
 * @param {string} className - Additional CSS class
 */
export default function StudentAngkatanFilter({
  selectedYears = [],
  onChange,
  years = ['2026', '2025', '2024', '2023', '2022'],
  label = 'Angkatan',
  placeholder = 'Pilih Tahun',
  disabled = false,
  className = '',
  id = 'filter-angkatan',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Tutup dropdown saat klik di luar elemen atau menekan Escape
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const isAllTime = selectedYears.length === 0;

  // Toggle "All Time"
  const handleToggleAllTime = () => {
    onChange?.([]);
  };

  // Toggle pilihan tahun spesifik
  const handleToggleYear = (year) => {
    const yearStr = String(year);
    if (selectedYears.includes(yearStr)) {
      const next = selectedYears.filter((y) => y !== yearStr);
      onChange?.(next);
    } else {
      onChange?.([...selectedYears, yearStr]);
    }
  };

  // Label display pada tombol trigger
  const getDisplayText = () => {
    if (isAllTime) {
      return placeholder;
    }
    if (selectedYears.length === 1) {
      return `Angkatan ${selectedYears[0]}`;
    }
    if (selectedYears.length <= 2) {
      return selectedYears.join(', ');
    }
    return `${selectedYears.length} Tahun Terpilih`;
  };

  return (
    <div className={`flex flex-col gap-1.5 w-full relative ${className}`} ref={dropdownRef}>
      {label && (
        <label
          htmlFor={id}
          className="text-[11.5px] font-bold text-gray-700 uppercase tracking-wider select-none flex items-center justify-between"
        >
          <span>{label}</span>
          {!isAllTime && (
            <span className="text-[10px] font-bold text-digital-blue-700 bg-digital-blue-50 border border-digital-blue-200/60 px-1.5 py-0.2 rounded-md">
              {selectedYears.length} terpilih
            </span>
          )}
        </label>
      )}

      <div className="relative w-full group">
        {/* Trigger Button */}
        <button
          id={id}
          type="button"
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          disabled={disabled}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className={`w-full h-11 flex items-center justify-between bg-gray-50/80 hover:bg-gray-50/50 focus:bg-white text-xs sm:text-sm rounded-xl border border-gray-200/90 hover:border-gray-300 focus:border-digital-blue-600 focus:ring-3 focus:ring-digital-blue-500/15 shadow-2xs transition-all outline-none cursor-pointer pl-9.5 pr-3.5 ${
            disabled ? 'opacity-60 cursor-not-allowed bg-gray-100 border-gray-200' : ''
          }`}
        >
          {/* Icon Calendar */}
          <div className="absolute left-3.5 pointer-events-none text-gray-400 group-hover:text-gray-500 flex items-center justify-center transition-colors">
            <Calendar size={16} />
          </div>

          <span
            className={`truncate text-left ${
              isAllTime ? 'text-gray-400 font-normal' : 'text-gray-900 font-semibold'
            }`}
          >
            {getDisplayText()}
          </span>

          {/* Chevron Indicator */}
          <ChevronDown
            size={15}
            className={`text-gray-400 flex-shrink-0 transition-transform duration-500 ease-out ${
              isOpen ? 'rotate-180 text-digital-blue-600' : ''
            }`}
          />
        </button>

        {/* Dropdown Popover dengan animasi halus identik navbar */}
        <div
          className={`absolute left-0 right-0 mt-2 bg-white/98 backdrop-blur-xl border border-gray-100 shadow-[0_16px_36px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.04)] p-1.5 z-[70] text-gray-900 rounded-2xl origin-top transition-all duration-500 ease-out ${
            isOpen
              ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto visible'
              : 'opacity-0 scale-95 -translate-y-2 pointer-events-none invisible'
          }`}
        >
          <div className="space-y-0.5">
            {/* Opsi All Time - Gaya Seragam & Konsisten */}
            <button
              type="button"
              onClick={handleToggleAllTime}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-all duration-150 cursor-pointer ${
                isAllTime
                  ? 'bg-digital-blue-50 text-digital-blue-700 font-bold border border-digital-blue-100 shadow-2xs'
                  : 'text-gray-700 hover:bg-digital-blue-50/70 hover:text-digital-blue-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                    isAllTime
                      ? 'bg-digital-blue-600 border-digital-blue-600 text-white shadow-2xs'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {isAllTime && <Check size={12} strokeWidth={3} />}
                </div>
                <span>All Time</span>
              </div>
            </button>

            {/* List 5 Rolling Years */}
            {years.map((year) => {
              const yearStr = String(year);
              const isChecked = selectedYears.includes(yearStr);

              return (
                <button
                  key={yearStr}
                  type="button"
                  onClick={() => handleToggleYear(yearStr)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-all duration-150 cursor-pointer ${
                    isChecked
                      ? 'bg-digital-blue-50 text-digital-blue-700 font-bold border border-digital-blue-100 shadow-2xs'
                      : 'text-gray-700 hover:bg-digital-blue-50/70 hover:text-digital-blue-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                        isChecked
                          ? 'bg-digital-blue-600 border-digital-blue-600 text-white shadow-2xs'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {isChecked && <Check size={12} strokeWidth={3} />}
                    </div>
                    <span>Angkatan {yearStr}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

}
