import { useCallback, useMemo } from 'react';
import { BookOpen, UserCheck, Users } from 'lucide-react';
import Modal from '../../../../components/common/modals/Modal';
import ModalSummaryBanner from '../../../../components/common/modals/ModalSummaryBanner';
import ModalTabNav from '../../../../components/common/modals/ModalTabNav';
import ModalTable from '../../../../components/common/modals/ModalTable';
import ModalTabContent from '../../../../components/common/modals/ModalTabContent';
import { useTabTransition } from '../../../../hooks/useTabTransition';
import { formatNumber, formatPercentage } from '../../../../utils/uiHelpers';
import { mbkmService } from '../../services/mbkmService';
import { useMbkmDetailResource } from '../../hooks/useMbkmDetailResource';
import MbkmDistributionChart from './MbkmDistributionChart';
import { MBKM_ELIGIBLE_TABS } from './mbkmTrendConfig';

const ELIGIBLE_TABLE_COLUMNS = [
  {
    key: 'name',
    label: 'Program Studi',
    icon: BookOpen,
    render: (row) => (
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-digital-blue-500" />
        <span className="font-semibold text-gray-900">{row.name}</span>
      </div>
    ),
  },
  {
    key: 'count',
    label: 'Mahasiswa Eligible',
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
    label: 'Proporsi Mahasiswa',
    icon: UserCheck,
    headerClassName: 'text-right',
    cellClassName: 'text-right font-bold text-gray-900',
    render: (row) => formatPercentage(row.percentage, 1, '0.0%'),
  },
];
const EMPTY_LIST = [];

export default function MbkmEligibleModal({
  isOpen,
  onClose,
  originRect,
  data,
  filters,
}) {
  const { activeTab, handleTabChange, slideClass } = useTabTransition(MBKM_ELIGIBLE_TABS, 'prodi');

  const fetchEligibleDetail = useCallback(
    (signal) => mbkmService.getEligibleStudents(filters, { signal }),
    [filters]
  );

  const {
    data: eligibleData,
    isLoading: isLoadingEligible,
    error: eligibleError,
  } = useMbkmDetailResource({
    isOpen,
    resourceKey: 'eligible-students',
    filters,
    fetcher: fetchEligibleDetail,
    errorMessage: 'Gagal memuat data mahasiswa eligible',
  });

  const kpis = data?.kpis || {};
  const payload = eligibleData?.data || eligibleData || {};
  const prodiList = payload.prodiData || EMPTY_LIST;

  const content = useMemo(() => ({
    prodi: (
      <div className="h-full flex flex-col pt-0.5 px-1">
        <MbkmDistributionChart
          items={prodiList}
          dataKey="count"
          nameKey="name"
          labelKey="percentage"
          isLoading={isLoadingEligible}
          error={eligibleError}
          emptyIcon={BookOpen}
          emptyTitle="Tidak Ada Data Program Studi"
          emptyDescription="Belum ada data sebaran mahasiswa eligible per prodi."
          yAxisWidth={210}
          useMultiColor={true}
        />
      </div>
    ),
    tabel: (
      <div className="h-full flex flex-col pt-0.5 pb-1">
        <ModalTable
          columns={ELIGIBLE_TABLE_COLUMNS}
          data={prodiList}
          isLoading={isLoadingEligible}
          error={eligibleError}
          emptyTitle="Tidak Ada Data Eligible"
          emptyDescription="Belum ada data tabel mahasiswa eligible dari backend."
        />
      </div>
    ),
  }), [eligibleError, isLoadingEligible, prodiList]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rincian Mahasiswa Eligible MBKM"
      subtitle="Sebaran mahasiswa aktif semester 7 yang memenuhi syarat konversi dan partisipasi kegiatan MBKM"
      maxWidth="max-w-4xl"
      originRect={originRect}
      showCloseButton
    >
      <div className="flex flex-col h-full space-y-4">
        <ModalSummaryBanner
          description={
            <div className="space-y-1.5 text-justify">
              <p>
                Terdapat sebanyak <strong className="text-digital-blue-900 font-bold">{kpis.eligibleCount || payload.eligibleCount || 0} mahasiswa aktif</strong> pada semester 7 yang berstatus eligible untuk mengambil program MBKM di luar kampus.
              </p>
            </div>
          }
          label="Total Eligible"
          value={kpis.eligibleCount || payload.eligibleCount || '0'}
          sublabel="Semester 7 Aktif"
        />

        <div className="flex-1 flex flex-col min-h-0">
          <ModalTabNav tabs={MBKM_ELIGIBLE_TABS} activeTab={activeTab} onTabChange={handleTabChange} />
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
