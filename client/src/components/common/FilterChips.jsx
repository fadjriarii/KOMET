// Chip filter aktif — merender daftar chip dari props, dengan tombol hapus opsional per chip
// Props: chips[]{label, colorClass?, onDismiss?}, alwaysVisible, onResetAll
import React from 'react';

// Chip tunggal dengan tombol hapus opsional
const Chip = ({ label, colorClass, onDismiss }) => (
  <span className={['inline-flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 rounded-full text-[11px] font-semibold', colorClass].join(' ')}>
    {label}
    {onDismiss && (
      <button
        type="button"
        onClick={onDismiss}
        className="material-symbols-outlined text-[13px] opacity-70 hover:opacity-100 cursor-pointer leading-none"
        aria-label={`Hapus filter ${label}`}
      >
        close
      </button>
    )}
  </span>
);

const FilterChips = ({ chips = [], alwaysVisible = false, onResetAll }) => {
  const hasDismissible = chips.some((c) => typeof c.onDismiss === 'function');

  if (!alwaysVisible && chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 py-1 px-0.5 min-h-[28px]">
      {chips.map((chip, idx) => (
        <Chip
          key={`${chip.label}-${idx}`}
          label={chip.label}
          colorClass={chip.colorClass || 'bg-primary-fixed text-on-primary-fixed'}
          onDismiss={chip.onDismiss}
        />
      ))}
      {/* Tombol reset hanya muncul jika ada chip dismissible */}
      {hasDismissible && onResetAll && (
        <button
          type="button"
          onClick={onResetAll}
          className="text-[11px] font-semibold text-rose-500 hover:text-rose-700 hover:underline ml-1 cursor-pointer"
        >
          Reset Semua
        </button>
      )}
    </div>
  );
};

export default FilterChips;
