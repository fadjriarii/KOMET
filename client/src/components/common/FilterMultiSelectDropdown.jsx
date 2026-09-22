import React, { useState, useRef } from 'react';
import { useClickOutside } from '@/hooks/useClickOutside';

/**
 * Reusable Multi-Select Checkbox Dropdown with Select All, Clear, and scrollable options.
 */
export const FilterMultiSelectDropdown = ({
  id,
  label,
  placeholder = 'All Options',
  options = [],
  selectedValues = [],
  onToggle,
  onSelectAll,
  onClear,
  align = 'left',
  width = 'w-64',
  renderLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useClickOutside(dropdownRef, () => setIsOpen(false));

  const count = selectedValues.length;
  let buttonText = placeholder;
  if (count === 1) {
    buttonText = renderLabel ? renderLabel(selectedValues[0]) : String(selectedValues[0]);
  } else if (count > 1) {
    buttonText = `${count} ${label || 'Opsi'} terpilih`;
  }

  const dropdownAlignClass = align === 'right' ? 'right-0' : 'left-0';

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
          {label}
        </label>
      )}
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full px-3 py-2 text-sm bg-surface rounded-lg border transition-all flex items-center justify-between gap-1 text-left cursor-pointer hover:bg-surface-container/40 ${
          isOpen ? 'border-primary ring-1 ring-primary' : 'border-outline-variant/50'
        }`}
      >
        <span className="truncate text-on-surface">{buttonText}</span>
        <span
          className={`material-symbols-outlined text-[18px] text-outline shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-primary' : ''
          }`}
        >
          expand_more
        </span>
      </button>

      {isOpen && (
        <div
          className={`absolute ${dropdownAlignClass} top-full mt-1.5 ${width} bg-surface-container-lowest border border-outline-variant/50 rounded-xl shadow-xl p-2.5 z-30 animate-dropdown-pop`}
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-surface-container-high text-xs">
            <button
              type="button"
              onClick={onSelectAll}
              className="text-[11px] text-primary font-semibold hover:underline cursor-pointer"
            >
              Pilih Semua
            </button>
            <span className="text-outline-variant">•</span>
            <button
              type="button"
              onClick={onClear}
              className="text-[11px] text-on-surface-variant font-medium hover:text-red-600 hover:underline cursor-pointer"
            >
              Bersihkan
            </button>
          </div>
          <div className="max-h-56 overflow-y-auto custom-scrollbar space-y-1 pr-1">
            {options.length === 0 ? (
              <p className="text-xs text-outline py-2 text-center">Tidak ada opsi</p>
            ) : (
              options.map((opt) => {
                const value = typeof opt === 'object' && opt !== null ? opt.value : opt;
                const optDisplay = typeof opt === 'object' && opt !== null ? opt.label : (renderLabel ? renderLabel(opt) : String(opt));
                const isChecked = selectedValues.includes(value);

                return (
                  <label
                    key={String(value)}
                    className="flex items-start gap-2 px-2.5 py-1.5 rounded-lg hover:bg-surface-container text-xs cursor-pointer select-none transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggle(value)}
                      className="mt-0.5 rounded border-outline text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer accent-primary"
                    />
                    <span
                      className={`text-on-surface leading-tight ${
                        isChecked ? 'font-bold text-primary' : 'font-medium'
                      }`}
                    >
                      {optDisplay}
                    </span>
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
