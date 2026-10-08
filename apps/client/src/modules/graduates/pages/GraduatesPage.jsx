import { Award, BookOpenCheck, Clock, GraduationCap } from 'lucide-react';
import DashboardPage from '../../../components/common/layout/DashboardPage';
import HeaderAcademicYearFilter from '../../../components/common/filters/HeaderAcademicYearFilter';
import { formatKpiDisplay } from '../../../utils/uiHelpers';
import GraduateDataTable from '../components/GraduateDataTable';
import GraduateDetailModal from '../components/GraduateDetailModal';
import { graduateFilterForm, useGraduateFilters } from '../hooks/useGraduateFilters';
import { useGraduateKpiDisplay } from '../hooks/useGraduateKpiDisplay';
import { useSummary, useList } from '../graduateQueries';

function buildCards({ kpis, displaySubtitles, kpiScope, isReady, openModal }) {
  return [
    {
      key: 'total',
      title: 'Total Wisudawan',
      value: formatKpiDisplay(kpis.totalGraduates),
      subtitle: displaySubtitles.total,
      icon: GraduationCap,
      badge: '5 Tahun Terakhir',
      onViewDetails: (event) => openModal('total', event),
      isFiltered: kpiScope.total && isReady,
    },
    {
      key: 'gpa',
      title: 'Rata-rata IPK Lulusan',
      value: formatKpiDisplay(kpis.averageGpaS1),
      subtitle: displaySubtitles.gpa,
      icon: Award,
      badge: 'Skala 4.00',
      onViewDetails: (event) => openModal('gpa', event),
      isFiltered: kpiScope.gpa && isReady,
    },
    {
      key: 'onTime',
      title: 'Kelulusan Tepat Waktu',
      value: formatKpiDisplay(kpis.onTimeGraduationRateS1),
      subtitle: displaySubtitles.onTime,
      icon: Clock,
      badge: 'Masa Studi Standar',
      onViewDetails: (event) => openModal('onTime', event),
      isFiltered: kpiScope.onTime && isReady,
    },
    {
      key: 'studySuccess',
      title: 'Keberhasilan Studi',
      value: formatKpiDisplay(kpis.studySuccessRateS1),
      subtitle: displaySubtitles.studySuccess,
      icon: BookOpenCheck,
      badge: 'Evaluasi Akhir Studi',
      onViewDetails: (event) => openModal('studySuccess', event),
      isFiltered: kpiScope.studySuccess && isReady,
    },
  ];
}

export default function GraduatesPage() {
  return (
    <DashboardPage
      title="Graduate Data"
      description="Statistik kelulusan mahasiswa, distribusi IPK, dan persentase kelulusan tepat waktu."
      useFilters={useGraduateFilters}
      filterForm={graduateFilterForm}
      useSummary={useSummary}
      useList={useList}
      useKpiDisplay={useGraduateKpiDisplay}
      buildCards={buildCards}
      Table={GraduateDataTable}
      DetailModal={GraduateDetailModal}
      headerExtra={HeaderAcademicYearFilter}
    />
  );
}
