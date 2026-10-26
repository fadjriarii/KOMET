import { Fragment, useMemo } from 'react';
import { BookOpen, Building2, PieChart } from 'lucide-react';
import Modal from '../../../../components/common/modals/Modal';
import ModalSummaryBanner from '../../../../components/common/modals/ModalSummaryBanner';
import ModalTabNav from '../../../../components/common/modals/ModalTabNav';
import ModalTabContent from '../../../../components/common/modals/ModalTabContent';
import { useTabTransition } from '../../../../hooks/useTabTransition';
import { formatDecimal, formatNumber } from '@komet/shared/formatters';
import { useDetail } from '../../graduateQueries';
import { scopeTexts } from '../../utils/filterScope';
import TrendBarChart from '../../../../components/common/charts/TrendBarChart';
import DistributionChart from '../../../../components/common/charts/DistributionChart';
import TrendChartTooltip from '../../../../components/common/charts/TrendChartTooltip';
import { GPA_OVERVIEW_TABS } from './graduateTrendConfig';
import { trendBars } from './totalTrendBars';

const EMPTY_ITEMS = [];

export default function GpaOverviewModal({ isOpen, onClose, originRect, data, filters }) {
  const { activeTab, handleTabChange, slideClass } = useTabTransition(GPA_OVERVIEW_TABS, 'tren');
  // Satu request: server memakai jendela tren untuk `byYear` dan scope kartu
  // untuk rentang/prodi/fakultas.
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

  const card = data?.kpis?.cards?.gpa || {};
  const gpaSegments = card.byJenjang || EMPTY_ITEMS;
  const { suffix: scopeSuffix, searchSuffix } = scopeTexts(filters);
  const ipkScopePhrase = card.scope?.phrase || 'di seluruh tahun akademik tercatat';
  const gpaMain = formatDecimal(card.value, 2);
  const ipkDetail = ipkData || {};

  const combinedTrend = ipkDetail.byYear || EMPTY_ITEMS;
  const trendJenjangs = ipkDetail.jenjangs || EMPTY_ITEMS;
  const avgBars = useMemo(
    () =>
      trendBars(trendJenjangs, 'IPK').map((bar) => ({
        ...bar,
        labelFormatter: (value) => formatDecimal(value, 2),
      })),
    [trendJenjangs],
  );
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
              isLoading={isLoading}
              error={error}
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
      prodiList,
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
                <strong className="text-digital-blue-900 font-bold">{gpaMain}</strong>
                {gpaSegments.length > 1 ? (
                  <>
                    {' '}
                    (
                    {gpaSegments.map((segment, index) => (
                      <Fragment key={segment.key}>
                        {index > 0 ? ', ' : null}
                        {segment.label} {formatDecimal(segment.value, 2)}
                      </Fragment>
                    ))}
                    )
                  </>
                ) : null}{' '}
                dari skala maksimal 4.00, dihitung dari {formatNumber(card.count ?? 0)} lulusan{' '}
                {ipkScopePhrase}. Lulusan yang IPK-nya kosong atau nol tidak ikut dihitung supaya
                tidak menyeret rata-rata ke bawah.{searchSuffix}
              </p>
            </div>
          }
          label="Rata-rata IPK"
          value={gpaMain}
          sublabel={
            gpaSegments
              .map((segment) => `${segment.label}: ${formatDecimal(segment.value, 2)}`)
              .join(', ') || null
          }
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
