import { Fragment, useMemo } from 'react';
import { BookOpen, Building2, PieChart } from 'lucide-react';
import Modal from '../../../../components/common/modals/Modal';
import ModalSummaryBanner from '../../../../components/common/modals/ModalSummaryBanner';
import ModalTabNav from '../../../../components/common/modals/ModalTabNav';
import ModalTabContent from '../../../../components/common/modals/ModalTabContent';
import { useTabTransition } from '../../../../hooks/useTabTransition';
import { formatDecimal, formatNumber } from '@komet/shared/formatters';
import { useDetail } from '../../graduateQueries';
import { describeScope, searchSentence } from '../../utils/filterScope';
import TrendBarChart from '../../../../components/common/charts/TrendBarChart';
import DistributionChart from '../../../../components/common/charts/DistributionChart';
import TrendChartTooltip from '../../../../components/common/charts/TrendChartTooltip';
import { GPA_OVERVIEW_TABS, withoutDefaultTahunLulus } from './graduateTrendConfig';
import { JENJANG_COLORS, jenjangName } from './totalTrendBars';

const EMPTY_ITEMS = [];

export default function GpaOverviewModal({ isOpen, onClose, originRect, data, filters }) {
  const { activeTab, handleTabChange, slideClass } = useTabTransition(GPA_OVERVIEW_TABS, 'tren');
  const defaultTahunLulus = data?.filterOptions?.rollingYears?.[0];
  const chartFilters = useMemo(
    () => withoutDefaultTahunLulus(filters, defaultTahunLulus),
    [filters, defaultTahunLulus],
  );

  const {
    data: trendData,
    isLoading: isTrendLoading,
    error: trendError,
  } = useDetail({
    isOpen,
    resourceKey: 'ipk-trend',
    filters: chartFilters,
    method: 'getIpkTrendDetail',
    errorMessage: 'Gagal memuat rincian tren IPK lulusan',
  });
  const {
    data: ipkData,
    isLoading,
    error,
  } = useDetail({
    isOpen,
    resourceKey: 'ipk-trend',
    filters,
    method: 'getIpkTrendDetail',
    errorMessage: 'Gagal memuat rincian tren IPK lulusan',
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
  // Penyebut rata-rata: lulusan ber-IPK sah per jenjang, sumber yang sama
  // dengan angkanya (summary), bukan payload chart.
  const ipkCounts = data?.summary?.avgIpk || {};
  const ipkCount = Object.values(ipkCounts)
    .map((entry) => entry?.count)
    .filter((count) => typeof count === 'number')
    .reduce((acc, count) => acc + count, 0);
  const ipkScopePhrase = ipkCounts.tahunScope?.phrase || 'di seluruh tahun akademik tercatat';
  const gpaS1 = formatDecimal(kpis.averageGpaS1, 2, '0.00');
  const gpaS2 = formatDecimal(kpis.averageGpaS2, 2, '0.00');
  // Identitas stabil untuk dep useMemo di bawah: `|| {}` inline membuat
  // objek baru tiap render dan membatalkan memo.
  const gpaByJenjang = useMemo(() => kpis.averageGpaByJenjang || {}, [kpis.averageGpaByJenjang]);
  // Segmen jenjang bernilai 0 disembunyikan, hanya yang ada nilainya.
  const gpaSegments = useMemo(
    () => [
      ...(kpis.averageGpaS1
        ? [{ key: 's1', label: 'S1', value: gpaS1, text: `${gpaS1} (Jenjang S1)` }]
        : []),
      ...(kpis.averageGpaS2
        ? [{ key: 's2', label: 'S2', value: gpaS2, text: `${gpaS2} (Jenjang S2)` }]
        : []),
      ...Object.entries(gpaByJenjang)
        .filter(([key, value]) => key !== 's1' && key !== 's2' && value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => ({
          key,
          label: jenjangName(key),
          value: formatDecimal(value, 2, '0.00'),
          text: `${formatDecimal(value, 2, '0.00')} (Jenjang ${jenjangName(key)})`,
        })),
    ],
    [gpaByJenjang, gpaS1, gpaS2, kpis.averageGpaS1, kpis.averageGpaS2],
  );
  const gpaMain = gpaSegments[0];
  const gpaSubLabel = gpaSegments
    .slice(1)
    .map((segment) => `${segment.label}: ${segment.value}`)
    .join(', ');
  const ipkDetail = ipkData || {};
  const trendDetail = trendData || ipkDetail;

  // Server mengirim satu deret per tahun untuk semua jenjang, terurut naik.
  // Bar IPK dinamis dari kunci baris pertama — S1/S2 tampil seperti semula.
  const combinedTrend = trendDetail.byYear || EMPTY_ITEMS;
  const avgBars = useMemo(() => {
    const keys = Object.keys(combinedTrend[0] ?? {})
      .filter((key) => key !== 'tahun' && key.endsWith('AvgIpk'))
      .filter((key) => combinedTrend.some((row) => Number(row?.[key]) > 0))
      .sort((a, b) => (a === 's1AvgIpk' ? -1 : b === 's1AvgIpk' ? 1 : a.localeCompare(b)));
    return keys.map((key, index) => ({
      dataKey: key,
      name: `IPK ${jenjangName(key.replace(/AvgIpk$/, ''))}`,
      color: JENJANG_COLORS[index % JENJANG_COLORS.length],
      labelKey: key,
      labelFormatter: (value) => formatDecimal(value, 2),
    }));
  }, [combinedTrend]);
  const avgTooltipRows = useMemo(
    () =>
      avgBars.map((bar) => ({
        key: bar.dataKey,
        label: `Rata-rata ${bar.name}`,
        color: bar.color,
        format: (val) => formatDecimal(val, 2),
      })),
    [avgBars],
  );

  const prodiList = ipkDetail.prodiGpaData || EMPTY_ITEMS;
  const facultyList = ipkDetail.facultyGpaData || EMPTY_ITEMS;
  const gpaBandsList = ipkDetail.gpaBandsData || EMPTY_ITEMS;

  const content = useMemo(
    () => ({
      tren: (
        <div className="h-full flex flex-col pt-0.5 px-1">
          <div className="h-56 sm:h-64 md:h-72 w-full">
            <TrendBarChart
              data={combinedTrend}
              xDataKey="tahun"
              bars={avgBars}
              compactZeroBars
              isLoading={isTrendLoading}
              error={trendError}
              tooltipContent={<TrendChartTooltip titleKey="tahun" rows={avgTooltipRows} />}
            />
          </div>
          <p className="text-[10px] text-gray-500 text-center">
            Jendela 5 tahun terbaru; pilih Tahun Lulus spesifik untuk satu tahun.
          </p>
        </div>
      ),
      rentang: (
        <div className="pt-1">
          <DistributionChart
            items={gpaBandsList}
            countUnit="lulusan"
            dataKey="count"
            nameKey="range"
            labelKey="percentage"
            isLoading={isLoading}
            error={error}
            emptyIcon={PieChart}
            emptyTitle="Tidak Ada Data Rentang IPK"
            emptyDescription="Belum ada data distribusi rentang IPK dari backend."
            yAxisWidth={140}
          />
        </div>
      ),
      prodi: (
        <div className="pt-1">
          <DistributionChart
            items={prodiList}
            countUnit="lulusan"
            dataKey="gpaValue"
            nameKey="name"
            labelKey="gpaValue"
            labelFormatter={(value) => formatDecimal(value, 2)}
            isLoading={isLoading}
            error={error}
            emptyIcon={BookOpen}
            emptyTitle="Tidak Ada Data Program Studi"
            emptyDescription="Belum ada data capaian IPK per program studi dari backend."
            yAxisWidth={210}
          />
        </div>
      ),
      fakultas: (
        <div className="pt-1">
          <DistributionChart
            items={facultyList}
            countUnit="lulusan"
            dataKey="gpaValue"
            nameKey="name"
            labelKey="gpaValue"
            labelFormatter={(value) => formatDecimal(value, 2)}
            isLoading={isLoading}
            error={error}
            emptyIcon={Building2}
            emptyTitle="Tidak Ada Data Fakultas"
            emptyDescription="Belum ada data capaian IPK per fakultas dari backend."
            yAxisWidth={190}
          />
        </div>
      ),
    }),
    [
      avgBars,
      avgTooltipRows,
      combinedTrend,
      error,
      facultyList,
      gpaBandsList,
      isLoading,
      isTrendLoading,
      prodiList,
      trendError,
    ],
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rincian Rata-rata IPK Lulusan"
      subtitle="Distribusi capaian Indeks Prestasi Kumulatif per jenjang, rentang, dan fakultas"
      maxWidth="max-w-4xl"
      originRect={originRect}
      showCloseButton
    >
      <div className="flex flex-col h-full space-y-4">
        <ModalSummaryBanner
          description={
            <div className="space-y-1.5 text-justify">
              <p>
                Rata-rata IPK lulusan{scopeSuffix} adalah{' '}
                {gpaSegments.length ? (
                  gpaSegments.map((segment, index) => (
                    <Fragment key={segment.key}>
                      {index > 0 ? ' dan ' : null}
                      <strong className="text-digital-blue-900 font-bold">{segment.text}</strong>
                    </Fragment>
                  ))
                ) : (
                  <strong className="text-digital-blue-900 font-bold">0.00</strong>
                )}{' '}
                dari skala maksimal 4.00, dihitung dari {formatNumber(ipkCount)} lulusan{' '}
                {ipkScopePhrase}. Lulusan yang IPK-nya kosong atau nol tidak ikut dihitung supaya
                tidak menyeret rata-rata ke bawah.{searchSuffix}
              </p>
            </div>
          }
          label="Rata-rata IPK"
          value={gpaMain?.value ?? gpaS1}
          sublabel={gpaSubLabel || null}
        />

        <div className="flex-1 flex flex-col min-h-0">
          <ModalTabNav
            tabs={GPA_OVERVIEW_TABS}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar scroll-smooth pr-1">
            <div className="overflow-x-hidden w-full">
              <div key={activeTab} className={`w-full ${slideClass}`}>
                <ModalTabContent activeTab={activeTab} content={content} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
