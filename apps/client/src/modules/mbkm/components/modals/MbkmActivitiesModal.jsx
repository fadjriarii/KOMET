import { useMemo } from 'react';
import { Award, BookOpen, CheckCircle2, Users } from 'lucide-react';
import Modal from '../../../../components/common/modals/Modal';
import ModalSummaryBanner from '../../../../components/common/modals/ModalSummaryBanner';
import ModalTabNav from '../../../../components/common/modals/ModalTabNav';
import ModalTable from '../../../../components/common/modals/ModalTable';
import ModalTabContent from '../../../../components/common/modals/ModalTabContent';
import { useTabTransition } from '../../../../hooks/useTabTransition';
import { formatNumber, formatPercentage } from '@komet/shared/formatters';
import { useDetail } from '../../mbkmQueries';
import DistributionChart from '../../../../components/common/charts/DistributionChart';
import { MBKM_ACTIVITIES_TABS } from './mbkmTrendConfig';

const EMPTY_ITEMS = [];

const ACTIVITIES_TABLE_COLUMNS = [
  {
    key: 'name',
    label: 'Kategori BKP MBKM',
    icon: Award,
    render: (row) => (
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-digital-blue-500" />
        <span className="font-semibold text-gray-900">{row.name}</span>
      </div>
    ),
  },
  {
    key: 'count',
    label: 'Jumlah Peserta',
    icon: Users,
    headerClassName: 'text-right',
    cellClassName: 'text-right font-medium text-digital-blue-900',
    render: (row) => (
      <span className="bg-digital-blue-50/80 text-digital-blue-800 px-2.5 py-0.5 rounded-md border border-digital-blue-100 font-semibold">
        {formatNumber(row.count)} mahasiswa
      </span>
    ),
  },
  {
    key: 'percentage',
    label: 'Persentase',
    icon: Award,
    headerClassName: 'text-right',
    cellClassName: 'text-right font-bold text-gray-900',
    render: (row) => formatPercentage(row.percentage, 1, '0.0%'),
  },
];

export default function MbkmActivitiesModal({ isOpen, onClose, originRect, data, filters }) {
  const { activeTab, handleTabChange, slideClass } = useTabTransition(
    MBKM_ACTIVITIES_TABS,
    'aktivitas',
  );

  const {
    data: activityData,
    isLoading: isLoadingActivity,
    error: activityError,
  } = useDetail({
    isOpen,
    resourceKey: 'activity-distribution',
    filters,
    method: 'getActivityDistribution',
    errorMessage: 'Gagal memuat sebaran jenis aktivitas MBKM',
  });

  const {
    data: prodiData,
    isLoading: isLoadingProdi,
    error: prodiError,
  } = useDetail({
    isOpen,
    resourceKey: 'prodi-distribution',
    filters,
    method: 'getProdiDistribution',
    errorMessage: 'Gagal memuat sebaran program studi MBKM',
  });

  const {
    data: statusData,
    isLoading: isLoadingStatus,
    error: statusError,
  } = useDetail({
    isOpen,
    resourceKey: 'status-distribution',
    filters,
    method: 'getStatusDistribution',
    errorMessage: 'Gagal memuat status aktivitas MBKM',
  });

  const kpis = data?.kpis || {};
  const activityList = activityData?.items || EMPTY_ITEMS;
  const prodiList = prodiData?.items || EMPTY_ITEMS;
  const statusList = statusData?.items || EMPTY_ITEMS;

  const content = useMemo(
    () => ({
      aktivitas: (
        <div className="h-full flex flex-col pt-0.5 px-1">
          <DistributionChart
            items={activityList}
            countUnit="mahasiswa"
            dataKey="count"
            nameKey="name"
            labelKey="percentage"
            isLoading={isLoadingActivity}
            error={activityError}
            emptyIcon={Award}
            emptyTitle="Tidak Ada Data Aktivitas"
            emptyDescription="Belum ada data sebaran aktivitas MBKM dari backend."
            yAxisWidth={220}
            useMultiColor={true}
          />
        </div>
      ),
      prodi: (
        <div className="h-full flex flex-col pt-0.5 px-1">
          <DistributionChart
            items={prodiList}
            countUnit="mahasiswa"
            dataKey="count"
            nameKey="name"
            labelKey="percentage"
            isLoading={isLoadingProdi}
            error={prodiError}
            emptyIcon={BookOpen}
            emptyTitle="Tidak Ada Data Program Studi"
            emptyDescription="Belum ada data sebaran program studi dari backend."
            yAxisWidth={210}
            useMultiColor={true}
          />
        </div>
      ),
      status: (
        <div className="h-full flex flex-col pt-0.5 px-1">
          <DistributionChart
            items={statusList}
            countUnit="mahasiswa"
            dataKey="count"
            nameKey="name"
            labelKey="percentage"
            isLoading={isLoadingStatus}
            error={statusError}
            emptyIcon={CheckCircle2}
            emptyTitle="Tidak Ada Data Status"
            emptyDescription="Belum ada data status aktivitas dari backend."
            yAxisWidth={160}
            useMultiColor={true}
          />
        </div>
      ),
      tabel: (
        <div className="h-full flex flex-col pt-0.5 pb-1">
          <ModalTable
            columns={ACTIVITIES_TABLE_COLUMNS}
            data={activityList}
            isLoading={isLoadingActivity}
            error={activityError}
            emptyTitle="Tidak Ada Data Aktivitas"
            emptyDescription="Belum ada data ringkasan aktivitas MBKM dari backend."
          />
        </div>
      ),
    }),
    [
      activityError,
      activityList,
      isLoadingActivity,
      isLoadingProdi,
      isLoadingStatus,
      prodiError,
      prodiList,
      statusError,
      statusList,
    ],
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rincian Total Partisipan MBKM"
      subtitle="Statistik bentuk kegiatan pembelajaran BKP, sebaran per program studi, dan status verifikasi"
      maxWidth="max-w-4xl"
      originRect={originRect}
      showCloseButton
    >
      <div className="flex flex-col h-full space-y-4">
        <ModalSummaryBanner
          description={
            <div className="space-y-1.5 text-justify">
              <p>
                Tercatat sebanyak{' '}
                <strong className="text-digital-blue-900 font-bold">
                  {formatNumber(kpis.totalParticipants)} partisipan MBKM
                </strong>{' '}
                pada periode ini. Meliputi{' '}
                <strong>{formatNumber(kpis.selesaiCount)} aktivitas selesai</strong> dan{' '}
                <strong>{formatNumber(kpis.berjalanCount)} aktivitas berjalan/disetujui</strong>.
              </p>
            </div>
          }
          label="Total Partisipan"
          value={formatNumber(kpis.totalParticipants)}
          sublabel="Mahasiswa Terdaftar"
        />

        <div className="flex-1 flex flex-col min-h-0">
          <ModalTabNav
            tabs={MBKM_ACTIVITIES_TABS}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
          <div className="flex-1 min-h-0 overflow-x-hidden w-full">
            <div key={activeTab} className={`h-full ${slideClass}`}>
              <ModalTabContent activeTab={activeTab} content={content} />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
