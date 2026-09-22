// Chip filter aktif halaman lulusan
import React from 'react';
import { PERIODE_OPTIONS, SEMESTER_OPTIONS } from '../hooks/useGraduateFilters';

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

export const GraduateFilterChips = ({
  selectedFaculties,
  selectedProdis,
  selectedYears,
  selectedPeriode,
  selectedSemester,
  selectedJenjang,
  selectedPredikat,
  timeHorizon,
  availableAngkatans,
  selectedCustomAngkatan,
  onResetFilters,
  // Handler dismiss opsional
  handleToggleFaculty,
  handleToggleProdi,
  handleToggleYear,
  setSelectedPeriode,
  setSelectedSemester,
  setSelectedJenjang,
  setSelectedPredikat,
}) => {
  // Chip horizon waktu — selalu tampil, tidak dismissible
  const horizonLabel =
    timeHorizon === 'last5'
      ? availableAngkatans?.slice(0, 5).length > 0
        ? `Angkatan ${availableAngkatans.slice(0,5).at(-1)}–${availableAngkatans[0]} (KPI)`
        : '5 Cohort Terakhir'
      : timeHorizon === 'all'
      ? 'Semua Waktu'
      : selectedCustomAngkatan?.length > 0
      ? `Custom: ${selectedCustomAngkatan.sort((a, b) => b - a).join(', ')}`
      : 'Custom';

  const chips = [
    { label: `Rentang: ${horizonLabel}`, colorClass: 'bg-secondary-fixed/70 text-on-secondary-fixed' },
    ...(selectedFaculties?.map((f) => ({ label: f, colorClass: 'bg-primary-fixed text-on-primary-fixed', onDismiss: handleToggleFaculty ? () => handleToggleFaculty(f) : undefined })) ?? []),
    ...(selectedProdis?.map((p) => ({ label: p, colorClass: 'bg-primary-fixed/90 text-on-primary-fixed', onDismiss: handleToggleProdi ? () => handleToggleProdi(p) : undefined })) ?? []),
    ...(selectedYears?.map((y) => ({ label: `Lulus ${y}`, colorClass: 'bg-amber-100 text-amber-900', onDismiss: handleToggleYear ? () => handleToggleYear(y) : undefined })) ?? []),
    ...(selectedPeriode && selectedPeriode !== 'all' ? [{ label: `Periode: ${PERIODE_OPTIONS.find((p) => p.value === selectedPeriode)?.label ?? selectedPeriode}`, colorClass: 'bg-blue-100 text-blue-900', onDismiss: setSelectedPeriode ? () => setSelectedPeriode('all') : undefined }] : []),
    ...(selectedSemester && selectedSemester !== 'all' ? [{ label: `Sem: ${SEMESTER_OPTIONS.find((s) => s.value === selectedSemester)?.label ?? selectedSemester}`, colorClass: 'bg-indigo-100 text-indigo-900', onDismiss: setSelectedSemester ? () => setSelectedSemester('all') : undefined }] : []),
    ...(selectedJenjang && selectedJenjang !== 'all' ? [{ label: selectedJenjang, colorClass: 'bg-purple-100 text-purple-900', onDismiss: setSelectedJenjang ? () => setSelectedJenjang('all') : undefined }] : []),
    ...(selectedPredikat && selectedPredikat !== 'all' ? [{ label: selectedPredikat, colorClass: 'bg-teal-100 text-teal-900', onDismiss: setSelectedPredikat ? () => setSelectedPredikat('all') : undefined }] : []),
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
