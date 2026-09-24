import { Search, X } from 'lucide-react';

/**
 * Input - Reusable Input Field dengan Support Search Icon & Clear Button
 * 
 * @param {string} label - Label teks di atas input
 * @param {string} value - Nilai input
 * @param {function} onChange - Callback ketika value berubah
 * @param {string} placeholder - Placeholder input
 * @param {Component} icon - Icon Lucide (default: Search)
 * @param {boolean} isSearch - Apakah bertindak sebagai search field (menampilkan icon search & clear)
 * @param {function} onClear - Callback saat clear button diklik
 */
export default function Input({
  label,
  value = '',
  onChange,
  onClear,
  placeholder = 'Search...',
  icon: Icon = Search,
  isSearch = true,
  disabled = false,
  className = '',
  id,
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-[11.5px] font-bold text-gray-700 uppercase tracking-wider select-none flex items-center justify-between"
        >
          <span>{label}</span>
        </label>
      )}

      <div className="relative flex items-center w-full group">
        {Icon && isSearch && (
          <div className="absolute left-3.5 pointer-events-none text-gray-400 group-hover:text-gray-500 group-focus-within:text-digital-blue-600 flex items-center justify-center transition-colors">
            <Icon size={16} />
          </div>
        )}

        <input
          id={inputId}
          type="text"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full h-11 bg-gray-50/80 hover:bg-gray-50/50 focus:bg-white text-gray-900 placeholder:text-gray-400 text-xs sm:text-sm font-medium rounded-xl border border-gray-200/90 hover:border-gray-300 focus:border-digital-blue-600 focus:ring-3 focus:ring-digital-blue-500/15 shadow-2xs transition-all outline-none ${
            isSearch ? 'pl-9.5 pr-9' : 'px-3.5'
          } ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-100 border-gray-200' : ''}`}
        />

        {isSearch && value && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2.5 p-1 text-gray-400 hover:text-gray-700 bg-gray-200/60 hover:bg-gray-200 rounded-md transition-colors cursor-pointer"
            aria-label="Clear search"
          >
            <X size={13} />
          </button>
        )}
      </div>
    </div>
  );
}


