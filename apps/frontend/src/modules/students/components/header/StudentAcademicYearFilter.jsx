import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';

/**
 * StudentAcademicYearFilter
 *
 * - Custom row: "AY .... / ...." — titik-titiknya adalah input transparan
 *   yang tampak seperti teks biasa; user mengetik langsung di situ
 * - Klik area baris (di luar input) → muncul chat bubble pesan
 *   "Silahkan masukkan tahun ajaran kustom" dengan panah mengarah ke baris
 * - Semua baris tinggi seragam (h-9)
 */
export default function StudentAcademicYearFilter({
  value = '',
  onChange,
  options = [],
  disabled = false,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');
  const [inputError, setInputError] = useState(false);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const containerRef = useRef(null);
  const startInputRef = useRef(null);
  const endInputRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setIsCustomMode(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setIsCustomMode(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const rawSelectedYear =
    value || (options[0] ? (typeof options[0] === 'object' ? options[0].value : options[0]) : '');
  const cleanYearVal = String(rawSelectedYear).replace(/^AY\s*/i, '');
  const displayYearText = cleanYearVal || 'Pilih Tahun';

  const optionValues = options.map((o) =>
    String(typeof o === 'object' && o !== null ? o.value : o).replace(/^AY\s*/i, ''),
  );
  const isCustomSelected = cleanYearVal !== '' && !optionValues.includes(cleanYearVal);
  const customParts = cleanYearVal.split('/');
  const isCustomActive = isCustomSelected || isCustomMode;

  const handleSelect = (val) => {
    onChange?.(String(val).replace(/^AY\s*/i, ''));
    setIsCustomMode(false);
    setIsOpen(false);
  };

  const handleStartYearChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setStartYear(val);
    if (inputError) setInputError(false);
    if (val.length === 4) {
      const parsed = parseInt(val, 10);
      if (!isNaN(parsed) && parsed >= 1900 && parsed <= 2100) {
        const nextYear = String(parsed + 1);
        setEndYear(nextYear);
        // Tahun akhir diisi otomatis, jadi pilihan custom langsung aktif
        // tanpa mengharuskan user menekan Enter.
        onChange?.(`${val}/${nextYear}`);
        // Otomatis submit jika end year sudah valid
        setTimeout(() => endInputRef.current?.select(), 0);
      }
    }
  };

  const handleEndYearChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setEndYear(val);
    if (inputError) setInputError(false);
    if (/^\d{4}$/.test(startYear) && /^\d{4}$/.test(val)) {
      onChange?.(`${startYear}/${val}`);
      setIsCustomMode(false);
      setIsOpen(false);
    }
  };

  const handleCustomSubmit = (e) => {
    e?.preventDefault();
    const s = startYear.trim();
    const end = endYear.trim();

    if (/^\d{4}$/.test(s) && /^\d{4}$/.test(end)) {
      onChange?.(`${s}/${end}`);
    } else if (/^\d{4}$/.test(s)) {
      const parsed = parseInt(s, 10);
      onChange?.(`${parsed}/${parsed + 1}`);
    } else {
      setInputError(true);
      startInputRef.current?.focus();
      return;
    }

    setStartYear('');
    setEndYear('');
    setInputError(false);
    setIsCustomMode(false);
    setIsOpen(false);
  };

  // Klik area di LUAR input → fokus ke startInput + tampilkan bubble
  const handleCustomRowClick = () => {
    // Klik pada area baris custom (termasuk di luar input) harus berperilaku
    // seperti memilih opsi rolling ketika kedua tahun sudah lengkap.
    if (/^\d{4}$/.test(startYear) && /^\d{4}$/.test(endYear)) {
      handleCustomSubmit();
      return;
    }

    const active = document.activeElement;
    if (active === startInputRef.current || active === endInputRef.current) return;
    setIsCustomMode(true);
    setInputError(false);
    setTimeout(() => startInputRef.current?.focus(), 0);
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      {/* ── Trigger ──────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`group relative inline-flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-white hover:bg-gray-50/90 border border-gray-200/90 hover:border-digital-blue-300 shadow-2xs hover:shadow-xs transition-all duration-200 cursor-pointer outline-none focus:ring-2 focus:ring-digital-blue-500/20 ${
          isOpen ? 'ring-2 ring-digital-blue-500/20 border-digital-blue-500 bg-gray-50/50' : ''
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-100' : ''}`}
      >
        <div className="w-8 h-8 rounded-xl bg-digital-blue-50 text-digital-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
          <Calendar size={16} />
        </div>
        <div className="flex flex-col text-left justify-center py-0.5">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-1">
            Tahun Ajaran
          </span>
          <span className="text-xs sm:text-sm font-bold text-gray-800 tracking-tight leading-none">
            {displayYearText}
          </span>
        </div>
        <ChevronDown
          size={15}
          className={`text-gray-400 transition-transform duration-500 ease-out ml-1 flex-shrink-0 ${
            isOpen ? 'rotate-180 text-digital-blue-600' : 'group-hover:text-gray-600'
          }`}
        />
      </button>

      {/* ── Dropdown ─────────────────────────────────────────── */}
      <div
        role="listbox"
        className={`absolute right-0 mt-2 w-full bg-white/98 backdrop-blur-xl border border-gray-100 shadow-[0_18px_40px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.04)] p-1.5 z-[80] text-gray-900 rounded-2xl origin-top-right transition-all duration-500 ease-out ${
          isOpen
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto visible'
            : 'opacity-0 scale-95 -translate-y-2 pointer-events-none invisible'
        }`}
      >
        {/* 5 Opsi Rolling */}
        <div className="space-y-0.5">
          {options.map((opt, idx) => {
            const rawOpt = typeof opt === 'object' && opt !== null ? opt.value : opt;
            const cleanOpt = String(rawOpt).replace(/^AY\s*/i, '');
            // Bug fix #1: sembunyikan centang di opsi rolling saat custom mode aktif
            const isSelected = cleanYearVal === cleanOpt && !isCustomMode;
            return (
              <button
                key={rawOpt ?? idx}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(cleanOpt)}
                className={`w-full h-9 flex items-center px-3 text-xs sm:text-[13px] rounded-xl transition-all duration-150 cursor-pointer text-left ${
                  isSelected
                    ? 'bg-digital-blue-50 text-digital-blue-700 font-bold border border-digital-blue-100/80 shadow-2xs'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium'
                }`}
              >
                <span className="w-8 text-left font-bold text-gray-500 select-none flex-shrink-0">
                  AY
                </span>
                <span className="flex-1 text-left tracking-wide">{cleanOpt}</span>
                <div className="w-4 flex items-center justify-end flex-shrink-0">
                  {isSelected && <Check size={14} className="text-digital-blue-600" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Baris Custom ─────────────────────────────────────── */}
        {/* Bug fix #2: onMouseLeave reset isCustomMode jika input tidak fokus */}
        <div
          className="mt-0.5 relative"
          onMouseLeave={() => {
            const active = document.activeElement;
            if (active !== startInputRef.current && active !== endInputRef.current) {
              setIsCustomMode(false);
            }
          }}
        >
          {/* Chat bubble — di BAWAH baris, panah ↑ mengarah ke input tahun pertama.
               Hilang saat user mulai mengetik (startYear/endYear sudah terisi) */}
          {isCustomMode && !isCustomSelected && startYear === '' && endYear === '' && (
            <div className="absolute top-full mt-2 left-0 right-0 z-10 pointer-events-none">
              <div className="relative bg-gray-800 text-white rounded-xl px-3 py-2 text-[11px] font-medium text-center shadow-lg leading-relaxed">
                {/* Panah ↑ di atas bubble, posisi sejajar dengan input tahun pertama */}
                <div className="absolute -top-[5px] left-[62px] -translate-x-1/2 w-2.5 h-2.5 bg-gray-800 rotate-45" />
                Silahkan masukkan tahun ajaran kustom
              </div>
            </div>
          )}

          {/* Baris custom */}
          <form onSubmit={handleCustomSubmit}>
            <div
              role="option"
              aria-selected={isCustomActive}
              onClick={handleCustomRowClick}
              className={`w-full h-9 flex items-center px-3 text-xs sm:text-[13px] rounded-xl transition-all duration-150 cursor-pointer ${
                isCustomActive
                  ? 'bg-digital-blue-50 text-digital-blue-700 font-bold border border-digital-blue-100/80 shadow-2xs'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium'
              }`}
            >
              {/* Kolom 1: AY */}
              <span className="w-8 text-left font-bold text-gray-500 select-none flex-shrink-0">
                AY
              </span>

              {/* Kolom 2: Input transparan — tampak seperti teks ".... / ...." */}
              <div className="flex items-center gap-0 flex-1 min-w-0">
                <input
                  ref={startInputRef}
                  type="text"
                  value={startYear}
                  onChange={handleStartYearChange}
                  onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit(e)}
                  onFocus={() => setIsCustomMode(true)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder={isCustomSelected && customParts[0] ? customParts[0] : '....'}
                  maxLength={4}
                  className={`w-7 -mr-1 bg-transparent border-none outline-none text-left p-0 text-xs font-semibold caret-digital-blue-500 ${
                    inputError
                      ? 'placeholder-red-400 text-red-500'
                      : 'placeholder-gray-400 text-gray-700'
                  } focus:placeholder-digital-blue-300`}
                />
                <span
                  className={`select-none font-semibold mx-0.5 ${inputError ? 'text-red-400' : 'text-gray-400'}`}
                >
                  /
                </span>
                <input
                  ref={endInputRef}
                  type="text"
                  value={endYear}
                  onChange={handleEndYearChange}
                  onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit(e)}
                  onFocus={() => setIsCustomMode(true)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder={isCustomSelected && customParts[1] ? customParts[1] : '....'}
                  maxLength={4}
                  className={`w-7 bg-transparent border-none outline-none text-left p-0 text-xs font-semibold caret-digital-blue-500 ${
                    inputError
                      ? 'placeholder-red-400 text-red-500'
                      : 'placeholder-gray-400 text-gray-700'
                  } focus:placeholder-digital-blue-300`}
                />
              </div>

              {/* Kolom 3: Checkmark — hanya tampil jika tahun custom sudah dikonfirmasi */}
              <div className="w-4 flex items-center justify-end flex-shrink-0">
                {isCustomSelected && <Check size={14} className="text-digital-blue-600" />}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
