import { useEffect, useRef, useState } from 'react';
import { Check, SlidersHorizontal, RotateCcw } from 'lucide-react';
import FilterContainerCard from '../../../../components/common/cards/FilterContainerCard';
import MbkmSearchFilter from './MbkmSearchFilter';
import MbkmFacultyFilter from './MbkmFacultyFilter';
import MbkmProdiFilter from './MbkmProdiFilter';
import MbkmJenjangFilter from './MbkmJenjangFilter';
import MbkmAngkatanFilter from './MbkmAngkatanFilter';
import MbkmPeriodeFilter from './MbkmPeriodeFilter';
import MbkmStatusFilter from './MbkmStatusFilter';

/**
 * MbkmFilterContainer - Modular Filter Container khusus modul MBKM Data
 */
export default function MbkmFilterContainer({
  filterValues = {},
  filterOptions = {},
  filterHandlers = {},
  activeCount = 0,
  onResetAll,
  isLoading = false,
  className = '',
  children,
}) {
  const [resetFlash, setResetFlash] = useState(false);
  const resetTimerRef = useRef(null);

  const {
    searchValue = '',
    facultyValue = [],
    prodiValue = [],
    jenjangValue = [],
    angkatanValue = [],
    statusAktivitasValue = [],
    periodeValue = '',
  } = filterValues;

  const {
    facultyOptions = [],
    prodiOptions = [],
    jenjangOptions = ['S1', 'S2'],
    angkatanOptions = ['2024', '2023', '2022', '2021', '2020'],
    statusAktivitasOptions = ['Disetujui', 'Selesai', 'Diajukan'],
    periodeOptions = [],
  } = filterOptions;

  const {
    onSearchChange,
    onSearchClear,
    onFacultyChange,
    onProdiChange,
    onJenjangChange,
    onAngkatanChange,
    onStatusAktivitasChange,
    onPeriodeChange,
  } = filterHandlers;

  useEffect(() => () => clearTimeout(resetTimerRef.current), []);

  const handleReset = () => {
    onResetAll?.();
    setResetFlash(true);
    clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => setResetFlash(false), 1200);
  };

  return (
    <FilterContainerCard className={className}>
      {children ? (
        children
      ) : (
        <div className="space-y-4 sm:space-y-5 w-full">
          {/* Header Kontainer Filter */}
          <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-digital-blue-50 text-digital-blue-600 flex items-center justify-center">
                <SlidersHorizontal size={16} />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-gray-800 tracking-tight flex items-center gap-2">
                  <span>Filter & Pencarian MBKM</span>
                  {activeCount > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-digital-blue-50 text-digital-blue-700 border border-digital-blue-200/70 animate-fade-in">
                      {activeCount} filter aktif
                    </span>
                  )}
                </h3>
              </div>
            </div>
          </div>

          {/* Baris 1: Search (40% / 2 kolom) + Fakultas (20%) + Program Studi (20%) + Jenjang (20%) */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 sm:gap-4.5 w-full items-end">
            <MbkmSearchFilter
              value={searchValue}
              onChange={onSearchChange}
              onClear={onSearchClear}
              placeholder="Cari berdasarkan NIM, Nama, atau Instansi..."
              disabled={isLoading}
              className="md:col-span-2"
            />

            <MbkmFacultyFilter
              value={facultyValue}
              onChange={onFacultyChange}
              options={facultyOptions}
              disabled={isLoading}
              className="md:col-span-1"
            />

            <MbkmProdiFilter
              value={prodiValue}
              onChange={onProdiChange}
              options={prodiOptions}
              disabled={isLoading}
              className="md:col-span-1"
            />

            <MbkmJenjangFilter
              value={jenjangValue}
              onChange={onJenjangChange}
              options={jenjangOptions}
              disabled={isLoading}
              className="md:col-span-1"
            />
          </div>

          {/* Baris 2: Angkatan + Periode MBKM + Status Aktivitas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-4.5 w-full items-end pt-1">
            <MbkmAngkatanFilter
              selectedYears={angkatanValue}
              onChange={onAngkatanChange}
              years={angkatanOptions}
              disabled={isLoading}
            />

            <MbkmPeriodeFilter
              value={periodeValue}
              onChange={onPeriodeChange}
              options={periodeOptions}
              placeholder="Semua Periode MBKM"
              disabled={isLoading}
            />

            <MbkmStatusFilter
              value={statusAktivitasValue}
              onChange={onStatusAktivitasChange}
              options={statusAktivitasOptions}
              disabled={isLoading}
            />
          </div>

          {/* Baris Paling Bawah: Tombol Reset Filter di Kanan Bawah */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3.5 border-t border-gray-100">
            <div className="text-xs font-medium text-gray-500">
              {activeCount > 0 ? (
                <span className="text-gray-600">
                  Diterapkan <strong className="text-digital-blue-700 font-bold">{activeCount} filter</strong> kustom
                </span>
              ) : (
                <span className="text-gray-400">Seluruh filter dalam kondisi default</span>
              )}
            </div>

            <div className="flex items-center justify-end w-full sm:w-auto">
              <button
                type="button"
                onClick={handleReset}
                disabled={activeCount === 0 || isLoading}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-2xs group ${
                  resetFlash
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : activeCount > 0
                    ? 'bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 border border-gray-200 hover:border-red-200 active:scale-98'
                    : 'bg-gray-50 text-gray-400 border border-gray-100 cursor-not-allowed opacity-60'
                }`}
                title="Reset semua filter ke kondisi awal"
              >
                {resetFlash ? <Check size={14} /> : (
                  <RotateCcw
                    size={14}
                    className={`transition-transform duration-300 ${
                      activeCount > 0 ? 'group-hover:-rotate-45' : ''
                    }`}
                  />
                )}
                <span>{resetFlash ? 'Filter direset' : 'Reset Filter'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </FilterContainerCard>
  );
}
