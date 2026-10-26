import { useMemo } from 'react';
import { Calendar, GraduationCap, Award, Users } from 'lucide-react';
import Modal from '../../../../components/common/modals/Modal';
import ModalSummaryBanner from '../../../../components/common/modals/ModalSummaryBanner';
import ModalTabNav from '../../../../components/common/modals/ModalTabNav';
import ModalTable from '../../../../components/common/modals/ModalTable';
import ModalTabContent from '../../../../components/common/modals/ModalTabContent';
import { useTabTransition } from '../../../../hooks/useTabTransition';
import { formatNumber } from '@komet/shared/formatters';
import { formatList } from '../../../../utils/kpiLabels';
import { scopeTexts } from '../../utils/filterScope';
import { useDetail } from '../../graduateQueries';
import { trendBars } from './totalTrendBars';
import TrendBarChart from '../../../../components/common/charts/TrendBarChart';
import DistributionChart from '../../../../components/common/charts/DistributionChart';
import TrendChartTooltip from '../../../../components/common/charts/TrendChartTooltip';
import { TOTAL_GRADUATE_TABS } from './graduateTrendConfig';

const EMPTY_ITEMS = [];

// Kolom jenjang dari daftar server, urutan sama dengan batang chart.
function totalTableColumns(jenjangs) {
  return [
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
    ...jenjangs.map((entry, index) => ({
      key: entry.dataKey,
      label: `Lulusan Jenjang ${entry.label}`,
      icon: GraduationCap,
      headerClassName: 'text-right',
      cellClassName: `text-right font-medium ${index === 0 ? 'text-digital-blue-900' : 'text-gray-800'}`,
      render: (row) => `${formatNumber(row[entry.dataKey])} lulusan`,
    })),
    {
      key: 'total',
      label: 'Total Lulusan',
      icon: Users,
      headerClassName: 'text-right',
      cellClassName: 'text-right font-bold text-gray-900',
      render: (row) => `${formatNumber(row.total)} lulusan`,
    },
  ];
}

export default function TotalGraduatesModal({ isOpen, onClose, originRect, data, filters }) {
  const { activeTab, handleTabChange, slideClass } = useTabTransition(TOTAL_GRADUATE_TABS, 'tren');

  const {
    data: totalData,
    isLoading: isLoadingTotal,
    error: totalError,
  } = useDetail({
    isOpen,
    resourceKey: 'total-lulusan',
    filters,
    method: 'getTotalLulusanDetail',
    errorMessage: 'Gagal memuat tren total lulusan',
  });

  const {
    data: distData,
    isLoading: isLoadingDist,
    error: distError,
  } = useDetail({
    isOpen,
    resourceKey: 'distribution',
    filters,
    method: 'getGraduateDistribution',
    errorMessage: 'Gagal memuat distribusi lulusan',
  });

  const card = data?.kpis?.cards?.total || {};
  const { suffix: scopeSuffix, searchSuffix } = scopeTexts(filters);

  // Server sudah menjendela deret (5 tahun bila Tahun Lulus masih default).
  const combinedTrend = totalData?.byYear || EMPTY_ITEMS;
  const trendJenjangs = totalData?.jenjangs || EMPTY_ITEMS;
  const bars = useMemo(() => trendBars(trendJenjangs), [trendJenjangs]);
  const columns = useMemo(() => totalTableColumns(trendJenjangs), [trendJenjangs]);
  const tooltipRows = useMemo(
    () =>
      bars.map((bar) => ({
        key: bar.dataKey,
        label: bar.name,
        color: bar.color,
      })),
    [bars],
  );
  const composition = formatList(
    (card.byJenjang || EMPTY_ITEMS).map(
      (entry) => `${formatNumber(entry.value)} lulusan ${entry.label}`,
    ),
  );

  const predikatList = useMemo(() => distData?.byPredikat || [], [distData]);

  const content = useMemo(
    () => ({
      tren: (
        <div className="h-full flex flex-col pt-0.5 px-1">
          <div className="h-56 sm:h-64 md:h-72 w-full">
            <TrendBarChart
              data={combinedTrend}
              xDataKey="tahun"
              bars={bars}
              compactZeroBars
              isLoading={isLoadingTotal}
              error={totalError}
              tooltipContent={
                <TrendChartTooltip
                  titleKey="tahun"
                  rows={tooltipRows}
                  footer={{ key: 'total', label: 'Total Lulusan' }}
                />
              }
            />
          </div>
          <p className="text-[10px] text-gray-500 text-center">
            Jendela 5 tahun terbaru; pilih Tahun Lulus spesifik untuk satu tahun.
          </p>
        </div>
      ),
      predikat: (
        <div className="h-full flex flex-col pt-0.5 px-1">
          <DistributionChart
            items={predikatList}
            countUnit="lulusan"
            dataKey="count"
            nameKey="name"
            labelKey="percentage"
            isLoading={isLoadingDist}
            error={distError}
            emptyIcon={Award}
            emptyTitle="Tidak Ada Data Predikat"
            emptyDescription="Belum ada data distribusi predikat kelulusan dari backend."
            yAxisWidth={210}
          />
        </div>
      ),
      tabel: (
        <div className="h-full flex flex-col pt-0.5 pb-1">
          <ModalTable
            columns={columns}
            data={[...combinedTrend].reverse()}
            isLoading={isLoadingTotal}
            error={totalError}
            emptyTitle="Tidak Ada Riwayat"
            emptyDescription="Belum ada data riwayat total lulusan dari backend."
          />
        </div>
      ),
    }),
    [
      bars,
      columns,
      combinedTrend,
      distError,
      isLoadingDist,
      isLoadingTotal,
      predikatList,
      tooltipRows,
      totalError,
    ],
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rincian Total Lulusan"
      subtitle="Statistik volume kelulusan mahasiswa per jenjang per tahun"
      maxWidth="max-w-4xl"
      originRect={originRect}
      showCloseButton
    >
      <div className="flex flex-col h-full space-y-4">
        <ModalSummaryBanner
          description={
            <div className="space-y-1.5 text-justify">
              <p>
                Menampilkan{' '}
                <strong className="text-digital-blue-900 font-bold">
                  {formatNumber(card.value)} lulusan{scopeSuffix}
                </strong>{' '}
                yang menyelesaikan studi{' '}
                {card.scope?.phrase || 'di seluruh tahun akademik tercatat'}. Terdiri dari{' '}
                <strong>{composition || '0 lulusan'}</strong>. Ringkasan ini mengikuti filter yang
                sedang aktif dan mencakup seluruh jenjang pada cakupan tersebut.{searchSuffix}
              </p>
            </div>
          }
          label="Total Lulusan"
          value={formatNumber(card.value)}
          sublabel={`Per jenjang: ${composition || '0 lulusan'}`}
        />

        <div className="flex-1 flex flex-col min-h-0">
          <ModalTabNav
            tabs={TOTAL_GRADUATE_TABS}
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
