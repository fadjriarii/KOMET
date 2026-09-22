// Chip filter aktif halaman mahasiswa
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

export const StudentFilterChips = ({
  selectedFaculties,
  selectedProdis,
  selectedAngkatan,
  periodeTermFilter,
  selectedSemesters,
  statusFilter,
  nationalityFilter,
  timeHorizon,
  selectedCustomYears,
  onResetFilters,
  // Handler dismiss opsional — jika tidak disediakan, chip tidak dismissible
  onToggleFaculty,
  onToggleProdi,
  onToggleAngkatan,
  onToggleSemester,
  setStatusFilter,
  setNationalityFilter,
  setPeriodeTermFilter,
}) => {
  // Chip horizon waktu — selalu tampil, tidak dismissible
  const horizonLabel =
    timeHorizon === 'last5' ? '5 Cohort Terakhir'
    : timeHorizon === 'all' ? 'Semua Waktu'
    : selectedCustomYears?.length > 0 ? `Custom: ${selectedCustomYears.sort((a, b) => a - b).join(', ')}`
    : 'Custom';

  const chips = [
    { label: `Rentang: ${horizonLabel}`, colorClass: 'bg-secondary-fixed/70 text-on-secondary-fixed' },
    ...(selectedFaculties?.map((f) => ({ label: f, colorClass: 'bg-primary-fixed text-on-primary-fixed', onDismiss: onToggleFaculty ? () => onToggleFaculty(f) : undefined })) ?? []),
    ...(selectedProdis?.map((p) => ({ label: p, colorClass: 'bg-primary-fixed/90 text-on-primary-fixed', onDismiss: onToggleProdi ? () => onToggleProdi(p) : undefined })) ?? []),
    ...(selectedAngkatan?.map((a) => ({ label: `Angkatan ${a}`, colorClass: 'bg-primary-fixed text-on-primary-fixed', onDismiss: onToggleAngkatan ? () => onToggleAngkatan(a) : undefined })) ?? []),
    ...(periodeTermFilter && periodeTermFilter !== 'all' ? [{ label: `Periode: ${periodeTermFilter}`, colorClass: 'bg-blue-100 text-blue-900', onDismiss: setPeriodeTermFilter ? () => setPeriodeTermFilter('all') : undefined }] : []),
    ...(selectedSemesters?.map((s) => ({ label: `Sem ${s === '8+' ? '≥8' : s}`, colorClass: 'bg-indigo-100 text-indigo-900', onDismiss: onToggleSemester ? () => onToggleSemester(s) : undefined })) ?? []),
    ...(statusFilter && statusFilter !== 'all' ? [{ label: `Status: ${statusFilter}`, colorClass: 'bg-amber-100 text-amber-900', onDismiss: setStatusFilter ? () => setStatusFilter('all') : undefined }] : []),
    ...(nationalityFilter && nationalityFilter !== 'all' ? [{ label: nationalityFilter, colorClass: 'bg-secondary-fixed/70 text-on-secondary-fixed', onDismiss: setNationalityFilter ? () => setNationalityFilter('all') : undefined }] : []),
  ];

  const hasDismissible = chips.some((c) => typeof c.onDismiss === 'function');

  return (
    <div className="flex flex-wrap items-center gap-1.5 py-1 px-0.5 min-h-[28px]">
      <span className="text-[11px] font-semibold text-outline">Filter aktif:</span>
      {chips.map((chip, idx) => (
        <Chip key={`${chip.label}-${idx}`} {...chip} />
      ))}
      {hasDismissible && onResetFilters && (
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
