import { getRollingAcademicYears } from '@komet/shared/academicYear';
import AcademicYearFilter from './AcademicYearFilter';

/**
 * Pemilih tahun ajaran tab Lulusan — nilai hidup di URL lewat field
 * `tahunAjaran` pada useGraduateFilters (sama pola dengan tab Student).
 */
export default function HeaderAcademicYearFilter({ filters, setters, summaryQuery }) {
  return (
    <AcademicYearFilter
      value={filters.tahunAjaran}
      onChange={setters.setTahunAjaran}
      options={getRollingAcademicYears(5)}
      disabled={summaryQuery?.isLoading}
    />
  );
}
