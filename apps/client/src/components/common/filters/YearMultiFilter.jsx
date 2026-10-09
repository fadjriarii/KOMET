import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Check, Plus } from 'lucide-react';
import { isValidAcademicYear } from '@komet/shared/academicYear';

const CUSTOM_FORMAT = /^\d{4}\/\d{4}$/;
const FALLBACK_MIN_LABEL = '2014/2015';

/**
 * Metadata cadangan bila server belum mengirim `customMeta`: batas bawah
 * statis, batas atas = label tertua rolling. Perbandingan murni
 * leksikografis — label `YYYY/YYYY` selalu bisa diurutkan sebagai string.
 */
function deriveLocalMeta(years = []) {
  const oldest = [...new Set(years.map(String).filter(Boolean))].sort()[0] ?? null;
  return {
    minLabel: FALLBACK_MIN_LABEL,
    maxLabel: oldest,
    placeholder: oldest ?? FALLBACK_MIN_LABEL,
    helperText: oldest
      ? `Angkatan lama tidak ada di atas? Ketik tahun ajaran ${FALLBACK_MIN_LABEL}–${oldest}.`
      : `Ketik tahun ajaran mulai ${FALLBACK_MIN_LABEL}.`,
    errorText: oldest
      ? `Hanya ${FALLBACK_MIN_LABEL}–${oldest}.`
      : `Hanya mulai ${FALLBACK_MIN_LABEL}.`,
  };
}

function toggleValue(selected = [], value) {
  return selected.includes(value)
    ? selected.filter((item) => item !== value)
    : [...selected, value];
}

/**
 * Multi-select tahun ajaran (angkatan / tahun lulus) sebagai popover checkbox.
 * Semua label dirender verbatim dari server (`YYYY/YYYY`); tidak ada aritmetika
 * tahun di sini. `customMeta` (dari `options[field.customMetaKey]`) membawa
 * batas + teks bantuan; bila null, fallback lokal di atas dipakai.
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
  customMeta = null,
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

  const meta = customMeta ?? deriveLocalMeta(years);
  const isAllTime = selectedYears.length === 0;
  const listedYears = new Set(years.map(String));
  // Tahun kustom tidak ada di daftar rolling; ia tetap tampil sebagai baris
  // terpilih supaya bisa dilepas lagi.
  const customSelectedYears = selectedYears.filter((year) => !listedYears.has(String(year)));

  const selectYear = (value) => {
    if (!selectedYears.includes(value)) onChange?.([...selectedYears, value]);
  };

  const addCustomYear = (value) => {
    const listed = listedYears.has(value);
    const inRange =
      (!meta.minLabel || value >= meta.minLabel) && (!meta.maxLabel || value <= meta.maxLabel);
    const allowed = CUSTOM_FORMAT.test(value) && isValidAcademicYear(value) && inRange;
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
            {selectedYears.length ? selectedYears.join(', ') : placeholder}
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
                  onSelect={() => onChange?.(toggleValue(selectedYears, yearStr))}
                  label={`${yearLabel} ${yearStr}`}
                />
              );
            })}

            {customSelectedYears.map((year) => (
              <YearOption
                key={`selected-${year}`}
                checked
                onSelect={() => onChange?.(toggleValue(selectedYears, String(year)))}
                label={`${yearLabel} ${year}`}
              />
            ))}

            {allowCustom && (
              <div className="mt-1 border-t border-dashed border-gray-200 pt-2">
                <p className="px-3 text-[11px] leading-snug text-gray-500">{meta.helperText}</p>
                <label
                  className={`mt-1 flex items-center gap-2 rounded-xl border border-dashed px-3 py-2 transition-all focus-within:border-digital-blue-400 focus-within:bg-digital-blue-50/50 focus-within:ring-2 focus-within:ring-digital-blue-500/15 ${
                    customError
                      ? 'border-red-300 bg-red-50/60'
                      : 'border-gray-300 bg-gray-50/60 hover:border-digital-blue-300'
                  }`}
                >
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-digital-blue-600 text-white">
                    <Plus size={13} strokeWidth={3} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs font-semibold text-gray-700">
                    {customLabel}
                  </span>
                  <input
                    type="text"
                    inputMode="text"
                    aria-label={customLabel}
                    value={customYear}
                    onChange={(event) => {
                      const value = event.target.value.replace(/[^0-9/]/g, '').slice(0, 9);
                      // Format penuh langsung dipilih, seperti pada filter Tahun Ajaran;
                      // Enter tetap jalan untuk input yang belum lengkap.
                      if (value.length === 9) addCustomYear(value);
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
                    placeholder={meta.placeholder}
                    maxLength={9}
                    className={`w-28 flex-shrink-0 rounded-lg border border-gray-200 bg-white px-2 py-1 text-center text-xs font-semibold outline-none placeholder:font-normal focus:border-digital-blue-400 ${
                      customError
                        ? 'text-red-500 placeholder-red-300'
                        : 'text-gray-900 placeholder-gray-400 caret-digital-blue-500'
                    }`}
                  />
                </label>
                {customError && (
                  <p className="px-3 pt-1 text-[11px] font-semibold text-red-500 leading-snug">
                    {meta.errorText}
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
