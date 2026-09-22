import React from 'react';
import { FilterMultiSelectDropdown } from '@/components/common/FilterMultiSelectDropdown';
import {
  SEMESTER_OPTIONS,
  STATUS_OPTIONS,
  NATIONALITY_OPTIONS,
  PERIODE_TERM_OPTIONS,
} from '../hooks/useStudentFilters';

export const StudentFilterBar = ({
  searchTerm,
  setSearchTerm,
  timeHorizon,
  setTimeHorizon,
  selectedCustomYears,
  availableYears,
  handleSelectAllCustomYears,
  handleClearCustomYears,
  handleToggleCustomYear,
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
  selectedAngkatan,
  handleToggleAngkatan,
  handleSelectAllAngkatan,
  handleClearAngkatan,
  selectedSemesters,
  handleToggleSemester,
  handleSelectAllSemesters,
  handleClearSemesters,
  nationalityFilter,
  setNationalityFilter,
  statusFilter,
  setStatusFilter,
  periodeTermFilter,
  setPeriodeTermFilter,
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
              <span className={`w-2 h-2 rounded-full ${timeHorizon === 'last5' ? 'bg-primary' : 'bg-outline-variant'}`}></span>
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
              <span className={`w-1.5 h-1.5 rounded-full ${timeHorizon === 'custom' ? 'bg-primary' : 'bg-outline-variant'}`}></span>
              <span>Custom (Pilih Tahun)</span>
              {timeHorizon === 'custom' && selectedCustomYears.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-primary text-on-primary">
                  {selectedCustomYears.length}
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
              <span className={`w-1.5 h-1.5 rounded-full ${timeHorizon === 'all' ? 'bg-primary' : 'bg-outline-variant'}`}></span>
              <span>All Time</span>
            </button>
          </div>
        </div>

        {/* Custom Cohort Selection Checkbox Panel */}
        {timeHorizon === 'custom' && (
          <div className="bg-surface-container-low/70 border border-outline-variant/30 rounded-lg p-3 flex flex-col gap-2.5 animate-dropdown-pop">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">checklist</span>
                <span>Pilih Tahun Angkatan (Cohort):</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllCustomYears}
                  className="text-[11px] text-primary font-semibold hover:underline cursor-pointer"
                >
                  Pilih Semua
                </button>
                <span className="text-outline-variant">•</span>
                <button
                  type="button"
                  onClick={handleClearCustomYears}
                  className="text-[11px] text-on-surface-variant font-medium hover:text-red-600 hover:underline cursor-pointer"
                >
                  Bersihkan
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {availableYears.map((yr) => {
                const isChecked = selectedCustomYears.includes(yr);
                return (
                  <label
                    key={yr}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer select-none transition-all ${
                      isChecked
                        ? 'bg-primary text-on-primary font-bold shadow-xs'
                        : 'bg-surface border border-outline-variant/40 hover:bg-surface-container text-on-surface'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={isChecked}
                      onChange={() => handleToggleCustomYear(yr)}
                    />
                    <span>{yr}</span>
                    {isChecked && (
                      <span className="material-symbols-outlined text-[14px]">check</span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main Search and Dropdowns Grid */}
      <div className="space-y-3">
        {/* Row 1: Search, Fakultas, Program Studi */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
              Search by Identifier
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[18px]">
                search
              </span>
              <input
                id="filter-search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-surface rounded-lg border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                placeholder="Search student name or NIM..."
                type="text"
              />
            </div>
          </div>

          <FilterMultiSelectDropdown
            id="filter-faculty-btn"
            label="Fakultas"
            placeholder="All Faculties"
            options={facultyOptions}
            selectedValues={selectedFaculties}
            onToggle={handleToggleFaculty}
            onSelectAll={handleSelectAllFaculties}
            onClear={handleClearFaculties}
          />

          <FilterMultiSelectDropdown
            id="filter-prodi-btn"
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

        {/* Row 2: Angkatan, Periode, Semester, Kewarganegaraan, Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <FilterMultiSelectDropdown
            id="filter-angkatan-btn"
            label="Angkatan (Cohort)"
            placeholder="Semua Angkatan"
            options={availableYears}
            selectedValues={selectedAngkatan}
            onToggle={handleToggleAngkatan}
            onSelectAll={handleSelectAllAngkatan}
            onClear={handleClearAngkatan}
          />

          {/* Periode Masuk */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
              Periode Masuk
            </label>
            <select
              id="filter-periode-term"
              value={periodeTermFilter}
              onChange={(e) => setPeriodeTermFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-surface rounded-lg border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors cursor-pointer text-on-surface"
            >
              {PERIODE_TERM_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <FilterMultiSelectDropdown
            id="filter-semester-btn"
            label="Semester"
            placeholder="Semua Semester"
            options={SEMESTER_OPTIONS}
            selectedValues={selectedSemesters}
            onToggle={handleToggleSemester}
            onSelectAll={handleSelectAllSemesters}
            onClear={handleClearSemesters}
          />

          {/* Kewarganegaraan */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
              Kewarganegaraan
            </label>
            <select
              id="filter-nationality"
              value={nationalityFilter}
              onChange={(e) => setNationalityFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-surface rounded-lg border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors cursor-pointer text-on-surface"
            >
              {NATIONALITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Keaktifan */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
              Status Keaktifan
            </label>
            <select
              id="filter-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-surface rounded-lg border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors cursor-pointer text-on-surface"
            >
              {STATUS_OPTIONS.map((opt) => (
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
