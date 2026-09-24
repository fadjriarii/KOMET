import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Select - Reusable Animated Custom Dropdown Select Field
 * 
 * @param {string} label - Label teks di atas select
 * @param {string} value - Nilai terseleksi
 * @param {function} onChange - Callback ketika value berubah
 * @param {Array} options - Array opsi [{ value, label }] atau array string ['Fakultas A', 'Fakultas B']
 * @param {string} placeholder - Opsi default / placeholder (e.g. "Semua Fakultas")
 * @param {string} defaultValue - Nilai yang dianggap kondisi default secara visual
 * @param {Component} icon - Icon Lucide opsional di sisi kiri
 * @param {boolean} disabled - Status disable
 * @param {string} className - Additional container classes
 * @param {string} id - HTML ID
 */
export default function Select({
  label,
  value = '',
  onChange,
  options = [],
  placeholder = 'Pilih Opsi...',
  defaultValue = '',
  icon: Icon,
  disabled = false,
  className = '',
  id,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  // Tutup dropdown saat klik di luar elemen atau menekan Escape
  useEffect(() => {
    function handleClickOutside(event) {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
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

  // Temukan label opsi yang sedang aktif/terpilih
  const selectedOption = options.find((opt) => {
    const optVal = typeof opt === 'object' && opt !== null ? opt.value : opt;
    return String(optVal) === String(value);
  });

  const displayLabel = selectedOption
    ? typeof selectedOption === 'object'
      ? selectedOption.label
      : selectedOption
    : value || placeholder;

  const isDefaultSelected = String(value || '') === String(defaultValue || '');
  const isPlaceholderSelected = !value;
  const isVisuallyDefault = isPlaceholderSelected || isDefaultSelected;

  const handleSelectOption = (optVal) => {
    onChange?.(optVal);
    setIsOpen(false);
  };

  return (
    <div className={`flex flex-col gap-1.5 w-full relative ${className}`} ref={selectRef}>
      {label && (
        <label
          htmlFor={selectId}
          className="text-[11.5px] font-bold text-gray-700 uppercase tracking-wider select-none flex items-center justify-between"
        >
          <span>{label}</span>
        </label>
      )}

      <div className="relative w-full group">
        {/* Trigger Button */}
        <button
          id={selectId}
          type="button"
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          disabled={disabled}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className={`w-full h-11 flex items-center justify-between bg-gray-50/80 hover:bg-gray-50/50 focus:bg-white text-xs sm:text-sm rounded-xl border border-gray-200/90 hover:border-gray-300 focus:border-digital-blue-600 focus:ring-3 focus:ring-digital-blue-500/15 shadow-2xs transition-all outline-none cursor-pointer ${
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
              isVisuallyDefault ? 'text-gray-400 font-normal' : 'text-gray-900 font-semibold'
            }`}
          >
            {displayLabel}
          </span>

          {/* Chevron Indicator dengan animasi putar halus identik navbar */}
          <ChevronDown
            size={15}
            className={`text-gray-400 flex-shrink-0 transition-transform duration-500 ease-out ${
              isOpen ? 'rotate-180 text-digital-blue-600' : ''
            }`}
          />
        </button>

        {/* Dropdown Popover List dengan kontras tajam & animasi halus identik navbar */}
        <div
          role="listbox"
          className={`absolute left-0 right-0 mt-2 bg-white/98 backdrop-blur-xl border border-gray-100 shadow-[0_16px_36px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.04)] py-1.5 z-[70] text-gray-900 rounded-2xl origin-top transition-all duration-500 ease-out ${
            isOpen
              ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto visible'
              : 'opacity-0 scale-95 -translate-y-2 pointer-events-none invisible'
          }`}
        >
          <div className="max-h-60 overflow-y-auto custom-scrollbar p-1.5 space-y-0.5">
            {/* Opsi Reset / Placeholder (e.g. Semua Fakultas) */}
            {placeholder && (
              <button
                type="button"
                role="option"
                aria-selected={isPlaceholderSelected}
                onClick={() => handleSelectOption('')}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-all duration-150 cursor-pointer ${
                  isPlaceholderSelected
                    ? 'bg-digital-blue-50 text-digital-blue-700 font-bold border border-digital-blue-100 shadow-2xs'
                    : 'text-gray-600 hover:bg-digital-blue-50/70 hover:text-digital-blue-700'
                }`}
              >
                <span className="truncate">{placeholder}</span>
                {isPlaceholderSelected && (
                  <Check size={14} className="text-digital-blue-600 flex-shrink-0 ml-2" />
                )}
              </button>
            )}

            {/* List Opsi Dinamis */}
            {options.map((opt, idx) => {
              const optVal = typeof opt === 'object' && opt !== null ? opt.value : opt;
              const optLabel = typeof opt === 'object' && opt !== null ? opt.label : opt;
              const isSelected = String(value) === String(optVal);

              return (
                <button
                  key={optVal ?? idx}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelectOption(optVal)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-all duration-150 cursor-pointer text-left ${
                    isSelected
                      ? 'bg-digital-blue-50 text-digital-blue-700 font-bold border border-digital-blue-100 shadow-2xs'
                      : 'text-gray-700 hover:bg-digital-blue-50/70 hover:text-digital-blue-700'
                  }`}
                >
                  <span className="truncate">{optLabel}</span>
                  {isSelected && (
                    <Check size={14} className="text-digital-blue-600 flex-shrink-0 ml-2" />
                  )}
                </button>
              );
            })}

            {options.length === 0 && !placeholder && (
              <div className="px-3 py-2 text-xs text-gray-400 text-center">
                Tidak ada opsi
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );


}
