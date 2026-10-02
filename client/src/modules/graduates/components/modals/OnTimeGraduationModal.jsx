import { useCallback, useMemo } from 'react';
import { Calendar, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import Modal from '../../../../components/common/modals/Modal';
import ModalSummaryBanner from '../../../../components/common/modals/ModalSummaryBanner';
import ModalTabNav from '../../../../components/common/modals/ModalTabNav';
import ModalTable from '../../../../components/common/modals/ModalTable';
import ModalTabContent from '../../../../components/common/modals/ModalTabContent';
import { useTabTransition } from '../../../../hooks/useTabTransition';
import { formatNumber, formatPercentage } from '../../../../utils/uiHelpers';
import { DIGITAL_BLUE } from '../../../../utils/theme';
import { graduatesService } from '../../services/graduatesService';
import { useGraduateDetailResource } from '../../hooks/useGraduateDetailResource';
import TrendBarChart from '../../../../components/common/charts/TrendBarChart';
import TrendChartTooltip from '../../../../components/common/charts/TrendChartTooltip';
import { ON_TIME_TABS } from './graduateTrendConfig';

const ON_TIME_TABLE_COLUMNS = [
  {
    key: 'cohortLabel',
    label: 'Cohort / Angkatan',
    icon: Calendar,
    render: (row) => (
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-digital-blue-500" />
        <span className="font-semibold text-gray-900">{row.cohortLabel || `Angkatan ${row.cohort}`}</span>
      </div>
    ),
  },
  {
    key: 'fastCount',
    label: 'Lulus Lebih Cepat',
    icon: CheckCircle2,
    headerClassName: 'text-right',
    cellClassName: 'text-right font-medium text-emerald-700',
    render: (row) => `${formatNumber(row.fastCount)} mhs`,
  },
  {
    key: 'onTimeCount',
    label: 'Lulus Tepat Waktu',
    icon: Clock,
    headerClassName: 'text-right',
    cellClassName: 'text-right font-medium text-digital-blue-900',
    render: (row) => (
      <span className="bg-digital-blue-50/80 text-digital-blue-800 px-2.5 py-0.5 rounded-md border border-digital-blue-100 font-semibold">
        {formatNumber(row.onTimeCount)} mhs
      </span>
    ),
  },
  {
    key: 'lateCount',
    label: 'Lewat Batas Waktu',
    icon: AlertCircle,
    headerClassName: 'text-right',
    cellClassName: 'text-right font-medium text-amber-700',
    render: (row) => `${formatNumber(row.lateCount)} mhs`,
  },
  {
    key: 'rate',
    label: 'Persentase Tepat Waktu',
    icon: Clock,
    headerClassName: 'text-right',
    cellClassName: 'text-right font-bold text-digital-blue-700',
    render: (row) => (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-digital-blue-50 text-digital-blue-800 border border-digital-blue-200">
        {formatPercentage(row.rate, 1, '0.0%')}
      </span>
    ),
  },
];

export default function OnTimeGraduationModal({
  isOpen,
  onClose,
  originRect,
  data,
  filters,
}) {
  const { activeTab, handleTabChange, slideClass } = useTabTransition(ON_TIME_TABS, 's1');

  const fetchOnTimeDetail = useCallback(
    (signal) => graduatesService.getTepatWaktuDetail(filters, { signal }),
    [filters]
  );

  const {
    data: detailData,
    isLoading,
    error,
  } = useGraduateDetailResource({
    isOpen,
    resourceKey: 'tepat-waktu',
    filters,
    fetcher: fetchOnTimeDetail,
    errorMessage: 'Gagal memuat data kelulusan tepat waktu',
  });

  const kpis = data?.kpis || {};
  const onTimeS1 = formatPercentage(kpis.onTimeGraduationRateS1, 1, '0.0%');
  const onTimeS2 = formatPercentage(kpis.onTimeGraduationRateS2, 1, '0.0%');

  const s1Cohorts = useMemo(() => {
    return detailData?.onTimeCohortData || detailData?.data?.s1 || [];
  }, [detailData]);

  const s2Cohorts = useMemo(() => {
    return detailData?.onTimeCohortDataS2 || detailData?.data?.s2 || [];
  }, [detailData]);

  const content = useMemo(() => ({
    s1: (
      <div className="h-full flex flex-col pt-0.5 px-1">
        <div className="h-56 sm:h-64 md:h-72 w-full">
          <TrendBarChart
            data={s1Cohorts}
            xDataKey="cohortLabel"
            bars={[
              { dataKey: 'onTimeCount', name: 'Tepat Waktu (≤ 4 Thn)', color: DIGITAL_BLUE[600], labelKey: 'rate', labelFormatter: (value) => formatPercentage(value) },
              { dataKey: 'fastCount', name: 'Lebih Cepat (< 4 Thn)', color: '#10B981', labelKey: 'fastCount' },
              { dataKey: 'lateCount', name: 'Lewat Waktu (> 4 Thn)', color: '#F59E0B', labelKey: 'lateCount' },
            ]}
            tooltipContent={
              <TrendChartTooltip
                titleKey="cohortLabel"
                rows={[
                  { key: 'onTimeCount', label: 'Tepat Waktu', colorClass: 'bg-digital-blue-600' },
                  { key: 'fastCount', label: 'Lebih Cepat', colorClass: 'bg-emerald-500' },
                  { key: 'lateCount', label: 'Lewat Batas', colorClass: 'bg-amber-500' },
                ]}
                footer={{ key: 'rate', label: 'Persentase Tepat Waktu', format: formatPercentage }}
              />
            }
          />
        </div>
      </div>
    ),
    s2: (
      <div className="h-full flex flex-col pt-0.5 px-1">
        <div className="h-56 sm:h-64 md:h-72 w-full">
          <TrendBarChart
            data={s2Cohorts}
            xDataKey="cohortLabel"
            bars={[
              { dataKey: 'onTimeCount', name: 'Tepat Waktu (≤ 2 Thn)', color: DIGITAL_BLUE[600], labelKey: 'rate', labelFormatter: (value) => formatPercentage(value) },
              { dataKey: 'fastCount', name: 'Lebih Cepat (< 2 Thn)', color: '#10B981', labelKey: 'fastCount' },
              { dataKey: 'lateCount', name: 'Lewat Waktu (> 2 Thn)', color: '#F59E0B', labelKey: 'lateCount' },
            ]}
            tooltipContent={
              <TrendChartTooltip
                titleKey="cohortLabel"
                rows={[
                  { key: 'onTimeCount', label: 'Tepat Waktu', colorClass: 'bg-digital-blue-600' },
                  { key: 'fastCount', label: 'Lebih Cepat', colorClass: 'bg-emerald-500' },
                  { key: 'lateCount', label: 'Lewat Batas', colorClass: 'bg-amber-500' },
                ]}
                footer={{ key: 'rate', label: 'Persentase Tepat Waktu', format: formatPercentage }}
              />
            }
          />
        </div>
      </div>
    ),
    tabel: (
      <div className="h-full flex flex-col pt-0.5 pb-1">
        <ModalTable
          columns={ON_TIME_TABLE_COLUMNS}
          data={s1Cohorts}
          isLoading={isLoading}
          error={error}
          emptyTitle="Tidak Ada Data Cohort"
          emptyDescription="Belum ada data riwayat kelulusan tepat waktu dari backend."
        />
      </div>
    ),
  }), [error, isLoading, s1Cohorts, s2Cohorts]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rincian Kelulusan Tepat Waktu"
      subtitle="Evaluasi masa studi standar: S1 (≤ 4 tahun) dan S2 (≤ 2 tahun)"
      maxWidth="max-w-4xl"
      originRect={originRect}
      showCloseButton
    >
      <div className="flex flex-col h-full space-y-4">
        <ModalSummaryBanner
          description={
            <div className="space-y-1.5 text-justify">
              <p>
                Tingkat kelulusan tepat waktu mencapai <strong className="text-digital-blue-900 font-bold">{onTimeS1} (Jenjang S1)</strong> dan <strong className="text-digital-blue-900 font-bold">{onTimeS2} (Jenjang S2)</strong> dihitung berdasarkan rasio mahasiswa yang lulus dalam kurun waktu masa studi standar.
              </p>
            </div>
          }
          label="Tepat Waktu (S1)"
          value={onTimeS1}
          sublabel={`S2: ${onTimeS2}`}
        />

        <div className="flex-1 flex flex-col min-h-0">
          <ModalTabNav tabs={ON_TIME_TABS} activeTab={activeTab} onTabChange={handleTabChange} />
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
