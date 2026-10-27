import { Award, Building2, UserCheck, Users } from 'lucide-react';
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
      key: 'totalParticipants',
      title: 'Partisipan MBKM',
      value: formatKpiDisplay(kpis.totalParticipants),
      subtitle: displaySubtitles.participants,
      icon: Users,
      onViewDetails: (event) => openModal('participants', event),
      isFiltered: kpiScope.participants && isReady,
    },
    {
      key: 'eligible',
      title: 'Mahasiswa Eligible',
      value: formatKpiDisplay(kpis.eligibleCount),
      subtitle: displaySubtitles.eligible,
      icon: UserCheck,
      onViewDetails: (event) => openModal('eligible', event),
      isFiltered: kpiScope.eligible && isReady,
    },
    {
      key: 'rate',
      title: 'Persentase Partisipasi',
      value: formatKpiDisplay(kpis.participationRate),
      subtitle: displaySubtitles.rate,
      icon: Award,
      onViewDetails: (event) => openModal('rate', event),
      isFiltered: kpiScope.rate && isReady,
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
  ];
}

export default function MbkmPage() {
  return (
    <DashboardPage
      title="MBKM Data"
      description="Partisipasi MBKM mahasiswa semester 7 dan mitranya pada periode terpilih."
      useFilters={useMbkmFilters}
      filterForm={mbkmFilterForm}
      useSummary={useSummary}
      useList={useList}
      useKpiDisplay={useMbkmKpiDisplay}
      buildCards={buildCards}
      Table={MbkmDataTable}
      DetailModal={MbkmDetailModal}
      headerExtra={HeaderAcademicYearFilter}
    />
  );
}
