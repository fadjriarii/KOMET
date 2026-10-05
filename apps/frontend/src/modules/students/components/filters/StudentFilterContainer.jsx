import { Award, BookOpen, Building2 } from 'lucide-react';
import FilterContainerShell from '../../../../components/common/filters/FilterContainerShell';
import FilterField from '../../../../components/common/filters/FilterField';
import StudentAngkatanFilter from './StudentAngkatanFilter';
import StudentSemesterFilter from './StudentSemesterFilter';
import StudentNationalityFilter from './StudentNationalityFilter';
import StudentStatusFilter from './StudentStatusFilter';
import StudentPeriodeFilter from './StudentPeriodeFilter';

/** Data-driven student filter form; field behaviour is shared at the UI layer. */
export default function StudentFilterContainer({
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
        title="Filter & Pencarian Mahasiswa"
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
    selectedYears = [],
    semesterValue = [],
    nationalityValue = '',
    statusValue = [],
    periodeValue = '',
  } = filterValues;
  const {
    facultyOptions = [],
    prodiOptions = [],
    jenjangOptions = [],
    rollingYears = ['2026', '2025', '2024', '2023', '2022'],
    semesterOptions = [],
    nationalityOptions = [],
    statusOptions = [],
    periodeOptions = [],
  } = filterOptions;
  const {
    onSearchChange,
    onSearchClear,
    onFacultyChange,
    onProdiChange,
    onJenjangChange,
    onAngkatanChange,
    onSemesterChange,
    onNationalityChange,
    onStatusChange,
    onPeriodeChange,
  } = filterHandlers;

  return (
    <FilterContainerShell
      title="Filter & Pencarian Mahasiswa"
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
          placeholder="Cari berdasarkan NIM atau Nama..."
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
        />
        <FilterField
          label="Program Studi"
          value={prodiValue}
          onChange={onProdiChange}
          options={prodiOptions}
          placeholder="Semua Program Studi"
          icon={BookOpen}
          disabled={isLoading}
        />
        <FilterField
          label="Jenjang"
          value={jenjangValue}
          onChange={onJenjangChange}
          options={jenjangOptions}
          placeholder="Semua Jenjang"
          icon={Award}
          disabled={isLoading}
          id="filter-jenjang"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-4.5 w-full items-end pt-1">
        <StudentAngkatanFilter
          selectedYears={selectedYears}
          onChange={onAngkatanChange}
          years={rollingYears}
          disabled={isLoading}
        />
        <StudentSemesterFilter
          value={semesterValue}
          onChange={onSemesterChange}
          options={semesterOptions}
          disabled={isLoading}
        />
        <StudentNationalityFilter
          value={nationalityValue}
          onChange={onNationalityChange}
          options={nationalityOptions}
          disabled={isLoading}
        />
        <StudentStatusFilter
          value={statusValue}
          onChange={onStatusChange}
          options={statusOptions}
          disabled={isLoading}
        />
        <StudentPeriodeFilter
          value={periodeValue}
          onChange={onPeriodeChange}
          options={periodeOptions}
          placeholder="Semua Periode"
          disabled={isLoading}
        />
      </div>
    </FilterContainerShell>
  );
}
