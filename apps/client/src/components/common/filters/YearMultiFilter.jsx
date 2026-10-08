import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';
import { getYearDisplayText, toggleYear } from '../../../utils/yearSelection';

/**
 * Multi-select tahun (angkatan / tahun lulus) sebagai popover checkbox.
 * Bedanya dengan modul lain hanya pada teks, jadi teks itu prop. `allowCustom`
 * menambah satu baris isian bebas; tahun yang boleh diketik adalah `minYear`
 * sampai setahun di bawah pilihan tertua di checkbox — di atas itu tahunnya
 * sudah ada sebagai baris centang dan cukup dicentang dari situ.
 */
export default function YearMultiFilter({
  selectedYears = [],
  onChange,
  years = [],
  label = 'Tahun',
  placeholder = 'Pilih Tahun',
  allTimeLabel = 'Semua Tahun',
  yearLabel = 'Tahun',
  allowCustom = false,
  customLabel = `${yearLabel} kustom`,
  minYear = 0,
  disabled = false,
  className = '',
  id,
}) {
  const selectId = id || (label ? `filter-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
  const [isOpen, setIsOpen] = useState(false);
  const [customYear, setCustomYear] = useState('');
  const [customError, setCustomError] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const isAllTime = selectedYears.length === 0;
  const listedYears = new Set(years.map(String));
  // Tahun kustom tidak ada di daftar rolling; ia tetap tampil sebagai baris
  // terpilih supaya bisa dilepas lagi.
  const customSelectedYears = selectedYears.filter((year) => !listedYears.has(String(year)));
  // Daftar rolling menurun dan berurutan, jadi batas atas kustom = pilihan tertua − 1.
  const oldestListedYear = Math.min(...years.map(Number).filter(Number.isFinite));
  const maxCustomYear = Number.isFinite(oldestListedYear) ? oldestListedYear - 1 : null;

  const selectYear = (value) => {
    if (!selectedYears.includes(value)) onChange?.([...selectedYears, value]);
  };

  const addCustomYear = (value) => {
    const listed = listedYears.has(value);
    const allowed =
      /^\d{4}$/.test(value) && Number(value) >= minYear && Number(value) <= maxCustomYear;
    if (!listed && !allowed) {
      setCustomError(true);
      return;
    }
    // Tahun yang sudah muncul sebagai centang cukup dicentang, tidak ditambahkan dua kali.
    selectYear(value);
    setCustomYear('');
    setCustomError(false);
  };

  return (
    <div className={`flex flex-col gap-1.5 w-full relative ${className}`} ref={dropdownRef}>
      {label && (
        <label
          htmlFor={selectId}
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
        <button
          id={selectId}
          type="button"
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          disabled={disabled}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className={`w-full h-11 flex items-center justify-between bg-gray-50/80 hover:bg-gray-50/50 focus:bg-white text-xs sm:text-sm rounded-xl border border-gray-200/90 hover:border-gray-300 focus:border-digital-blue-600 focus:ring-3 focus:ring-digital-blue-500/15 shadow-2xs transition-all outline-none cursor-pointer pl-9.5 pr-3.5 ${
            disabled ? 'opacity-60 cursor-not-allowed bg-gray-100 border-gray-200' : ''
          }`}
        >
          <div className="absolute left-3.5 pointer-events-none text-gray-400 group-hover:text-gray-500 flex items-center justify-center transition-colors">
            <Calendar size={16} />
          </div>

          <span
            className={`truncate text-left ${
              isAllTime ? 'text-gray-400 font-normal' : 'text-gray-900 font-semibold'
            }`}
          >
            {getYearDisplayText(selectedYears, placeholder)}
          </span>

          <ChevronDown
            size={15}
            className={`text-gray-400 flex-shrink-0 transition-transform duration-500 ease-out ${
              isOpen ? 'rotate-180 text-digital-blue-600' : ''
            }`}
          />
        </button>

        <div
          className={`absolute left-0 right-0 mt-2 bg-white/98 backdrop-blur-xl border border-gray-100 shadow-[0_16px_36px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.04)] p-1.5 z-[70] text-gray-900 rounded-2xl origin-top transition-all duration-500 ease-out ${
            isOpen
              ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto visible'
              : 'opacity-0 scale-95 -translate-y-2 pointer-events-none invisible'
          }`}
        >
          <div className="space-y-0.5">
            <YearOption checked={isAllTime} onSelect={() => onChange?.([])} label={allTimeLabel} />
            {years.map((year) => {
              const yearStr = String(year);
              return (
                <YearOption
                  key={yearStr}
                  checked={selectedYears.includes(yearStr)}
                  onSelect={() => onChange?.(toggleYear(selectedYears, yearStr))}
                  label={`${yearLabel} ${yearStr}`}
                />
              );
            })}

            {customSelectedYears.map((year) => (
              <YearOption
                key={`selected-${year}`}
                checked
                onSelect={() => onChange?.(toggleYear(selectedYears, String(year)))}
                label={`${yearLabel} ${year}`}
              />
            ))}

            {allowCustom && maxCustomYear !== null && (
              <div>
                <label
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-medium rounded-xl transition-all duration-150 cursor-pointer ${
                    customError
                      ? 'bg-red-50 text-red-600'
                      : 'text-gray-700 hover:bg-digital-blue-50/70 hover:text-digital-blue-700'
                  }`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-4 h-4 flex-shrink-0 rounded-md border flex items-center justify-center text-[11px] font-bold ${
                        customError
                          ? 'border-red-300 bg-white'
                          : 'border-dashed border-gray-300 bg-white'
                      }`}
                    >
                      {customError ? '!' : '+'}
                    </span>
                    <span className="truncate">{customLabel}</span>
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    aria-label={customLabel}
                    value={customYear}
                    onChange={(event) => {
                      const value = event.target.value.replace(/\D/g, '').slice(0, 4);
                      // Tahun penuh langsung dipilih, seperti pada filter Tahun Ajaran;
                      // Enter tetap jalan untuk input yang belum lengkap.
                      if (value.length === 4) addCustomYear(value);
                      else {
                        setCustomYear(value);
                        if (customError) setCustomError(false);
                      }
                    }}
                    onKeyDown={(event) => {
                      if (event.key !== 'Enter') return;
                      event.preventDefault();
                      addCustomYear(customYear);
                    }}
                    placeholder="...."
                    maxLength={4}
                    className={`w-11 flex-shrink-0 bg-transparent border-none outline-none text-right p-0 text-xs font-semibold placeholder:font-normal ${
                      customError
                        ? 'text-red-500 placeholder-red-300'
                        : 'text-gray-900 placeholder-gray-400 caret-digital-blue-500'
                    }`}
                  />
                </label>
                {customError && (
                  <p className="px-3 pb-1 text-[11px] font-semibold text-red-500 leading-snug">
                    Hanya {minYear}–{maxCustomYear}; {oldestListedYear} ke atas sudah ada di daftar.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function YearOption({ checked, onSelect, label }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-all duration-150 cursor-pointer ${
        checked
          ? 'bg-digital-blue-50 text-digital-blue-700 font-bold border border-digital-blue-100 shadow-2xs'
          : 'text-gray-700 hover:bg-digital-blue-50/70 hover:text-digital-blue-700'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
            checked
              ? 'bg-digital-blue-600 border-digital-blue-600 text-white shadow-2xs'
              : 'border-gray-300 bg-white'
          }`}
        >
          {checked && <Check size={12} strokeWidth={3} />}
        </div>
        <span>{label}</span>
      </div>
    </button>
  );
}
