import { useMemo } from 'react';
import { Building2, Award, Users, TrendingUp } from 'lucide-react';
import Modal from '../../../../components/common/modals/Modal';
import ModalSummaryBanner from '../../../../components/common/modals/ModalSummaryBanner';
import ModalTabNav from '../../../../components/common/modals/ModalTabNav';
import ModalTable from '../../../../components/common/modals/ModalTable';
import ModalTabContent from '../../../../components/common/modals/ModalTabContent';
import { useTabTransition } from '../../../../hooks/useTabTransition';
import { formatNumber, formatPercentage } from '@komet/shared/formatters';
import { useDetail } from '../../mbkmQueries';
import DistributionChart from '../../../../components/common/charts/DistributionChart';
import { MBKM_RATE_TABS } from './mbkmTrendConfig';

const EMPTY_ITEMS = [];

const RATE_TABLE_COLUMNS = [
  {
    key: 'name',
    label: 'Fakultas',
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
    label: 'Jumlah Partisipan',
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
    label: 'Proporsi Partisipasi',
    icon: Award,
    headerClassName: 'text-right',
    cellClassName: 'text-right font-bold text-gray-900',
    render: (row) => formatPercentage(row.percentage, 1),
  },
];

export default function MbkmRateModal({ isOpen, onClose, originRect, data, filters }) {
  const { activeTab, handleTabChange, slideClass } = useTabTransition(MBKM_RATE_TABS, 'fakultas');

  const {
    data: rateData,
    isLoading: isLoadingRate,
    error: rateError,
  } = useDetail({
    isOpen,
    resourceKey: 'rate-detail',
    filters,
    method: 'getRateDetail',
    errorMessage: 'Gagal memuat analisis partisipasi MBKM',
  });

  const kpis = data?.kpis || {};
  const payload = rateData || {};
  const facultyData = payload.facultyData || EMPTY_ITEMS;
  const eligibleRate = payload.eligibleRate || {};
  const eligibleCount = kpis.eligibleCount ?? payload.eligibleCount;
  const participationRate = formatPercentage(
    kpis.participationRate ?? eligibleRate.numPercentage,
    1,
  );
  const targetIku2 = formatPercentage(eligibleRate.targetIku2, 1);
  // Tanpa mahasiswa eligible tidak ada yang bisa dibandingkan: bukan "tercapai",
  // juga bukan "belum tercapai".
  const meetsTarget = eligibleCount > 0 && eligibleRate.meetsTarget === true;

  const content = useMemo(
    () => ({
      fakultas: (
        <div className="h-full flex flex-col pt-0.5 px-1">
          <DistributionChart
            items={facultyData}
            countUnit="mahasiswa"
            dataKey="count"
            nameKey="name"
            labelKey="percentage"
            isLoading={isLoadingRate}
            error={rateError}
            emptyIcon={Building2}
            emptyTitle="Tidak Ada Data Fakultas"
            emptyDescription="Belum ada data distribusi fakultas MBKM dari backend."
            yAxisWidth={210}
            useMultiColor={true}
          />
        </div>
      ),
      tabel: (
        <div className="h-full flex flex-col pt-0.5 pb-1">
          <ModalTable
            columns={RATE_TABLE_COLUMNS}
            data={facultyData}
            isLoading={isLoadingRate}
            error={rateError}
            emptyTitle="Tidak Ada Data"
            emptyDescription="Belum ada data tabel partisipasi MBKM dari backend."
          />
        </div>
      ),
    }),
    [facultyData, isLoadingRate, rateError],
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rincian Partisipasi MBKM"
      subtitle="Analisis rasio partisipasi MBKM terhadap mahasiswa eligible semester 7 dan pencapaian target IKU-2 Dikti"
      maxWidth="max-w-4xl"
      originRect={originRect}
      showCloseButton
    >
      <div className="flex flex-col h-full space-y-4">
        <ModalSummaryBanner
          description={
            <div className="space-y-1.5 text-justify">
              <p>
                Tingkat partisipasi MBKM mencapai{' '}
                <strong className="text-digital-blue-900 font-bold">{participationRate}</strong>{' '}
                dari total <strong>{formatNumber(eligibleCount)} mahasiswa eligible</strong>{' '}
                semester 7.
              </p>
              <div className="flex items-center gap-2 pt-1 text-xs">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold border ${
                    meetsTarget
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  <TrendingUp size={13} />
                  <span>
                    Target IKU-2: ≥ {targetIku2} ({meetsTarget ? 'Terlampaui' : 'Belum Terpenuhi'})
                  </span>
                </span>
              </div>
            </div>
          }
          label="Tingkat Partisipasi"
          value={participationRate}
          sublabel="IKU-2 Dikti"
        />

        <div className="flex-1 flex flex-col min-h-0">
          <ModalTabNav tabs={MBKM_RATE_TABS} activeTab={activeTab} onTabChange={handleTabChange} />
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
