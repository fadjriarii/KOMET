// Chip filter aktif halaman MBKM
import React from 'react';

// Chip tunggal dengan tombol hapus opsional
const Chip = ({ label, colorClass, onDismiss }) => (
  <span className={`inline-flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 rounded-full text-[11px] font-semibold ${colorClass}`}>
    {label}
    {onDismiss && (
      <button
        type="button"
        onClick={onDismiss}
        className="material-symbols-outlined text-[13px] opacity-60 hover:opacity-100 cursor-pointer leading-none"
        aria-label={`Hapus filter ${label}`}
      >
        close
      </button>
    )}
  </span>
);

export const MbkmFilterChips = ({
  isFiltered,
  timeHorizon,
  setTimeHorizon,
  selectedCustomAngkatan,
  selectedFaculties,
  handleToggleFaculty,
  selectedProdis,
  handleToggleProdi,
  selectedStatus,
  setSelectedStatus,
  selectedAngkatan,
  handleToggleAngkatan,
  selectedJenjang,
  setSelectedJenjang,
  onResetFilters,
}) => {
  // Tersembunyi saat tidak ada filter aktif
  if (!isFiltered) return null;

  // Chip horizon waktu — dismissible kembali ke last5
  const horizonChips = [];
  if (timeHorizon === 'custom' && selectedCustomAngkatan?.length > 0) {
    horizonChips.push({
      label: `Cohort: ${selectedCustomAngkatan.join(', ')}`,
      colorClass: 'bg-secondary-fixed/70 text-on-secondary-fixed',
      onDismiss: () => setTimeHorizon('last5'),
    });
  } else if (timeHorizon === 'all') {
    horizonChips.push({
      label: 'Semua Waktu',
      colorClass: 'bg-secondary-fixed/70 text-on-secondary-fixed',
      onDismiss: () => setTimeHorizon('last5'),
    });
  }

  const chips = [
    ...horizonChips,
    ...(selectedFaculties?.map((f) => ({ label: f, colorClass: 'bg-primary-fixed text-on-primary-fixed', onDismiss: () => handleToggleFaculty(f) })) ?? []),
    ...(selectedProdis?.map((p) => ({ label: p, colorClass: 'bg-primary-fixed/90 text-on-primary-fixed', onDismiss: () => handleToggleProdi(p) })) ?? []),
    ...(selectedStatus && selectedStatus !== 'all' ? [{ label: `Status: ${selectedStatus}`, colorClass: 'bg-amber-100 text-amber-900', onDismiss: () => setSelectedStatus('all') }] : []),
    ...(selectedAngkatan?.map((a) => ({ label: `Angkatan ${a}`, colorClass: 'bg-purple-100 text-purple-900', onDismiss: () => handleToggleAngkatan(a) })) ?? []),
    ...(selectedJenjang && selectedJenjang !== 'all' ? [{ label: `Jenjang: ${selectedJenjang.toUpperCase()}`, colorClass: 'bg-blue-100 text-blue-900', onDismiss: () => setSelectedJenjang('all') }] : []),
  ];

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 py-1 px-0.5 min-h-[28px]">
      <span className="text-[11px] font-semibold text-outline">Filter aktif:</span>
      {chips.map((chip, idx) => (
        <Chip key={`${chip.label}-${idx}`} {...chip} />
      ))}
      {onResetFilters && (
        <button
          type="button"
          onClick={onResetFilters}
          className="text-[11px] font-semibold text-rose-500 hover:text-rose-700 hover:underline ml-1 cursor-pointer"
        >
          Reset Semua
        </button>
      )}
    </div>
  );
};
