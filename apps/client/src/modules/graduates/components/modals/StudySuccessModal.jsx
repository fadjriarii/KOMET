import { useMemo } from 'react';
import { BarChart3, BookOpenCheck } from 'lucide-react';
import Modal from '../../../../components/common/modals/Modal';
import ModalSummaryBanner from '../../../../components/common/modals/ModalSummaryBanner';
import ModalTabNav from '../../../../components/common/modals/ModalTabNav';
import ModalTabContent from '../../../../components/common/modals/ModalTabContent';
import EmptyState from '../../../../components/common/feedback/EmptyState';
import CohortTrendChart from '../../../../components/common/charts/CohortTrendChart';
import { useTabTransition } from '../../../../hooks/useTabTransition';
import { formatNumber, formatPercentage } from '@komet/shared/formatters';
import { formatList } from '../../../../utils/kpiLabels';
import { useDetail } from '../../graduateQueries';
import { withEvaluationLag } from './graduateTrendConfig';
import { JENJANG_COLORS } from './totalTrendBars';
import { ignoredFiltersClause, scopeTexts } from '../../utils/filterScope';

const EMPTY = [];

const successBars = (batas) => [
  {
    dataKey: 'successCount',
    name: withEvaluationLag('Mahasiswa Lulus', batas),
    tooltipLabel: 'Berhasil Lulus',
    color: JENJANG_COLORS[0],
  },
  {
    dataKey: 'intake',
    name: 'Total Intake Awal',
    tooltipLabel: 'Total Intake',
    color: JENJANG_COLORS[1],
  },
];

export default function StudySuccessModal({ isOpen, onClose, originRect, data, filters }) {
  const {
    data: detail,
    isLoading,
    error,
  } = useDetail({
    isOpen,
    resourceKey: 'keberhasilan-studi',
    filters,
    method: 'getKeberhasilanStudiDetail',
    errorMessage: 'Gagal memuat data keberhasilan studi',
  });

  // Tab, batas, dan angkatan evaluasi per jenjang diputuskan server.
  const jenjangs = detail?.jenjangs || EMPTY;
  const tabs = useMemo(
    () =>
      jenjangs.map((entry) => ({
        key: entry.key,
        label: withEvaluationLag(`Jenjang ${entry.label}`, entry.batas),
        icon: BarChart3,
      })),
    [jenjangs],
  );
  const card = data?.kpis?.cards?.studySuccess || {};
  const headlineKey = card.byJenjang?.find((entry) => entry.jenjang === card.headlineJenjang)?.key;
  const { activeTab, handleTabChange, slideClass } = useTabTransition(tabs, headlineKey);

  // Banner menceritakan tab yang dibuka: rate dan intake dari baris angkatan
  // evaluasi pada deret yang sama (satu sumber untuk satu fakta).
  const active = jenjangs.find((entry) => entry.key === activeTab);
  const evaluated = (detail?.[activeTab] || EMPTY).find(
    (row) => row.cohortLabel === `Angkatan ${active?.angkatanEvaluasi}`,
  );
  const successRate = formatPercentage(evaluated?.rate ?? card.value, 1);
  const { suffix: scopeSuffix, searchSuffix } = scopeTexts(filters, { cohort: true });
  const clause = ignoredFiltersClause(card.ignoredFilters);
  const clauseSuffix = clause ? ` ${clause}` : '';
  const lagPhrase = active?.batas != null ? ` dalam ${active.batas} tahun` : '';

  const content = useMemo(
    () =>
      Object.fromEntries(
        jenjangs.map((entry) => [
          entry.key,
          <CohortTrendChart
            cohorts={detail?.[entry.key] || EMPTY}
            bars={successBars(entry.batas)}
            isLoading={isLoading}
            error={error}
            emptyIcon={BookOpenCheck}
            emptyTitle="Belum Ada Kohort yang Dievaluasi"
            emptyDescription="Kohort jenjang ini belum cukup umur untuk dinilai keberhasilan studinya."
            note="Lima angkatan terbaru yang masa studi maksimumnya sudah habis; pilih angkatan untuk kohort lain."
          />,
        ]),
      ),
    [detail, error, isLoading, jenjangs],
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rincian Keberhasilan Studi"
      subtitle={
        jenjangs.length
          ? `Kelulusan dalam masa studi maksimum (${formatList(
              jenjangs.map((entry) => `${entry.label}: ${entry.batas} tahun`),
            )} sejak angkatan masuk)`
          : 'Kelulusan dalam masa studi maksimum masing-masing jenjang'
      }
      maxWidth="max-w-4xl"
      originRect={originRect}
      showCloseButton
    >
      <div className="flex flex-col h-full space-y-4">
        <ModalSummaryBanner
          description={
            <div className="space-y-1.5 text-justify">
              {typeof evaluated?.intake === 'number' ? (
                <p>
                  Dari {formatNumber(evaluated.intake)} mahasiswa masuk Angkatan{' '}
                  {active?.angkatanEvaluasi || '-'}
                  {scopeSuffix},{' '}
                  <strong className="text-digital-blue-900 font-bold">{successRate}</strong> lulus
                  {lagPhrase} sejak masuk ({active?.label}). Mahasiswa yang lulus setelah masa studi
                  maksimum, atau belum lulus, tidak dihitung berhasil.
                  {clauseSuffix}
                  {searchSuffix}
                </p>
              ) : (
                <p>
                  Tingkat keberhasilan studi{active ? ` jenjang ${active.label}` : ''} tercatat
                  sebesar <strong className="text-digital-blue-900 font-bold">{successRate}</strong>{' '}
                  untuk angkatan evaluasi {active?.angkatanEvaluasi || '-'}
                  {scopeSuffix}: lulus{lagPhrase} sejak masuk. Mahasiswa yang lulus setelah masa
                  studi maksimum, atau belum lulus, tidak dihitung berhasil.
                  {clauseSuffix}
                  {searchSuffix}
                </p>
              )}
            </div>
          }
          label="Keberhasilan Studi"
          value={successRate}
          sublabel="Evaluasi Akhir Studi"
        />

        <div className="flex-1 flex flex-col min-h-0">
          {!isLoading && !error && !tabs.length ? (
            <EmptyState
              icon={BookOpenCheck}
              title="Belum Ada Kohort yang Dievaluasi"
              description="Tidak ada jenjang pada filter ini yang kohortnya sudah bisa dinilai."
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
