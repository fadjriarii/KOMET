import { SlidersHorizontal, RotateCcw } from 'lucide-react';
import FilterContainerCard from '../../../../components/common/cards/FilterContainerCard';
import StudentSearchFilter from './StudentSearchFilter';
import StudentFacultyFilter from './StudentFacultyFilter';
import StudentProdiFilter from './StudentProdiFilter';
import StudentJenjangFilter from './StudentJenjangFilter';
import StudentAngkatanFilter from './StudentAngkatanFilter';
import StudentSemesterFilter from './StudentSemesterFilter';
import StudentNationalityFilter from './StudentNationalityFilter';
import StudentStatusFilter from './StudentStatusFilter';
import StudentPeriodeFilter from './StudentPeriodeFilter';

/**
 * StudentFilterContainer - Modular Filter Container lengkap khusus modul Student Data
 * 
 * Layout:
 * - Header: Judul filter terpadu & badge filter aktif
 * - Baris 1 (4 Bagian: 40% - 20% - 20% - 20%):
 *   1. Search by Identifier (40% / 2 kolom dari 5)
 *   2. Fakultas (20% / 1 kolom)
 *   3. Program Studi (20% / 1 kolom)
 *   4. Jenjang (20% / 1 kolom)
 * - Baris 2 (5 Bagian):
 *   1. Angkatan (Checkbox 5 tahun rolling + All Time)
 *   2. Semester
 *   3. Kewarganegaraan
 *   4. Status Keaktifan
 *   5. Periode Masuk (Ganjil / Genap)
 * - Footer: Tombol Reset Filter di Kanan Bawah
 */
export default function StudentFilterContainer({
  // Baris 1
  searchValue = '',
  onSearchChange,
  onSearchClear,
  facultyValue = '',
  onFacultyChange,
  facultyOptions = [],
  prodiValue = '',
  onProdiChange,
  prodiOptions = [],
  jenjangValue = '',
  onJenjangChange,
  jenjangOptions = [],

  // Baris 2
  selectedYears = [],
  onAngkatanChange,
  rollingYears = ['2026', '2025', '2024', '2023', '2022'],
  semesterValue = '',
  onSemesterChange,
  semesterOptions = [],
  nationalityValue = '',
  onNationalityChange,
  nationalityOptions = [],
  statusValue = '',
  onStatusChange,
  statusOptions = [],
  periodeValue = '',
  onPeriodeChange,
  periodeOptions = [],

  // Reset Callback
  onResetAll,

  isLoading = false,
  className = '',
  children,
}) {
  // Hitung jumlah filter yang sedang aktif
  const activeCount = [
    Boolean(searchValue),
    Boolean(facultyValue),
    Boolean(prodiValue),
    Boolean(jenjangValue),
    selectedYears.length > 0,
    Boolean(semesterValue),
    Boolean(nationalityValue),
    Boolean(statusValue),
    Boolean(periodeValue),
  ].filter(Boolean).length;

  const handleReset = () => {
    onSearchChange?.('');
    onFacultyChange?.('');
    onProdiChange?.('');
    onJenjangChange?.('');
    onAngkatanChange?.([]);
    onSemesterChange?.('');
    onNationalityChange?.('');
    onStatusChange?.('');
    onPeriodeChange?.('');
    onResetAll?.();
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
                  <span>Filter & Pencarian Mahasiswa</span>
                  {activeCount > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-digital-blue-50 text-digital-blue-700 border border-digital-blue-200/70 animate-fade-in">
                      {activeCount} filter aktif
                    </span>
                  )}
                </h3>
              </div>
            </div>
          </div>

          {/* Baris 1: Search (40%) + Fakultas (20%) + Program Studi (20%) + Jenjang (20%) */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 sm:gap-4.5 w-full items-end">
            {/* Kolom 1: Search by Identifier (40% / col-span-2) */}
            <StudentSearchFilter
              value={searchValue}
              onChange={onSearchChange}
              onClear={onSearchClear}
              disabled={isLoading}
              className="md:col-span-2"
            />

            {/* Kolom 2: Filter Fakultas (20% / col-span-1) */}
            <StudentFacultyFilter
              value={facultyValue}
              onChange={onFacultyChange}
              options={facultyOptions}
              disabled={isLoading}
              className="md:col-span-1"
            />

            {/* Kolom 3: Filter Program Studi (20% / col-span-1) */}
            <StudentProdiFilter
              value={prodiValue}
              onChange={onProdiChange}
              options={prodiOptions}
              disabled={isLoading}
              className="md:col-span-1"
            />

            {/* Kolom 4: Filter Jenjang (20% / col-span-1) */}
            <StudentJenjangFilter
              value={jenjangValue}
              onChange={onJenjangChange}
              options={jenjangOptions}
              disabled={isLoading}
              className="md:col-span-1"
            />
          </div>

          {/* Baris 2: Angkatan (Checkbox) + Semester + Kewarganegaraan + Status Keaktifan + Periode Masuk */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-4.5 w-full items-end pt-1">
            {/* Kolom 1 (di bawah Search): Filter Angkatan Checkbox */}
            <StudentAngkatanFilter
              selectedYears={selectedYears}
              onChange={onAngkatanChange}
              years={rollingYears}
              disabled={isLoading}
            />

            {/* Kolom 2: Filter Semester */}
            <StudentSemesterFilter
              value={semesterValue}
              onChange={onSemesterChange}
              options={semesterOptions}
              disabled={isLoading}
            />

            {/* Kolom 3: Filter Kewarganegaraan */}
            <StudentNationalityFilter
              value={nationalityValue}
              onChange={onNationalityChange}
              options={nationalityOptions}
              disabled={isLoading}
            />

            {/* Kolom 4: Filter Status Keaktifan */}
            <StudentStatusFilter
              value={statusValue}
              onChange={onStatusChange}
              options={statusOptions}
              disabled={isLoading}
            />

            {/* Kolom 5: Filter Periode Masuk (Ganjil / Genap) */}
            <StudentPeriodeFilter
              value={periodeValue}
              onChange={onPeriodeChange}
              options={periodeOptions}
              placeholder="Semua Periode"
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

            {/* Button Reset Filter di Pojok Kanan Bawah */}
            <div className="flex items-center justify-end w-full sm:w-auto">
              <button
                type="button"
                onClick={handleReset}
                disabled={activeCount === 0 || isLoading}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-2xs group ${
                  activeCount > 0
                    ? 'bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 border border-gray-200 hover:border-red-200 active:scale-98'
                    : 'bg-gray-50 text-gray-400 border border-gray-100 cursor-not-allowed opacity-60'
                }`}
                title="Reset semua filter ke kondisi awal"
              >
                <RotateCcw
                  size={14}
                  className={`transition-transform duration-300 ${
                    activeCount > 0 ? 'group-hover:-rotate-45' : ''
                  }`}
                />
                <span>Reset Filter</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </FilterContainerCard>
  );
}
