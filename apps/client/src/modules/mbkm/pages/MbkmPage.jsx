import { Award, Briefcase, Building2, UserCheck } from 'lucide-react';
import DashboardPage from '../../../components/common/layout/DashboardPage';
import { formatKpiDisplay } from '../../../utils/uiHelpers';
import MbkmDataTable from '../components/MbkmDataTable';
import MbkmDetailModal from '../components/MbkmDetailModal';
import { mbkmFilterForm, useMbkmFilters } from '../hooks/useMbkmFilters';
import { useMbkmKpiDisplay } from '../hooks/useMbkmKpiDisplay';
import { useSummary, useList } from '../mbkmQueries';

function buildCards({ kpis, displaySubtitles, kpiScope, isReady, openModal }) {
  return [
    {
      key: 'rate',
      title: 'Tingkat Partisipasi MBKM',
      value: formatKpiDisplay(kpis.participationRate),
      subtitle: displaySubtitles.rate,
      icon: Award,
      badge: `Target IKU-2: ≥ ${kpis.targetIku2}`,
      onViewDetails: (event) => openModal('rate', event),
      isFiltered: kpiScope.rate && isReady,
    },
    {
      key: 'participants',
      title: 'Total Partisipan MBKM',
      value: formatKpiDisplay(kpis.totalParticipants),
      subtitle: displaySubtitles.participants,
      icon: Briefcase,
      badge: 'BKP MBKM',
      onViewDetails: (event) => openModal('activities', event),
      isFiltered: kpiScope.participants && isReady,
    },
    {
      key: 'eligible',
      title: 'Mahasiswa Eligible',
      value: formatKpiDisplay(kpis.eligibleCount),
      subtitle: displaySubtitles.eligible,
      icon: UserCheck,
      badge: 'Semester 7 Aktif',
      onViewDetails: (event) => openModal('eligible', event),
      isFiltered: kpiScope.eligible && isReady,
    },
    {
      key: 'mitra',
      title: 'Mitra MBKM & Industri',
      value: formatKpiDisplay(kpis.totalMitra),
      subtitle: displaySubtitles.mitra,
      icon: Building2,
      badge: 'Mitra Terverifikasi',
      onViewDetails: (event) => openModal('partners', event),
      isFiltered: kpiScope.mitra && isReady,
    },
  ];
}

export default function MbkmPage() {
  return (
    <DashboardPage
      title="MBKM Data"
      description="Monitoring partisipasi Merdeka Belajar Kampus Merdeka, ketercapaian target IKU-2, dan jejaring mitra industri."
      useFilters={useMbkmFilters}
      filterForm={mbkmFilterForm}
      useSummary={useSummary}
      useList={useList}
      useKpiDisplay={useMbkmKpiDisplay}
      buildCards={buildCards}
      Table={MbkmDataTable}
      DetailModal={MbkmDetailModal}
    />
  );
}
