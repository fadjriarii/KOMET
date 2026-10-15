import { buildStudentCards } from './buildStudentCards';
import { getRollingAcademicYears } from '@komet/shared/academicYear';
import DashboardPage from '../../../components/common/layout/DashboardPage';
import StudentDataTable from '../components/StudentDataTable';
import StudentDetailModal from '../components/StudentDetailModal';
import AcademicYearFilter from '../../../components/common/filters/AcademicYearFilter';
import { studentFilterForm, useStudentFilters } from '../hooks/useStudentFilters';
import { useStudentKpiDisplay } from '../hooks/useStudentKpiDisplay';
import { useStudentFilterOptions } from '../hooks/useStudentFilterOptions';
import { useSummary, useList } from '../studentQueries';

/** Filter tahun ajaran hidup di header, bukan di grid filter. */
function AcademicYearHeaderFilter({ filters, setters, summaryQuery, options }) {
  return (
    <AcademicYearFilter
      value={filters.tahunAjaran}
      onChange={setters.setTahunAjaran}
      options={options.academicYearOptions || getRollingAcademicYears(5)}
      disabled={summaryQuery.isLoading}
    />
  );
}

export default function StudentsPage() {
  // Pilihan filter datang dari endpoint khusus (di-cache 10 menit), bukan dari summary.
  const { filterOptions } = useStudentFilterOptions();

  return (
    <DashboardPage
      title="Student Data"
      description="Analitik demografi, mahasiswa asing, intake, dan tren fluktuasi 5 tahun."
      useFilters={useStudentFilters}
      filterForm={studentFilterForm}
      useSummary={useSummary}
      useList={useList}
      useKpiDisplay={useStudentKpiDisplay}
      buildCards={buildStudentCards}
      Table={StudentDataTable}
      DetailModal={StudentDetailModal}
      filterOptions={filterOptions}
      headerExtra={AcademicYearHeaderFilter}
    />
  );
}
