import { Award, BookOpen, Building2 } from 'lucide-react';
import FilterContainerShell from '../../../../components/common/filters/FilterContainerShell';
import FilterField from '../../../../components/common/filters/FilterField';
import MbkmAngkatanFilter from './MbkmAngkatanFilter';
import MbkmPeriodeFilter from './MbkmPeriodeFilter';
import MbkmStatusFilter from './MbkmStatusFilter';

/** Data-driven MBKM filter form with shared search and multi-select fields. */
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
  if (children)
    return (
      <FilterContainerShell
        title="Filter & Pencarian MBKM"
        activeCount={activeCount}
        onResetAll={onResetAll}
        isLoading={isLoading}
        className={className}
      >
        {children}
      </FilterContainerShell>
    );

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

  return (
    <FilterContainerShell
      title="Filter & Pencarian MBKM"
      activeCount={activeCount}
      onResetAll={onResetAll}
      isLoading={isLoading}
      className={className}
    >
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 sm:gap-4.5 w-full items-end">
        <FilterField
          type="search"
          value={searchValue}
          onChange={onSearchChange}
          onClear={onSearchClear}
          placeholder="Cari berdasarkan NIM, Nama, atau Instansi..."
          disabled={isLoading}
          className="md:col-span-2"
        />
        <FilterField
          label="Fakultas"
          value={facultyValue}
          onChange={onFacultyChange}
          options={facultyOptions}
          placeholder="Semua Fakultas"
          icon={Building2}
          disabled={isLoading}
          id="mbkm-filter-faculty"
        />
        <FilterField
          label="Program Studi"
          value={prodiValue}
          onChange={onProdiChange}
          options={prodiOptions}
          placeholder="Semua Program Studi"
          icon={BookOpen}
          disabled={isLoading}
          id="mbkm-filter-prodi"
        />
        <FilterField
          label="Jenjang"
          value={jenjangValue}
          onChange={onJenjangChange}
          options={jenjangOptions}
          placeholder="Semua Jenjang"
          icon={Award}
          disabled={isLoading}
          id="mbkm-filter-jenjang"
        />
      </div>
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
    </FilterContainerShell>
  );
}
