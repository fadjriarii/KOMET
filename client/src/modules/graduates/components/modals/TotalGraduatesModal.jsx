import { useCallback, useMemo } from 'react';
import { Calendar, GraduationCap, Award, Users } from 'lucide-react';
import Modal from '../../../../components/common/modals/Modal';
import ModalSummaryBanner from '../../../../components/common/modals/ModalSummaryBanner';
import ModalTabNav from '../../../../components/common/modals/ModalTabNav';
import ModalTable from '../../../../components/common/modals/ModalTable';
import ModalTabContent from '../../../../components/common/modals/ModalTabContent';
import { useTabTransition } from '../../../../hooks/useTabTransition';
import { formatNumber } from '../../../../utils/uiHelpers';
import { DIGITAL_BLUE } from '../../../../utils/theme';
import { graduatesService } from '../../services/graduatesService';
import { useGraduateDetailResource } from '../../hooks/useGraduateDetailResource';
import GraduateTrendBarChart from './GraduateTrendBarChart';
import GraduateDistributionChart from './GraduateDistributionChart';
import GraduateTrendChartTooltip from './GraduateTrendChartTooltip';
import { TOTAL_GRADUATE_TABS } from './graduateTrendConfig';

const TOTAL_TABLE_COLUMNS = [
  {
    key: 'tahun',
    label: 'Tahun Kelulusan',
    icon: Calendar,
    render: (row) => (
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-digital-blue-500" />
        <span className="font-semibold text-gray-900">{row.tahun}</span>
      </div>
    ),
  },
  {
    key: 's1Count',
    label: 'Lulusan Jenjang S1',
    icon: GraduationCap,
    headerClassName: 'text-right',
    cellClassName: 'text-right font-medium text-digital-blue-900',
    render: (row) => (
      <span className="bg-digital-blue-50/80 text-digital-blue-800 px-2.5 py-0.5 rounded-md border border-digital-blue-100 font-semibold">
        {formatNumber(row.s1Count)} lulusan
      </span>
    ),
  },
  {
    key: 's2Count',
    label: 'Lulusan Jenjang S2',
    icon: GraduationCap,
    headerClassName: 'text-right',
    cellClassName: 'text-right font-medium text-gray-800',
    render: (row) => `${formatNumber(row.s2Count)} lulusan`,
  },
  {
    key: 'total',
    label: 'Total Wisudawan',
    icon: Users,
    headerClassName: 'text-right',
    cellClassName: 'text-right font-bold text-gray-900',
    render: (row) => `${formatNumber(row.total)} lulusan`,
  },
];

export default function TotalGraduatesModal({
  isOpen,
  onClose,
  originRect,
  data,
  filters,
}) {
  const { activeTab, handleTabChange, slideClass } = useTabTransition(TOTAL_GRADUATE_TABS, 'tren');

  const fetchDistribution = useCallback(
    (signal) => graduatesService.getGraduateDistribution(filters, { signal }),
    [filters]
  );
  const fetchTotalDetail = useCallback(
    (signal) => graduatesService.getTotalLulusanDetail(filters, { signal }),
    [filters]
  );

  const {
    data: totalData,
    isLoading: isLoadingTotal,
    error: totalError,
  } = useGraduateDetailResource({
    isOpen,
    resourceKey: 'total-lulusan',
    filters,
    fetcher: fetchTotalDetail,
    errorMessage: 'Gagal memuat tren total lulusan',
    summaryData: data,
    summaryKey: 'totalLulusan',
  });

  const {
    data: distData,
    isLoading: isLoadingDist,
    error: distError,
  } = useGraduateDetailResource({
    isOpen,
    resourceKey: 'distribution',
    filters,
    fetcher: fetchDistribution,
    errorMessage: 'Gagal memuat distribusi lulusan',
  });

  const kpis = data?.kpis || {};
  const summary = data?.summary || {};

  const s1List = totalData?.data?.s1 || totalData?.s1 || [];
  const s2List = totalData?.data?.s2 || totalData?.s2 || [];

  const combinedTrend = useMemo(() => {
    const yearMap = {};
    s1List.forEach((item) => {
      yearMap[item.tahun] = { tahun: String(item.tahun), s1Count: item.count || 0, s2Count: 0 };
    });
    s2List.forEach((item) => {
      if (!yearMap[item.tahun]) {
        yearMap[item.tahun] = { tahun: String(item.tahun), s1Count: 0, s2Count: item.count || 0 };
      } else {
        yearMap[item.tahun].s2Count = item.count || 0;
      }
    });

    return Object.values(yearMap)
      .map((item) => ({ ...item, total: item.s1Count + item.s2Count }))
      .sort((a, b) => a.tahun.localeCompare(b.tahun));
  }, [s1List, s2List]);

  const predikatList = useMemo(() => {
    return distData?.data?.byPredikat || distData?.byPredikat || [];
  }, [distData]);

  const content = useMemo(() => ({
    tren: (
      <div className="h-full flex flex-col pt-0.5 px-1">
        <div className="h-56 sm:h-64 md:h-72 w-full">
          <GraduateTrendBarChart
            data={combinedTrend}
            xDataKey="tahun"
            bars={[
              { dataKey: 's1Count', name: 'Lulusan S1', color: DIGITAL_BLUE[600], labelKey: 's1Count' },
              { dataKey: 's2Count', name: 'Lulusan S2', color: DIGITAL_BLUE[400], labelKey: 's2Count' },
            ]}
            tooltipContent={
              <GraduateTrendChartTooltip
                titleKey="tahun"
                rows={[
                  { key: 's1Count', label: 'Lulusan S1', colorClass: 'bg-digital-blue-600' },
                  { key: 's2Count', label: 'Lulusan S2', colorClass: 'bg-digital-blue-400' },
                ]}
                footer={{ key: 'total', label: 'Total Wisudawan' }}
              />
            }
          />
        </div>
      </div>
    ),
    predikat: (
      <div className="h-full flex flex-col pt-0.5 px-1">
        <GraduateDistributionChart
          items={predikatList}
          dataKey="count"
          nameKey="name"
          labelKey="percentage"
          isLoading={isLoadingDist}
          error={distError}
          emptyIcon={Award}
          emptyTitle="Tidak Ada Data Predikat"
          emptyDescription="Belum ada data distribusi predikat kelulusan dari backend."
          yAxisWidth={210}
          useMultiColor={true}
        />
      </div>
    ),
    tabel: (
      <div className="h-full flex flex-col pt-0.5 pb-1">
        <ModalTable
          columns={TOTAL_TABLE_COLUMNS}
          data={[...combinedTrend].reverse()}
          isLoading={isLoadingTotal}
          error={totalError}
          emptyTitle="Tidak Ada Riwayat"
          emptyDescription="Belum ada data riwayat total lulusan dari backend."
        />
      </div>
    ),
  }), [combinedTrend, distError, isLoadingDist, isLoadingTotal, predikatList, totalError]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rincian Total Wisudawan"
      subtitle="Statistik volume kelulusan mahasiswa jenjang S1 dan S2 per tahun"
      maxWidth="max-w-4xl"
      originRect={originRect}
      showCloseButton
    >
      <div className="flex flex-col h-full space-y-4">
        <ModalSummaryBanner
          description={
            <div className="space-y-1.5 text-justify">
              <p>
                Total lulusan mencatat sebanyak <strong className="text-digital-blue-900 font-bold">{kpis.totalGraduates || 0} wisudawan</strong> yang menyelesaikan studi dalam rentang 5 tahun akademik terakhir. Terdiri dari <strong>{formatNumber(summary.totalLulusan?.s1 || 0)} lulusan S1</strong> dan <strong>{formatNumber(summary.totalLulusan?.s2 || 0)} lulusan S2</strong>.
              </p>
            </div>
          }
          label="Total Wisudawan"
          value={kpis.totalGraduates || '0'}
          sublabel="Jenjang S1 & S2"
        />

        <div className="flex-1 flex flex-col min-h-0">
          <ModalTabNav tabs={TOTAL_GRADUATE_TABS} activeTab={activeTab} onTabChange={handleTabChange} />
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
