import { AlertCircle, Globe, TrendingDown, TrendingUp, UserPlus, Users } from 'lucide-react';
import { getRollingAcademicYears } from '@komet/shared/academicYear';
import DashboardPage from '../../../components/common/layout/DashboardPage';
import { formatKpiDisplay } from '../../../utils/uiHelpers';
import StudentDataTable from '../components/StudentDataTable';
import StudentDetailModal from '../components/StudentDetailModal';
import StudentAcademicYearFilter from '../components/header/StudentAcademicYearFilter';
import { studentFilterForm, useStudentFilters } from '../hooks/useStudentFilters';
import { useStudentKpiDisplay } from '../hooks/useStudentKpiDisplay';
import { useStudentFilterOptions } from '../hooks/useStudentFilterOptions';
import { useSummary, useList } from '../studentQueries';

function buildCards({
  kpis,
  activeStudentPresentation,
  displaySubtitles,
  declineTrendStyle,
  kpiScope,
  isReady,
  openModal,
}) {
  return [
    {
      key: 'active',
      title: activeStudentPresentation.cardTitle,
      value: formatKpiDisplay(kpis.formattedActiveCount),
      subtitle: displaySubtitles.activeSubtitle,
      icon: Users,
      badge: activeStudentPresentation.cardBadge,
      onViewDetails: (event) => openModal('active', event),
      isFiltered: kpiScope.active && isReady,
    },
    {
      key: 'foreign',
      title: 'Persentase Mahasiswa Internasional',
      value: formatKpiDisplay(kpis.foreignRate),
      subtitle: displaySubtitles.foreignSubtitle,
      icon: Globe,
      badge: 'Non-WNI Aktif',
      onViewDetails: (event) => openModal('foreign', event),
      isFiltered: kpiScope.foreign && isReady,
    },
    {
      key: 'intake',
      title: 'Intake Mahasiswa Baru',
      value: formatKpiDisplay(kpis.formattedIntakeCount),
      subtitle: displaySubtitles.intakeSubtitle,
      icon: UserPlus,
      badge: 'Mhs Semester 1',
      onViewDetails: (event) => openModal('intake', event),
      isFiltered: kpiScope.intake && isReady,
    },
    {
      key: 'decline',
      title: 'Penurunan Mhs Baru (5 Thn)',
      value: kpis.declineAvg,
      subtitle: displaySubtitles.declineSubtitle,
      icon:
        kpis.hasEnoughDeclineData === false
          ? AlertCircle
          : kpis.isFluctuationPositive
            ? TrendingUp
            : TrendingDown,
      valueClassName: declineTrendStyle.textClass,
      badge: kpis.hasEnoughDeclineData === false ? 'Data Belum Cukup' : '5-Year Avg',
      onViewDetails: (event) => openModal('decline', event),
      isFiltered: kpiScope.decline && isReady,
    },
  ];
}

/** Filter tahun ajaran hidup di header, bukan di grid filter. */
function AcademicYearHeaderFilter({ filters, setters, summaryQuery, options }) {
  return (
    <StudentAcademicYearFilter
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
      buildCards={buildCards}
      Table={StudentDataTable}
      DetailModal={StudentDetailModal}
      filterOptions={filterOptions}
      headerExtra={AcademicYearHeaderFilter}
    />
  );
}
