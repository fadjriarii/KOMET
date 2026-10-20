import { getRollingAcademicYears } from '@komet/shared/academicYear';
import AcademicYearFilter from './AcademicYearFilter';

/**
 * Pemilih tahun ajaran header untuk tab Lulusan dan MBKM — nilai hidup di URL
 * lewat field `tahunAjaran` pada hook filter masing-masing (sama pola dengan
 * tab Student). Opsi dari `filterOptions.academicYearOptions` summary; fallback
 * rolling dipakai sebelum summary termuat.
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
