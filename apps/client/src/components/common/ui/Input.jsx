import { Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/**
 * Input - Reusable Input Field dengan Support Search Icon & Clear Button
 *
 * UX Ramah Pengetik Lambat:
 * User yang mengetik sangat lambat (mencari huruf satu per satu di keyboard)
 * sering mengalami kursor hilang karena re-render sistemik: URL write dari
 * debounce, fetch data dari server, skeleton tabel yang berganti data nyata,
 * dsb.
 *
 * Solusi:
 * 1. Uncontrolled input (defaultValue + ref) agar React reconciliation
 *    tidak pernah menimpa isi ketikan user.
 * 2. Active-typing lock: saat user mengetik, flag `isTypingRef` aktif.
 *    Setiap kali komponen me-render ulang (misal karena URL berubah atau
 *    data tiba), fokus selalu dipastikan kembali ke input jika kursor lepas.
 * 3. Flag hanya dimatikan ketika user secara sadar mengklik elemen lain di
 *    luar input (didengar via document `mousedown`), tombol Clear diklik,
 *    atau tombol Escape ditekan.
 *
 * @param {string} label - Label teks di atas input
 * @param {string} value - Nilai input (sumber: URL / pemilik state)
 * @param {function} onChange - Callback ketika value berubah
 * @param {string} placeholder - Placeholder input
 * @param {Component} icon - Icon Lucide (default: Search)
 * @param {boolean} isSearch - Apakah bertindak sebagai search field
 * @param {function} onClear - Callback saat clear button diklik
 * @param {number} debounceMs - Jendela debounce sebelum menulis ke URL
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
  debounceMs = 400,
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const lastWrittenRef = useRef(value);
  const localValRef = useRef(value);
  const isTypingRef = useRef(false);
  const [hasValue, setHasValue] = useState(value !== '');

  // Listener global mousedown: matikan status mengetik HANYA saat user
  // sengaja mengklik di luar area input search ini.
  useEffect(() => {
    if (!isSearch) return;

    const handleDocumentMouseDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        isTypingRef.current = false;
        // Flush perubahan terakhir jika masih ada timer pending
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
          onChange?.(localValRef.current);
        }
      }
    };

    document.addEventListener('mousedown', handleDocumentMouseDown, true);
    return () => {
      document.removeEventListener('mousedown', handleDocumentMouseDown, true);
    };
  }, [isSearch, onChange]);

  // Jaga fokus tetap di input setelah re-render sistemik jika user masih
  // dalam sesi mengetik (belum klik ke luar).
  useEffect(() => {
    if (!isSearch || !isTypingRef.current) return;
    const el = inputRef.current;
    if (el && document.activeElement !== el) {
      const pos = el.value.length;
      el.focus();
      try {
        el.setSelectionRange(pos, pos);
      } catch {
        // Abaikan jika tipe input tidak mendukung selection range
      }
    }
  });

  // Adopt nilai URL dari luar (reset filter, back/forward) saat input
  // tidak sedang dalam sesi mengetik aktif.
  useEffect(() => {
    if (!isSearch) return;
    const el = inputRef.current;
    if (el && value !== lastWrittenRef.current && !isTypingRef.current) {
      el.value = value;
      lastWrittenRef.current = value;
      localValRef.current = value;
      setHasValue(value !== '');
    }
  }, [isSearch, value]);

  const flush = () => {
    clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  const commit = (next) => {
    lastWrittenRef.current = next;
    localValRef.current = next;
    setHasValue(next !== '');
    onChange?.(next);
  };

  const handleChange = (e) => {
    const next = e.target.value;
    localValRef.current = next;
    isTypingRef.current = true;
    setHasValue(next !== '');
    if (isSearch) {
      flush();
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        commit(next);
      }, debounceMs);
    } else {
      commit(next);
    }
  };

  const handleFocus = () => {
    isTypingRef.current = true;
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      isTypingRef.current = false;
      inputRef.current?.blur();
    }
  };

  const handleClear = () => {
    isTypingRef.current = false;
    flush();
    const el = inputRef.current;
    if (el) {
      el.value = '';
      el.focus();
    }
    commit('');
  };

  return (
    <div ref={containerRef} className={`flex flex-col gap-1.5 w-full ${className}`}>
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

        {isSearch ? (
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            defaultValue={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full h-11 bg-gray-50/80 hover:bg-gray-50/50 focus:bg-white text-gray-900 placeholder:text-gray-400 text-xs sm:text-sm font-medium rounded-xl border border-gray-200/90 hover:border-gray-300 focus:border-digital-blue-600 focus:ring-3 focus:ring-digital-blue-500/15 shadow-2xs transition-all outline-none ${'pl-9.5 pr-9'} ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-100 border-gray-200' : ''}`}
          />
        ) : (
          <input
            id={inputId}
            type="text"
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full h-11 bg-gray-50/80 hover:bg-gray-50/50 focus:bg-white text-gray-900 placeholder:text-gray-400 text-xs sm:text-sm font-medium rounded-xl border border-gray-200/90 hover:border-gray-300 focus:border-digital-blue-600 focus:ring-3 focus:ring-digital-blue-500/15 shadow-2xs transition-all outline-none ${'px-3.5'} ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-100 border-gray-200' : ''}`}
          />
        )}

        {isSearch && hasValue && onClear && (
          <button
            type="button"
            onClick={handleClear}
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
