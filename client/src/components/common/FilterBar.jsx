// Filter bar universal — horizon waktu, pencarian, fakultas, prodi, dan slot filter domain-spesifik
// Props: searchTerm, setSearchTerm, searchPlaceholder, timeHorizon, setTimeHorizon,
//        customItems, selectedCustomItems, onToggleCustom, onSelectAllCustom, onClearCustom,
//        facultyOptions, selectedFaculties, onToggleFaculty, onSelectAllFaculties, onClearFaculties,
//        prodiOptions, selectedProdis, onToggleProdi, onSelectAllProdis, onClearProdis,
//        extraFilters (ReactNode — slot filter domain-spesifik)
import React, { useState } from 'react';
import { FilterMultiSelectDropdown } from './FilterMultiSelectDropdown';

const FilterBar = ({
  searchTerm = '',
  setSearchTerm,
  searchPlaceholder = 'Cari NIM atau nama...',
  timeHorizon = 'last5',
  setTimeHorizon,
  customItems = [],
  selectedCustomItems = [],
  onToggleCustom,
  onSelectAllCustom,
  onClearCustom,
  customLabel = 'Pilih Angkatan',
  facultyOptions = [],
  selectedFaculties = [],
  onToggleFaculty,
  onSelectAllFaculties,
  onClearFaculties,
  prodiOptions = [],
  selectedProdis = [],
  onToggleProdi,
  onSelectAllProdis,
  onClearProdis,
  extraFilters,
}) => {
  // Ekspansi panel angkatan custom dikelola lokal
  const [customExpanded, setCustomExpanded] = useState(false);

  return (
    <div className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-4 sm:p-5 shadow-[0_1px_4px_rgba(0,0,0,0.03)] mb-2 space-y-4">
      {/* Toggle horizon waktu */}
      <div className="flex flex-col gap-3 pb-3 border-b border-surface-container-high">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mr-1">
            Rentang:
          </span>
          {[
            { value: 'last5', label: '5 Cohort Terakhir' },
            { value: 'custom', label: 'Pilih Sendiri' },
            { value: 'all', label: 'Semua Waktu' },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { setTimeHorizon(opt.value); if (opt.value === 'custom') setCustomExpanded(true); }}
              className={[
                'px-3 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer',
                timeHorizon === opt.value
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-surface border-outline-variant/50 text-on-surface-variant hover:bg-surface-container',
              ].join(' ')}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Panel angkatan custom — tampil hanya saat mode custom aktif */}
        {timeHorizon === 'custom' && customItems.length > 0 && (
          <div className="animate-dropdown-pop">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-on-surface-variant">{customLabel}</span>
              <div className="flex gap-3 text-[11px]">
                <button type="button" onClick={onSelectAllCustom} className="text-primary font-semibold hover:underline cursor-pointer">Pilih Semua</button>
                <button type="button" onClick={onClearCustom} className="text-on-surface-variant hover:text-red-600 hover:underline cursor-pointer">Kosongkan</button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {customItems.map((item) => {
                const selected = selectedCustomItems.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => onToggleCustom(item)}
                    className={[
                      'px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer',
                      selected
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-surface border-outline-variant/50 text-on-surface-variant hover:bg-surface-container',
                    ].join(' ')}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Baris pencarian + Fakultas + Prodi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div className="md:col-span-2 relative">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
            Pencarian
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-outline pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-3 py-2 text-sm bg-surface rounded-lg border border-outline-variant/50 hover:bg-surface-container/40 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-outline hover:text-on-surface cursor-pointer"
              >
                close
              </button>
            )}
          </div>
        </div>

        <FilterMultiSelectDropdown
          id="filter-faculty"
          label="Fakultas"
          placeholder="Semua Fakultas"
          options={facultyOptions}
          selectedValues={selectedFaculties}
          onToggle={onToggleFaculty}
          onSelectAll={onSelectAllFaculties}
          onClear={onClearFaculties}
          width="w-72"
        />

        <FilterMultiSelectDropdown
          id="filter-prodi"
          label="Program Studi"
          placeholder="Semua Prodi"
          options={prodiOptions}
          selectedValues={selectedProdis}
          onToggle={onToggleProdi}
          onSelectAll={onSelectAllProdis}
          onClear={onClearProdis}
          width="w-72"
        />
      </div>

      {/* Slot filter domain-spesifik — dirender oleh halaman masing-masing */}
      {extraFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-1 border-t border-surface-container-high">
          {extraFilters}
        </div>
      )}
    </div>
  );
};

export default FilterBar;
