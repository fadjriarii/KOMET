import { Award, Briefcase, Building2, Users } from 'lucide-react';
import DashboardPage from '../../../components/common/dashboard/DashboardPage';
import HeaderAcademicYearFilter from '../../../components/common/filters/HeaderAcademicYearFilter';
import { formatKpiDisplay } from '../../../utils/uiHelpers';
import MbkmDataTable from '../components/MbkmDataTable';
import MbkmDetailModal from '../components/MbkmDetailModal';
import { mbkmFilterForm, useMbkmFilters } from '../hooks/useMbkmFilters';
import { useMbkmKpiDisplay } from '../hooks/useMbkmKpiDisplay';
import { useSummary, useList } from '../mbkmQueries';

function buildCards({ kpis, displaySubtitles, kpiScope, isReady, openModal }) {
  return [
    {
      key: 'participation',
      title: 'Partisipasi MBKM Semester 7',
      value: formatKpiDisplay(kpis.participationRate),
      subtitle: displaySubtitles.participation,
      icon: Award,
      onViewDetails: (event) => openModal('participation', event),
      isFiltered: kpiScope.participation && isReady,
    },
    {
      key: 'total',
      title: 'Total Mahasiswa MBKM',
      value: formatKpiDisplay(kpis.totalStudents),
      subtitle: displaySubtitles.total,
      icon: Users,
      onViewDetails: (event) => openModal('total', event),
      isFiltered: kpiScope.total && isReady,
    },
    {
      key: 'mitra',
      title: 'Mitra MBKM',
      value: formatKpiDisplay(kpis.totalMitra),
      subtitle: displaySubtitles.mitra,
      icon: Building2,
      onViewDetails: (event) => openModal('mitra', event),
      isFiltered: kpiScope.mitra && isReady,
    },
    {
      key: 'jenis',
      title: 'Bentuk Kegiatan MBKM',
      value: formatKpiDisplay(kpis.jenisCount),
      subtitle: displaySubtitles.jenis,
      icon: Briefcase,
      onViewDetails: (event) => openModal('jenis', event),
      isFiltered: kpiScope.jenis && isReady,
    },
  ];
}

export default function MbkmPage() {
  return (
    <DashboardPage
      title="MBKM Data"
      description="Partisipasi MBKM mahasiswa, mitra, dan bentuk kegiatan pada periode terpilih."
      useFilters={useMbkmFilters}
      filterForm={mbkmFilterForm}
      useSummary={useSummary}
      useList={useList}
      useKpiDisplay={useMbkmKpiDisplay}
      buildCards={buildCards}
      Table={MbkmDataTable}
      DetailModal={MbkmDetailModal}
      headerExtra={HeaderAcademicYearFilter}
      searchFiltersCards={false}
    />
  );
}
