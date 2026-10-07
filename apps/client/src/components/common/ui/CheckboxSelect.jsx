import { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown } from 'lucide-react';

/**
 * CheckboxSelect - Multi-Select Checkbox Dropdown Component with smooth animation
 *
 * @param {string} label - Label teks di atas filter
 * @param {Array<string>|string} value - Nilai terpilih
 * @param {function} onChange - Callback ketika nilai berubah
 * @param {Array} options - Daftar opsi [{ value, label }] atau array string
 * @param {string} placeholder - Label opsi default ("Semua")
 * @param {Array|string} defaultValue - Nilai default untuk indikator visual
 * @param {Component} icon - Icon Lucide opsional di sisi kiri
 * @param {boolean} disabled - Status disabled
 * @param {string} className - Additional CSS class
 * @param {string} id - HTML ID
 */
export default function CheckboxSelect({
  label,
  value = [],
  onChange,
  options = [],
  placeholder = 'Semua',
  defaultValue = [],
  icon: Icon,
  disabled = false,
  className = '',
  id,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selectId = id || (label ? `filter-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  const selected = Array.isArray(value)
    ? value.map(String)
    : value !== null && value !== ''
      ? [String(value)]
      : [];

  const defaults = Array.isArray(defaultValue)
    ? defaultValue.map(String)
    : defaultValue !== null && defaultValue !== ''
      ? [String(defaultValue)]
      : [];

  const isDefault =
    selected.length === defaults.length && selected.every((item) => defaults.includes(item));
  const isAllSelected = selected.length === 0;

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggle = (option) => {
    const item = String(typeof option === 'object' && option !== null ? option.value : option);
    const newSelected = selected.includes(item)
      ? selected.filter((v) => v !== item)
      : [...selected, item];
    onChange?.(newSelected);
  };

  const handleClearAll = () => {
    onChange?.([]);
  };

  const getDisplayLabel = () => {
    if (selected.length === 0) return placeholder;
    if (selected.length === 1) {
      const match = options.find((opt) => {
        const val = String(typeof opt === 'object' && opt !== null ? opt.value : opt);
        return val === selected[0];
      });
      if (match) {
        return typeof match === 'object' ? match.label : match;
      }
      return selected[0];
    }
    return `${selected.length} terpilih`;
  };

  return (
    <div ref={ref} className={`flex flex-col gap-1.5 w-full relative ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="text-[11.5px] font-bold text-gray-700 uppercase tracking-wider select-none flex items-center justify-between"
        >
          <span>{label}</span>
          {selected.length > 0 && !isDefault && (
            <span className="text-[10px] font-bold text-digital-blue-700 bg-digital-blue-50 border border-digital-blue-200/60 px-1.5 py-0.2 rounded-md">
              {selected.length} terpilih
            </span>
          )}
        </label>
      )}

      <div className="relative w-full group">
        {/* Trigger Button */}
        <button
          id={selectId}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="listbox"
          className={`w-full h-11 bg-gray-50/80 hover:bg-gray-50/50 focus:bg-white border-gray-200/90 flex items-center justify-between text-xs sm:text-sm rounded-xl border hover:border-gray-300 focus:border-digital-blue-600 focus:ring-3 focus:ring-digital-blue-500/15 shadow-2xs transition-all outline-none cursor-pointer ${
            Icon ? 'pl-9.5 pr-3.5' : 'px-3.5'
          } ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-100 border-gray-200' : ''}`}
        >
          {Icon && (
            <div className="absolute left-3.5 pointer-events-none text-gray-400 group-hover:text-gray-500 flex items-center justify-center transition-colors">
              <Icon size={16} />
            </div>
          )}

          <span
            className={`truncate text-left ${
              isAllSelected || isDefault
                ? 'text-gray-400 font-normal'
                : 'text-gray-900 font-semibold'
            }`}
          >
            {getDisplayLabel()}
          </span>

          {/* Chevron Indicator dengan animasi putar halus identik navbar & filter lainnya */}
          <ChevronDown
            size={15}
            className={`text-gray-400 flex-shrink-0 transition-transform duration-500 ease-out ${
              open ? 'rotate-180 text-digital-blue-600' : ''
            }`}
          />
        </button>

        {/* Dropdown Popover dengan animasi halus identik Select & Angkatan */}
        <div
          role="listbox"
          className={`absolute left-0 right-0 mt-2 bg-white/98 backdrop-blur-xl border border-gray-100 shadow-[0_16px_36px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.04)] p-1.5 z-[70] text-gray-900 rounded-2xl origin-top transition-all duration-500 ease-out ${
            open
              ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto visible'
              : 'opacity-0 scale-95 -translate-y-2 pointer-events-none invisible'
          }`}
        >
          <div className="space-y-0.5">
            {/* Opsi 'Semua' — selalu di atas daftar. */}
            <button
              type="button"
              onClick={handleClearAll}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-all duration-150 cursor-pointer ${
                isAllSelected
                  ? 'bg-digital-blue-50 text-digital-blue-700 font-bold border border-digital-blue-100 shadow-2xs'
                  : 'text-gray-700 hover:bg-digital-blue-50/70 hover:text-digital-blue-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                    isAllSelected
                      ? 'bg-digital-blue-600 border-digital-blue-600 text-white shadow-2xs'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {isAllSelected && <Check size={12} strokeWidth={3} />}
                </div>
                <span>{placeholder}</span>
              </div>
            </button>

            {/* List Opsi Dinamis dengan scroll */}
            <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-0.5 pr-0.5">
              {options.map((option, index) => {
                const item = String(
                  typeof option === 'object' && option !== null ? option.value : option,
                );
                const text = typeof option === 'object' && option !== null ? option.label : option;
                const checked = selected.includes(item);

                return (
                  <button
                    key={item || index}
                    type="button"
                    onClick={() => toggle(option)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-all duration-150 cursor-pointer text-left ${
                      checked
                        ? 'bg-digital-blue-50 text-digital-blue-700 font-bold border border-digital-blue-100 shadow-2xs'
                        : 'text-gray-700 hover:bg-digital-blue-50/70 hover:text-digital-blue-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${
                          checked
                            ? 'bg-digital-blue-600 border-digital-blue-600 text-white shadow-2xs'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {checked && <Check size={12} strokeWidth={3} />}
                      </div>
                      <span className="truncate">{text}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
