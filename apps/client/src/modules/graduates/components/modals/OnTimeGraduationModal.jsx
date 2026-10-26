import { Fragment, useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import Modal from '../../../../components/common/modals/Modal';
import ModalSummaryBanner from '../../../../components/common/modals/ModalSummaryBanner';
import ModalTabNav from '../../../../components/common/modals/ModalTabNav';
import ModalTabContent from '../../../../components/common/modals/ModalTabContent';
import EmptyState from '../../../../components/common/feedback/EmptyState';
import CohortTrendChart from '../../../../components/common/charts/CohortTrendChart';
import { useTabTransition } from '../../../../hooks/useTabTransition';
import { formatPercentage } from '@komet/shared/formatters';
import { formatList } from '../../../../utils/kpiLabels';
import { useDetail } from '../../graduateQueries';
import { withBatas } from './graduateTrendConfig';
import { OUTCOME_COLORS } from './totalTrendBars';
import { scopeTexts } from '../../utils/filterScope';

const EMPTY = [];

const outcomeBars = (batas) => [
  {
    dataKey: 'onTimeCount',
    name: withBatas('Tepat Waktu', batas, '='),
    tooltipLabel: 'Lulus Tepat Waktu',
    color: OUTCOME_COLORS.onTime,
  },
  {
    dataKey: 'fastCount',
    name: withBatas('Lebih Cepat', batas, '<'),
    tooltipLabel: 'Lulus Lebih Cepat',
    color: OUTCOME_COLORS.fast,
  },
  {
    dataKey: 'lateCount',
    name: withBatas('Lewat Waktu', batas, '>'),
    tooltipLabel: 'Lewat Batas Waktu',
    color: OUTCOME_COLORS.late,
  },
];

export default function OnTimeGraduationModal({ isOpen, onClose, originRect, data, filters }) {
  // Server memotong jendela 5 angkatan dan memutuskan tab jenjang (`jenjangs`).
  const {
    data: detail,
    isLoading,
    error,
  } = useDetail({
    isOpen,
    resourceKey: 'tepat-waktu',
    filters,
    method: 'getTepatWaktuDetail',
    errorMessage: 'Gagal memuat data kelulusan tepat waktu',
  });

  const jenjangs = detail?.jenjangs || EMPTY;
  const tabs = useMemo(
    () =>
      jenjangs.map((entry) => ({
        key: entry.key,
        label: withBatas(`Jenjang ${entry.label}`, entry.batas, '≤'),
        icon: BarChart3,
      })),
    [jenjangs],
  );
  const { activeTab, handleTabChange, slideClass } = useTabTransition(tabs, tabs[0]?.key);

  const card = data?.kpis?.cards?.onTime || {};
  const segments = card.byJenjang || EMPTY;
  const { suffix: scopeSuffix, searchSuffix } = scopeTexts(filters);
  const scopePhrase = card.scope?.phrase || 'di seluruh tahun akademik tercatat';
  const overall = formatPercentage(card.value, 1);

  const content = useMemo(
    () =>
      Object.fromEntries(
        jenjangs.map((entry) => [
          entry.key,
          <CohortTrendChart
            cohorts={detail?.[entry.key] || EMPTY}
            bars={outcomeBars(entry.batas)}
            isLoading={isLoading}
            error={error}
            note="Jendela 5 angkatan terbaru; pilih Tahun Lulus atau Angkatan spesifik untuk melihat yang lain."
          />,
        ]),
      ),
    [detail, error, isLoading, jenjangs],
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rincian Kelulusan Tepat Waktu"
      subtitle={
        jenjangs.length
          ? `Evaluasi masa studi standar: ${formatList(
              jenjangs.map((entry) => `${entry.label} (≤ ${entry.batas} tahun)`),
            )}`
          : 'Evaluasi masa studi standar kelulusan per jenjang'
      }
      maxWidth="max-w-4xl"
      originRect={originRect}
      showCloseButton
    >
      <div className="flex flex-col h-full space-y-4">
        <ModalSummaryBanner
          description={
            <div className="space-y-1.5 text-justify">
              <p>
                Secara keseluruhan{scopeSuffix},{' '}
                <strong className="text-digital-blue-900 font-bold">{overall}</strong> lulusan lulus
                tepat waktu, dihitung dari lulusan {scopePhrase}. Tepat waktu berarti lulus dalam
                masa studi standar jenjangnya, dihitung per semester dari periode masuk hingga
                periode lulus.
                {segments.length ? ' Rincian: ' : null}
                {segments.map((segment, index) => (
                  <Fragment key={segment.key}>
                    {index > 0 ? (index === segments.length - 1 ? ' dan ' : ', ') : null}
                    {segment.label}{' '}
                    <strong className="text-digital-blue-900 font-bold">
                      {formatPercentage(segment.value, 1)} (≤ {segment.batas} tahun)
                    </strong>
                  </Fragment>
                ))}
                .{searchSuffix}
              </p>
            </div>
          }
          label="Tepat Waktu"
          value={overall}
          sublabel={
            segments
              .map((segment) => `${segment.label}: ${formatPercentage(segment.value, 1)}`)
              .join(', ') || null
          }
        />

        <div className="flex-1 flex flex-col min-h-0">
          {!isLoading && !error && !tabs.length ? (
            <EmptyState
              icon={BarChart3}
              title="Tidak Ada Data Tepat Waktu"
              description="Tidak ada lulusan pada filter ini untuk dihitung masa studinya."
            />
          ) : (
            <>
              <ModalTabNav tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />
              <div className="flex-1 min-h-0 overflow-x-hidden w-full">
                <div key={activeTab} className={`h-full ${slideClass}`}>
                  <ModalTabContent activeTab={activeTab} content={content} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
