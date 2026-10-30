import { useMemo } from 'react';
import { BarChart3, BookOpen, Hourglass, Layers } from 'lucide-react';
import Modal from '../../../../components/common/modals/Modal';
import ModalSummaryBanner from '../../../../components/common/modals/ModalSummaryBanner';
import ModalTabNav from '../../../../components/common/modals/ModalTabNav';
import ModalTabContent from '../../../../components/common/modals/ModalTabContent';
import { useTabTransition } from '../../../../hooks/useTabTransition';
import EmptyState from '../../../../components/common/feedback/EmptyState';
import { tabsWithData } from '../../../../components/common/modals/tabsWithData';
import { formatDecimal, formatNumber } from '@komet/shared/formatters';
import { useDetail } from '../../graduateQueries';
import { scopeTexts } from '../../utils/filterScope';
import { studyLengthSubtitle } from '../../hooks/useGraduateKpiDisplay';
import TrendBarChart from '../../../../components/common/charts/TrendBarChart';
import DistributionChart from '../../../../components/common/charts/DistributionChart';
import TrendChartTooltip from '../../../../components/common/charts/TrendChartTooltip';
import { trendBars } from './totalTrendBars';

const EMPTY_ITEMS = [];
const EMPTY_SERIES = {};
const semester = (value) => formatDecimal(value, 1);

/**
 * Rincian Rata-rata Masa Studi: tren per Tahun Lulus, sebaran jumlah semester
 * per jenjang (tab per jenjang dari server), dan rata-rata per prodi. Semua
 * angka dari `/graduates/masa-studi`; masa studi sudah dikurangi maksimal 2
 * semester cuti oleh server.
 */
export default function StudyLengthModal({ isOpen, onClose, originRect, data, filters }) {
  const {
    data: detail,
    isLoading,
    error,
  } = useDetail({
    isOpen,
    resourceKey: 'masa-studi',
    filters,
    method: 'getMasaStudiDetail',
    errorMessage: 'Gagal memuat rincian masa studi lulusan',
  });

  const card = data?.kpis?.cards?.studyLength || {};
  const scope = scopeTexts(filters);
  const payload = detail || {};
  const byYear = payload.byYear || EMPTY_ITEMS;
  const trendJenjangs = payload.trendJenjangs || EMPTY_ITEMS;
  const jenjangs = payload.jenjangs || EMPTY_ITEMS;
  const bySemester = payload.bySemester || EMPTY_SERIES;
  const byProdi = payload.byProdi || EMPTY_ITEMS;

  const bars = useMemo(
    () =>
      trendBars(trendJenjangs, 'Rata-rata').map((bar) => ({
        ...bar,
        labelFormatter: (value) => semester(value),
      })),
    [trendJenjangs],
  );
  const tooltipRows = useMemo(
    () =>
      bars.map((bar) => ({
        key: bar.dataKey,
        label: bar.name,
        color: bar.color,
        format: (value) => `${semester(value)} semester`,
      })),
    [bars],
  );

  // Tab sebaran satu per jenjang (urutan dan label dari server), lalu tren dan prodi.
  const allTabs = useMemo(
    () => [
      { key: 'tren', label: 'Tren Tahunan', icon: BarChart3 },
      ...jenjangs.map((entry) => ({
        key: `sebaran-${entry.key}`,
        label: `Sebaran ${entry.label}`,
        icon: Layers,
      })),
      { key: 'prodi', label: 'Per Program Studi', icon: BookOpen },
    ],
    [jenjangs],
  );
  const tabs = useMemo(
    () =>
      tabsWithData(
        allTabs,
        {
          prodi: byProdi,
          ...Object.fromEntries(
            jenjangs.map((entry) => [`sebaran-${entry.key}`, bySemester[entry.key]]),
          ),
        },
        { isLoading },
      ),
    [allTabs, byProdi, bySemester, isLoading, jenjangs],
  );
  const { activeTab, handleTabChange, slideClass } = useTabTransition(tabs, 'tren');

  const content = useMemo(
    () => ({
      tren: (
        <div className="h-full flex flex-col pt-0.5 px-1">
          <div className="h-56 sm:h-64 md:h-72 w-full">
            <TrendBarChart
              data={byYear}
              xDataKey="tahun"
              bars={bars}
              compactZeroBars
              isLoading={isLoading}
              error={error}
              tooltipContent={<TrendChartTooltip titleKey="tahun" rows={tooltipRows} />}
            />
          </div>
          <p className="text-[10px] text-gray-500 text-center">
            Rata-rata semester per Tahun Lulus, 5 tahun terbaru; pilih Tahun Lulus spesifik untuk
            satu tahun.
          </p>
        </div>
      ),
      ...Object.fromEntries(
        jenjangs.map((entry) => [
          `sebaran-${entry.key}`,
          <div key={entry.key} className="pt-1">
            <DistributionChart
              items={bySemester[entry.key] || EMPTY_ITEMS}
              countUnit="lulusan"
              dataKey="count"
              nameKey="name"
              labelKey="count"
              labelFormatter={(value) => formatNumber(value)}
              isLoading={isLoading}
              error={error}
              emptyIcon={Hourglass}
              emptyTitle="Tidak Ada Data Masa Studi"
              emptyDescription={`Tidak ada lulusan ${entry.label} yang masa studinya terhitung.`}
              yAxisWidth={110}
            />
          </div>,
        ]),
      ),
      prodi: (
        <div className="pt-1">
          <DistributionChart
            items={byProdi}
            countUnit="lulusan"
            dataKey="average"
            nameKey="name"
            labelKey="average"
            labelFormatter={(value) => `${semester(value)} smt`}
            isLoading={isLoading}
            error={error}
            emptyIcon={BookOpen}
            emptyTitle="Tidak Ada Data Program Studi"
            emptyDescription="Tidak ada lulusan per program studi untuk kombinasi filter ini."
            yAxisWidth={210}
          />
        </div>
      ),
    }),
    [bars, byProdi, bySemester, byYear, error, isLoading, jenjangs, tooltipRows],
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rincian Rata-rata Masa Studi Lulusan"
      subtitle="Lama studi dalam semester sejak awal di i3L sampai lulus, per jenjang"
      maxWidth="max-w-4xl"
      originRect={originRect}
      showCloseButton
    >
      <div className="flex flex-col h-full space-y-4">
        <ModalSummaryBanner
          description={
            <div className="space-y-1.5 text-left sm:text-justify">
              <p>
                {studyLengthSubtitle(card, scope)} Semester pendek tidak dihitung, dan semester cuti
                ke-3 dan seterusnya tetap dihitung sebagai masa studi.{scope.searchSuffix}
              </p>
            </div>
          }
          label="Rata-rata Masa Studi"
          value={
            card.value === null || card.value === undefined ? '-' : `${semester(card.value)} smt`
          }
          sublabel={
            (card.byJenjang || [])
              .map((entry) => `${entry.label}: ${formatNumber(entry.count)} lulusan`)
              .join(', ') || null
          }
        />

        <div className="flex-1 flex flex-col min-h-0">
          {card.isEmpty ? (
            <EmptyState
              icon={Hourglass}
              title="Tidak Ada Lulusan"
              description="Tidak ada lulusan yang masa studinya terhitung untuk kombinasi filter ini. Longgarkan salah satu filter."
            />
          ) : (
            <>
              <ModalTabNav tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />
              <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar scroll-smooth pr-1">
                <div className="overflow-x-hidden w-full">
                  <div key={activeTab} className={`w-full ${slideClass}`}>
                    <ModalTabContent activeTab={activeTab} content={content} />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
