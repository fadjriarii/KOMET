import { useMemo } from 'react';
import { Building2, Users, Award } from 'lucide-react';
import Modal from '../../../../components/common/modals/Modal';
import ModalSummaryBanner from '../../../../components/common/modals/ModalSummaryBanner';
import ModalTabNav from '../../../../components/common/modals/ModalTabNav';
import ModalTable from '../../../../components/common/modals/ModalTable';
import ModalTabContent from '../../../../components/common/modals/ModalTabContent';
import { useTabTransition } from '../../../../hooks/useTabTransition';
import { formatNumber, formatPercentage } from '@komet/shared/formatters';
import { useDetail } from '../../mbkmQueries';
import DistributionChart from '../../../../components/common/charts/DistributionChart';
import { MBKM_PARTNERS_TABS } from './mbkmTrendConfig';

const EMPTY_ITEMS = [];

const PARTNERS_TABLE_COLUMNS = [
  {
    key: 'name',
    label: 'Nama Mitra / Lembaga Instansi',
    icon: Building2,
    render: (row) => (
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-digital-blue-500" />
        <span className="font-semibold text-gray-900">{row.name}</span>
      </div>
    ),
  },
  {
    key: 'count',
    label: 'Mahasiswa Ditempatkan',
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
    label: 'Pangsa Penempatan',
    icon: Award,
    headerClassName: 'text-right',
    cellClassName: 'text-right font-bold text-gray-900',
    render: (row) => formatPercentage(row.percentage, 1, '0.0%'),
  },
];

export default function MbkmPartnersModal({ isOpen, onClose, originRect, data, filters }) {
  const { activeTab, handleTabChange, slideClass } = useTabTransition(MBKM_PARTNERS_TABS, 'mitra');

  // Sepuluh mitra saja tidak cukup untuk tab tabel; server membatasi topN-nya.
  const {
    data: partnersData,
    isLoading: isLoadingPartners,
    error: partnersError,
  } = useDetail({
    isOpen,
    resourceKey: 'mitra-distribution',
    filters: { ...filters, topN: 20 },
    method: 'getMitraDistribution',
    errorMessage: 'Gagal memuat sebaran mitra MBKM',
  });

  const kpis = data?.kpis || {};
  const payload = partnersData || {};
  const mitraList = payload.mitraData || EMPTY_ITEMS;

  const content = useMemo(
    () => ({
      mitra: (
        <div className="h-full flex flex-col pt-0.5 px-1">
          <DistributionChart
            items={mitraList}
            countUnit="mahasiswa"
            dataKey="count"
            nameKey="name"
            labelKey="percentage"
            isLoading={isLoadingPartners}
            error={partnersError}
            emptyIcon={Building2}
            emptyTitle="Tidak Ada Data Mitra"
            emptyDescription="Belum ada data sebaran mitra MBKM dari backend."
            yAxisWidth={240}
            useMultiColor={true}
          />
        </div>
      ),
      tabel: (
        <div className="h-full flex flex-col pt-0.5 pb-1">
          <ModalTable
            columns={PARTNERS_TABLE_COLUMNS}
            data={mitraList}
            isLoading={isLoadingPartners}
            error={partnersError}
            emptyTitle="Tidak Ada Data Mitra"
            emptyDescription="Belum ada data tabel mitra penempatan dari backend."
          />
        </div>
      ),
    }),
    [isLoadingPartners, mitraList, partnersError],
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rincian Mitra MBKM & Industri"
      subtitle="Sebaran penempatan mahasiswa MBKM pada perusahaan industri terkemuka, institusi riset, dan lembaga mitra"
      maxWidth="max-w-4xl"
      originRect={originRect}
      showCloseButton
    >
      <div className="flex flex-col h-full space-y-4">
        <ModalSummaryBanner
          description={
            <div className="space-y-1.5 text-justify">
              <p>
                Bekerjasama dengan{' '}
                <strong className="text-digital-blue-900 font-bold">
                  {formatNumber(kpis.totalMitra ?? payload.totalPartners)} mitra terverifikasi
                </strong>{' '}
                dengan total{' '}
                <strong>
                  {formatNumber(payload.totalPlacements ?? kpis.totalParticipants)} penempatan
                  mahasiswa
                </strong>{' '}
                di berbagai sektor industri dan institusi penelitian.
              </p>
            </div>
          }
          label="Total Mitra"
          value={formatNumber(kpis.totalMitra ?? payload.totalPartners)}
          sublabel="Organisasi Mitra"
        />

        <div className="flex-1 flex flex-col min-h-0">
          <ModalTabNav
            tabs={MBKM_PARTNERS_TABS}
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
