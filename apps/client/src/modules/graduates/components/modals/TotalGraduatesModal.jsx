import { useMemo } from 'react';
import { Calendar, GraduationCap, Award, Users } from 'lucide-react';
import Modal from '../../../../components/common/modals/Modal';
import ModalSummaryBanner from '../../../../components/common/modals/ModalSummaryBanner';
import ModalTabNav from '../../../../components/common/modals/ModalTabNav';
import ModalTable from '../../../../components/common/modals/ModalTable';
import ModalTabContent from '../../../../components/common/modals/ModalTabContent';
import { useTabTransition } from '../../../../hooks/useTabTransition';
import { formatNumber } from '@komet/shared/formatters';
import { DIGITAL_BLUE } from '../../../../utils/theme';
import { useDetail } from '../../graduateQueries';
import TrendBarChart from '../../../../components/common/charts/TrendBarChart';
import DistributionChart from '../../../../components/common/charts/DistributionChart';
import TrendChartTooltip from '../../../../components/common/charts/TrendChartTooltip';
import { TOTAL_GRADUATE_TABS } from './graduateTrendConfig';

// Warna bar per jenjang — S1/S2 tetap seperti semula, jenjang tambahan (Prof)
// memakai warna berikutnya dari palet yang sama.
const JENJANG_COLORS = [DIGITAL_BLUE[600], DIGITAL_BLUE[400], '#10B981', '#F59E0B', '#8B5CF6'];

const JENJANG_LABEL = { s1: 'S1', s2: 'S2' };
const jenjangName = (key) => JENJANG_LABEL[key] ?? key.toUpperCase();

const EMPTY_ITEMS = [];

const JENJANG_TONE = { s1Count: 'text-digital-blue-900', s2Count: 'text-gray-800' };

// Kolom jenjang dinamis dari baris pertama: S1/S2 tampil seperti semula,
// jenjang tambahan (Prof) memakai kolom yang sama polanya.
function totalTableColumns(rows) {
  const jenjangKeys = Object.keys(rows[0] ?? {})
    .filter((key) => key !== 'tahun' && key !== 'total' && key.endsWith('Count'))
    .sort((a, b) => (a === 's1Count' ? -1 : b === 's1Count' ? 1 : a.localeCompare(b)));
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
    ...jenjangKeys.map((key) => ({
      key,
      label: `Lulusan Jenjang ${jenjangName(key.replace(/Count$/, ''))}`,
      icon: GraduationCap,
      headerClassName: 'text-right',
      cellClassName: `text-right font-medium ${JENJANG_TONE[key] ?? 'text-gray-800'}`,
      render: (row) => `${formatNumber(row[key])} lulusan`,
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

function trendBars(rows) {
  const jenjangKeys = Object.keys(rows[0] ?? {})
    .filter((key) => key !== 'tahun' && key !== 'total' && key.endsWith('Count'))
    .sort((a, b) => (a === 's1Count' ? -1 : b === 's1Count' ? 1 : a.localeCompare(b)));
  return jenjangKeys.map((key, index) => ({
    dataKey: key,
    name: `Lulusan ${jenjangName(key.replace(/Count$/, ''))}`,
    color: JENJANG_COLORS[index % JENJANG_COLORS.length],
    labelKey: key,
  }));
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

  const kpis = data?.kpis || {};

  const combinedTrend = totalData?.byYear || EMPTY_ITEMS;
  const bars = useMemo(() => trendBars(combinedTrend), [combinedTrend]);
  const columns = useMemo(() => totalTableColumns(combinedTrend), [combinedTrend]);
  const tooltipRows = useMemo(
    () =>
      bars.map((bar, index) => ({
        key: bar.dataKey,
        label: bar.name,
        colorClass: index < 2 ? `bg-digital-blue-${index === 0 ? 600 : 400}` : 'bg-emerald-500',
      })),
    [bars],
  );
  const byJenjang = kpis.totalGraduatesByJenjang || {};
  const composition = useMemo(
    () =>
      Object.entries(byJenjang)
        .sort(([a], [b]) => (a === 's1' ? -1 : b === 's1' ? 1 : a.localeCompare(b)))
        .map(([key, value]) => `${formatNumber(value)} lulusan ${jenjangName(key)}`)
        .join(', '),
    [byJenjang],
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
              tooltipContent={
                <TrendChartTooltip
                  titleKey="tahun"
                  rows={tooltipRows}
                  footer={{ key: 'total', label: 'Total Lulusan' }}
                />
              }
            />
          </div>
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
            useMultiColor={true}
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
    [combinedTrend, distError, isLoadingDist, isLoadingTotal, predikatList, totalError],
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
                Total lulusan mencatat sebanyak{' '}
                <strong className="text-digital-blue-900 font-bold">
                  {kpis.totalGraduates || 0} lulusan
                </strong>{' '}
                yang menyelesaikan studi{' '}
                {kpis.totalScopePhrase || 'di seluruh tahun akademik tercatat'}. Terdiri dari{' '}
                <strong>{composition || '-'}</strong>.
              </p>
            </div>
          }
          label="Total Lulusan"
          value={formatNumber(kpis.totalGraduates)}
          sublabel={`Per jenjang: ${composition || '-'}`}
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
