import { useMemo } from 'react';
import { Calendar, GraduationCap, Award, Users } from 'lucide-react';
import Modal from '../../../../components/common/modals/Modal';
import ModalSummaryBanner from '../../../../components/common/modals/ModalSummaryBanner';
import ModalTabNav from '../../../../components/common/modals/ModalTabNav';
import ModalTable from '../../../../components/common/modals/ModalTable';
import ModalTabContent from '../../../../components/common/modals/ModalTabContent';
import { useTabTransition } from '../../../../hooks/useTabTransition';
import { formatNumber } from '@komet/shared/formatters';
import { describeScope, searchSentence } from '../../utils/filterScope';
import { useDetail } from '../../graduateQueries';
import { jenjangName, trendBars } from './totalTrendBars';
import TrendBarChart from '../../../../components/common/charts/TrendBarChart';
import DistributionChart from '../../../../components/common/charts/DistributionChart';
import TrendChartTooltip from '../../../../components/common/charts/TrendChartTooltip';
import { TOTAL_GRADUATE_TABS, withoutDefaultTahunLulus } from './graduateTrendConfig';

const EMPTY_ITEMS = [];

const JENJANG_TONE = { s1Count: 'text-digital-blue-900', s2Count: 'text-gray-800' };

// Kolom jenjang dinamis dari baris pertama: S1/S2 tampil seperti semula,
// jenjang tambahan (Profesi) memakai kolom yang sama polanya.
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

export default function TotalGraduatesModal({ isOpen, onClose, originRect, data, filters }) {
  const { activeTab, handleTabChange, slideClass } = useTabTransition(TOTAL_GRADUATE_TABS, 'tren');
  const defaultTahunLulus = data?.filterOptions?.rollingYears?.[0];
  const chartFilters = useMemo(
    () => withoutDefaultTahunLulus(filters, defaultTahunLulus),
    [filters, defaultTahunLulus],
  );

  const {
    data: totalData,
    isLoading: isLoadingTotal,
    error: totalError,
  } = useDetail({
    isOpen,
    resourceKey: 'total-lulusan',
    filters: chartFilters,
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
  const { suffix: scopeSuffix } = describeScope({
    faculty: filters?.faculty,
    prodi: filters?.prodi,
    angkatan: filters?.selectedAngkatan,
    status: filters?.predikat,
    periode: filters?.periodeWisuda,
  });
  const searchTail = searchSentence(filters?.search);
  const searchSuffix = searchTail ? ` ${searchTail}` : '';

  const combinedTrend = totalData?.byYear || EMPTY_ITEMS;
  const bars = useMemo(() => trendBars(combinedTrend), [combinedTrend]);
  const columns = useMemo(() => totalTableColumns(combinedTrend), [combinedTrend]);
  const tooltipRows = useMemo(
    () =>
      bars.map((bar) => ({
        key: bar.dataKey,
        label: bar.name,
        color: bar.color,
      })),
    [bars],
  );
  // Identitas stabil untuk dep useMemo di bawah: `|| {}` inline membuat
  // objek baru tiap render dan membatalkan memo.
  const byJenjang = useMemo(
    () => kpis.totalGraduatesByJenjang || {},
    [kpis.totalGraduatesByJenjang],
  );
  const composition = useMemo(
    () =>
      Object.entries(byJenjang)
        .filter(([, value]) => value)
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
                  {formatNumber(kpis.totalGraduates ?? 0)} lulusan{scopeSuffix}
                </strong>{' '}
                yang menyelesaikan studi{' '}
                {kpis.totalScopePhrase || 'di seluruh tahun akademik tercatat'}. Terdiri dari{' '}
                <strong>{composition || '0 lulusan'}</strong>. Ringkasan ini mengikuti filter yang
                sedang aktif dan mencakup seluruh jenjang pada cakupan tersebut.{searchSuffix}
              </p>
            </div>
          }
          label="Total Lulusan"
          value={formatNumber(kpis.totalGraduates ?? 0)}
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
