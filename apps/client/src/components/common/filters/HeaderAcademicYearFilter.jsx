import { getRollingAcademicYears } from '@komet/shared/academicYear';
import AcademicYearFilter from './AcademicYearFilter';

/**
 * Pemilih tahun ajaran tab Lulusan — nilai hidup di URL lewat field
 * `tahunAjaran` pada useGraduateFilters (sama pola dengan tab Student).
 * Opsi dari `filterOptions.academicYearOptions` summary (tahun ajaran
 * yang benar-benar ada di data lulusan); fallback rolling dipakai
 * sebelum summary termuat.
 */
export default function HeaderAcademicYearFilter({ filters, setters, summaryQuery, options }) {
  return (
    <AcademicYearFilter
      value={filters.tahunAjaran}
      onChange={setters.setTahunAjaran}
      options={options?.academicYearOptions || getRollingAcademicYears(5)}
      disabled={summaryQuery?.isLoading}
    />
  );
}
