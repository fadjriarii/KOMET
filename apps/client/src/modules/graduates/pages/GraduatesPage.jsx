import { Award, BookOpenCheck, Clock, GraduationCap, Hourglass } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import DashboardPage from '../../../components/common/dashboard/DashboardPage';
import HeaderAcademicYearFilter from '../../../components/common/filters/HeaderAcademicYearFilter';
import { formatKpiDisplay } from '../../../utils/uiHelpers';
import GraduateDataTable from '../components/GraduateDataTable';
import GraduateDetailModal from '../components/GraduateDetailModal';
import { graduateFilterForm, useGraduateFilters } from '../hooks/useGraduateFilters';
import { useGraduateFilterOptions } from '../hooks/useGraduateFilterOptions';
import { useGraduateKpiDisplay } from '../hooks/useGraduateKpiDisplay';
import { useSummary, useList } from '../graduateQueries';

function buildCards({ kpis, displaySubtitles, studyLengthTiles, kpiScope, isReady, openModal }) {
  return [
    // Kartu unggulan: rincian per jenjang butuh ruang lebih (2 × 2 di desktop).
    {
      key: 'studyLength',
      featured: true,
      title: 'Rata-rata Masa Studi Lulusan',
      caption: 'Durasi kelulusan menurut jenjang program',
      value: formatKpiDisplay(kpis.studyLengthDisplay),
      breakdown: studyLengthTiles,
      subtitle: displaySubtitles.studyLength,
      icon: Hourglass,
      badge: 'Maks. 2 Semester Cuti',
      onViewDetails: (event) => openModal('studyLength', event),
      isFiltered: kpiScope.studyLength && isReady,
    },
    {
      key: 'total',
      title: 'Total Lulusan',
      value: formatKpiDisplay(kpis.totalGraduates),
      subtitle: displaySubtitles.total,
      icon: GraduationCap,
      badge: displaySubtitles.totalScope || 'Semua Tahun',
      onViewDetails: (event) => openModal('total', event),
      isFiltered: kpiScope.total && isReady,
    },
    {
      key: 'gpa',
      title: 'Rata-rata IPK Lulusan',
      value: formatKpiDisplay(kpis.gpaDisplay),
      subtitle: displaySubtitles.gpa,
      icon: Award,
      badge: 'Skala 4.00',
      onViewDetails: (event) => openModal('gpa', event),
      isFiltered: kpiScope.gpa && isReady,
    },
    {
      key: 'onTime',
      title: 'Kelulusan Tepat Waktu',
      value: formatKpiDisplay(kpis.onTimeDisplay),
      subtitle: displaySubtitles.onTime,
      icon: Clock,
      badge: 'Masa Studi Standar',
      onViewDetails: (event) => openModal('onTime', event),
      isFiltered: kpiScope.onTime && isReady,
    },
    {
      key: 'studySuccess',
      title: 'Keberhasilan Studi',
      value: formatKpiDisplay(kpis.studySuccessDisplay),
      subtitle: displaySubtitles.studySuccess,
      icon: BookOpenCheck,
      badge: 'Evaluasi Akhir Studi',
      onViewDetails: (event) => openModal('studySuccess', event),
      isFiltered: kpiScope.studySuccess && isReady,
    },
  ];
}

export default function GraduatesPage() {
  const [searchParams] = useSearchParams();
  const { filterOptions, isLoading: isFilterOptionsLoading } = useGraduateFilterOptions(
    searchParams.get('tahunAjaran'),
  );

  return (
    <DashboardPage
      title="Graduate Data"
      description="Statistik kelulusan, IPK, masa studi, dan kelulusan tepat waktu mahasiswa."
      useFilters={useGraduateFilters}
      filterForm={graduateFilterForm}
      useSummary={useSummary}
      useList={useList}
      useKpiDisplay={useGraduateKpiDisplay}
      buildCards={buildCards}
      Table={GraduateDataTable}
      DetailModal={GraduateDetailModal}
      filterOptions={filterOptions}
      waitForFilterOptions={isFilterOptionsLoading}
      headerExtra={HeaderAcademicYearFilter}
    />
  );
}
