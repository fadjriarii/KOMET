import React from 'react';
import { FilterMultiSelectDropdown } from '@/components/common/FilterMultiSelectDropdown';
import {
  PERIODE_OPTIONS,
  SEMESTER_OPTIONS,
  JENJANG_OPTIONS,
  PREDIKAT_OPTIONS,
} from '../hooks/useGraduateFilters';

export const GraduateFilterBar = ({
  searchTerm,
  setSearchTerm,
  timeHorizon,
  setTimeHorizon,
  selectedCustomAngkatan,
  availableAngkatans,
  handleSelectAllCustomAngkatan,
  handleClearCustomAngkatan,
  handleToggleCustomAngkatan,
  selectedFaculties,
  facultyOptions,
  handleToggleFaculty,
  handleSelectAllFaculties,
  handleClearFaculties,
  selectedProdis,
  prodiOptions,
  handleToggleProdi,
  handleSelectAllProdis,
  handleClearProdis,
  selectedYears,
  availableYears,
  handleToggleYear,
  handleSelectAllYears,
  handleClearYears,
  selectedPeriode,
  setSelectedPeriode,
  selectedSemester,
  setSelectedSemester,
  selectedJenjang,
  setSelectedJenjang,
  selectedPredikat,
  setSelectedPredikat,
}) => {
  return (
    <div className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-4 sm:p-5 shadow-[0_1px_4px_rgba(0,0,0,0.03)] mb-2 space-y-4">
      {/* Longitudinal Time Horizon Bar */}
      <div className="flex flex-col gap-3 pb-3 border-b border-surface-container-high">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
            <span className="material-symbols-outlined text-primary text-[18px]">history_toggle_off</span>
            <span>LONGITUDINAL TIME HORIZON:</span>
          </div>
          <div className="inline-flex bg-surface-container-low p-1 rounded-lg border border-outline-variant/30 text-xs font-medium">
            <button
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                timeHorizon === 'last5'
                  ? 'bg-surface-container-lowest text-primary font-bold shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              type="button"
              onClick={() => setTimeHorizon('last5')}
            >
              <span className={`w-2 h-2 rounded-full ${timeHorizon === 'last5' ? 'bg-primary' : 'bg-outline-variant'}`} />
              <span>Last 5 Years (KPI Focus)</span>
            </button>

            <button
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                timeHorizon === 'custom'
                  ? 'bg-surface-container-lowest text-primary font-bold shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              type="button"
              onClick={() => setTimeHorizon('custom')}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${timeHorizon === 'custom' ? 'bg-primary' : 'bg-outline-variant'}`} />
              <span>Custom (Pilih Tahun)</span>
              {timeHorizon === 'custom' && selectedCustomAngkatan.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-primary text-on-primary">
                  {selectedCustomAngkatan.length}
                </span>
              )}
            </button>

            <button
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                timeHorizon === 'all'
                  ? 'bg-surface-container-lowest text-primary font-bold shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              type="button"
              onClick={() => setTimeHorizon('all')}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${timeHorizon === 'all' ? 'bg-primary' : 'bg-outline-variant'}`} />
              <span>All Time</span>
            </button>
          </div>
        </div>

        {timeHorizon === 'custom' && (
          <div className="bg-surface-container-low/70 border border-outline-variant/30 rounded-lg p-3 flex flex-col gap-2.5 animate-dropdown-pop">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">checklist</span>
                <span>Pilih Angkatan (Cohort):</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllCustomAngkatan}
                  className="text-[11px] text-primary font-semibold hover:underline cursor-pointer"
                >
                  Pilih Semua
                </button>
                <span className="text-outline-variant">•</span>
                <button
                  type="button"
                  onClick={handleClearCustomAngkatan}
                  className="text-[11px] text-on-surface-variant font-medium hover:text-red-600 hover:underline cursor-pointer"
                >
                  Bersihkan
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {availableAngkatans.map((yr) => {
                const isChecked = selectedCustomAngkatan.includes(yr);
                return (
                  <label
                    key={yr}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all select-none ${
                      isChecked
                        ? 'bg-primary/10 border-primary text-primary font-bold shadow-xs'
                        : 'bg-surface-container-lowest border-outline-variant/50 text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleCustomAngkatan(yr)}
                      className="rounded border-outline text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer accent-primary"
                    />
                    <span>Angkatan {yr}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {/* Top Row: Search Identifier (left), Fakultas (middle), Program Studi (right) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 relative">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
              Search Identifier
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[18px]">
                search
              </span>
              <input
                id="filter-graduate-search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-surface rounded-lg border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                placeholder="Search graduate name, NIM, or study program..."
                type="text"
              />
            </div>
          </div>

          <FilterMultiSelectDropdown
            id="filter-graduate-faculty-btn"
            label="Fakultas"
            placeholder="All Faculties"
            options={facultyOptions}
            selectedValues={selectedFaculties}
            onToggle={handleToggleFaculty}
            onSelectAll={handleSelectAllFaculties}
            onClear={handleClearFaculties}
          />

          <FilterMultiSelectDropdown
            id="filter-graduate-prodi-btn"
            label="Program Studi"
            placeholder="All Programs"
            options={prodiOptions}
            selectedValues={selectedProdis}
            onToggle={handleToggleProdi}
            onSelectAll={handleSelectAllProdis}
            onClear={handleClearProdis}
            align="right"
          />
        </div>

        {/* Bottom Row: Tahun Lulus, Periode Masuk, Semester, Degree Level (Jenjang), Predikat Kelulusan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <FilterMultiSelectDropdown
            id="filter-graduate-year-btn"
            label="Tahun Lulus"
            placeholder="Semua Tahun Lulus"
            options={availableYears}
            selectedValues={selectedYears}
            onToggle={handleToggleYear}
            onSelectAll={handleSelectAllYears}
            onClear={handleClearYears}
          />

          {/* Periode Masuk */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
              Periode Masuk
            </label>
            <select
              id="filter-graduate-periode"
              value={selectedPeriode}
              onChange={(e) => setSelectedPeriode(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-surface rounded-lg border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors cursor-pointer text-on-surface"
            >
              {PERIODE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Semester Kelulusan */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
              Semester Kelulusan
            </label>
            <select
              id="filter-graduate-semester"
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-surface rounded-lg border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors cursor-pointer text-on-surface"
            >
              {SEMESTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Degree Level (Jenjang) */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
              Jenjang
            </label>
            <select
              id="filter-graduate-jenjang"
              value={selectedJenjang}
              onChange={(e) => setSelectedJenjang(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-surface rounded-lg border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors cursor-pointer text-on-surface"
            >
              {JENJANG_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Predikat Kelulusan */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
              Predikat
            </label>
            <select
              id="filter-graduate-predikat"
              value={selectedPredikat}
              onChange={(e) => setSelectedPredikat(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-surface rounded-lg border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors cursor-pointer text-on-surface"
            >
              {PREDIKAT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
