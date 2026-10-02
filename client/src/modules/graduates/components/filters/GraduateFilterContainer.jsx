import { Award, BookOpen, Building2 } from 'lucide-react';
import FilterContainerShell from '../../../../components/common/filters/FilterContainerShell';
import FilterField from '../../../../components/common/filters/FilterField';
import GraduateTahunLulusFilter from './GraduateTahunLulusFilter';
import GraduatePeriodeWisudaFilter from './GraduatePeriodeWisudaFilter';
import GraduateStatusFilter from './GraduateStatusFilter';
import GraduatePeriodeMasukFilter from './GraduatePeriodeMasukFilter';

/** Data-driven graduate filter form; specialised fields remain feature-local. */
export default function GraduateFilterContainer({
  filterValues = {}, filterOptions = {}, filterHandlers = {}, activeCount = 0,
  onResetAll, isLoading = false, className = '', children,
}) {
  if (children) return <FilterContainerShell title="Filter & Pencarian Lulusan" activeCount={activeCount} onResetAll={onResetAll} isLoading={isLoading} className={className}>{children}</FilterContainerShell>;

  const { searchValue = '', facultyValue = [], prodiValue = [], jenjangValue = [], tahunLulusValue = [], periodeWisudaValue = [], statusKelulusanValue = [], periodeMasukValue = '' } = filterValues;
  const { facultyOptions = [], prodiOptions = [], jenjangOptions = ['S1', 'S2'], tahunLulusOptions = ['2025', '2024', '2023', '2022', '2021'], periodeWisudaOptions = [], statusKelulusanOptions = [], periodeMasukOptions = [] } = filterOptions;
  const { onSearchChange, onSearchClear, onFacultyChange, onProdiChange, onJenjangChange, onTahunLulusChange, onPeriodeWisudaChange, onStatusKelulusanChange, onPeriodeMasukChange } = filterHandlers;

  return (
    <FilterContainerShell title="Filter & Pencarian Lulusan" activeCount={activeCount} onResetAll={onResetAll} isLoading={isLoading} className={className}>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 sm:gap-4.5 w-full items-end">
        <FilterField type="search" value={searchValue} onChange={onSearchChange} onClear={onSearchClear} placeholder="Cari berdasarkan NIM atau Nama wisudawan..." disabled={isLoading} className="md:col-span-2" />
        <FilterField label="Fakultas" value={facultyValue} onChange={onFacultyChange} options={facultyOptions} placeholder="Semua Fakultas" icon={Building2} disabled={isLoading} id="graduate-filter-faculty" />
        <FilterField label="Program Studi" value={prodiValue} onChange={onProdiChange} options={prodiOptions} placeholder="Semua Program Studi" icon={BookOpen} disabled={isLoading} id="graduate-filter-prodi" />
        <FilterField label="Jenjang" value={jenjangValue} onChange={onJenjangChange} options={jenjangOptions} placeholder="Semua Jenjang" icon={Award} disabled={isLoading} id="graduate-filter-jenjang" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-4.5 w-full items-end pt-1">
        <GraduateTahunLulusFilter selectedYears={tahunLulusValue} onChange={onTahunLulusChange} years={tahunLulusOptions} disabled={isLoading} />
        <GraduatePeriodeWisudaFilter value={periodeWisudaValue} onChange={onPeriodeWisudaChange} options={periodeWisudaOptions} disabled={isLoading} />
        <GraduateStatusFilter value={statusKelulusanValue} onChange={onStatusKelulusanChange} options={statusKelulusanOptions} disabled={isLoading} />
        <GraduatePeriodeMasukFilter value={periodeMasukValue} onChange={onPeriodeMasukChange} options={periodeMasukOptions} placeholder="Semua Periode Masuk" disabled={isLoading} />
      </div>
    </FilterContainerShell>
  );
}
