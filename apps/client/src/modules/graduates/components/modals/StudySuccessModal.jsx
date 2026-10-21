import { useMemo } from 'react';
import { BookOpenCheck } from 'lucide-react';
import Modal from '../../../../components/common/modals/Modal';
import ModalSummaryBanner from '../../../../components/common/modals/ModalSummaryBanner';
import ModalTabNav from '../../../../components/common/modals/ModalTabNav';
import ModalTabContent from '../../../../components/common/modals/ModalTabContent';
import { useTabTransition } from '../../../../hooks/useTabTransition';
import { formatNumber, formatPercentage } from '@komet/shared/formatters';
import EmptyState from '../../../../components/common/feedback/EmptyState';
import { useDetail } from '../../graduateQueries';
import TrendBarChart from '../../../../components/common/charts/TrendBarChart';
import TrendChartTooltip from '../../../../components/common/charts/TrendChartTooltip';
import {
  hasStudySuccessData,
  studySuccessTabs,
  tabsForSelectedJenjang,
  withEvaluationLag,
} from './graduateTrendConfig';
import { JENJANG_COLORS } from './totalTrendBars';
import { describeScope, searchSentence, studySuccessClause } from '../../utils/filterScope';

// Satu builder dipakai tab S1 dan S2; hanya kohortnya yang berbeda.
function CohortTrendChart({ cohorts, batas, isLoading, error }) {
  if (!isLoading && !error && !hasStudySuccessData(cohorts)) {
    return (
      <div className="h-full flex flex-col pt-0.5 px-1">
        <div className="h-56 sm:h-64 md:h-72 w-full flex items-center justify-center">
          <EmptyState
            icon={BookOpenCheck}
            title="Belum Ada Kohort yang Dievaluasi"
            description="Kohort jenjang ini belum cukup umur untuk dinilai keberhasilan studinya."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col pt-0.5 px-1">
      <div className="h-56 sm:h-64 md:h-72 w-full">
        <TrendBarChart
          data={cohorts}
          xDataKey="cohortLabel"
          isLoading={isLoading}
          error={error}
          compactZeroBars
          bars={[
            {
              dataKey: 'successCount',
              name: withEvaluationLag('Mahasiswa Lulus', batas),
              color: JENJANG_COLORS[0],
              labelKey: 'successCount',
            },
            {
              dataKey: 'intake',
              name: 'Total Intake Awal',
              color: JENJANG_COLORS[1],
              labelKey: 'intake',
            },
          ]}
          tooltipContent={
            <TrendChartTooltip
              titleKey="cohortLabel"
              rows={[
                {
                  key: 'successCount',
                  label: 'Berhasil Lulus',
                  color: JENJANG_COLORS[0],
                },
                { key: 'intake', label: 'Total Intake', color: JENJANG_COLORS[1] },
              ]}
            />
          }
        />
      </div>
      <p className="text-[10px] text-gray-500 text-center">
        Lima angkatan terbaru yang sudah melewati masa evaluasi; pilih angkatan untuk kohort lain.
      </p>
    </div>
  );
}

export default function StudySuccessModal({ isOpen, onClose, originRect, data, filters }) {
  const {
    data: detailData,
    isLoading,
    error,
  } = useDetail({
    isOpen,
    resourceKey: 'keberhasilan-studi',
    filters,
    method: 'getKeberhasilanStudiDetail',
    errorMessage: 'Gagal memuat data keberhasilan studi',
  });

  // Batas studi per jenjang dibaca generik dari payload
  // (batasStudiS1/batasStudiS2/batasStudiProfesi, dan batas jenjang baru
  // bila server mengirimnya) supaya tab jenjang baru muncul tanpa ubah client.
  const batasByJenjang = useMemo(() => {
    const entries = Object.entries(detailData ?? {}).filter(
      ([key, value]) => /^batasStudi[A-Z]/.test(key) && typeof value === 'number',
    );
    return Object.fromEntries(
      entries.map(([key, value]) => [key.replace(/^batasStudi/, '').toLowerCase(), value]),
    );
  }, [detailData]);
  const batasS1 = batasByJenjang.s1;
  const batasS2 = batasByJenjang.s2;
  const selectedJenjang = useMemo(
    () => (Array.isArray(filters?.jenjang) ? filters.jenjang.filter(Boolean) : []),
    [filters],
  );

  const s1Cohorts = useMemo(() => detailData?.s1 || [], [detailData]);
  const s2Cohorts = useMemo(() => detailData?.s2 || [], [detailData]);
  const extraCohorts = useMemo(
    () =>
      Object.entries(detailData ?? {}).filter(
        ([key, value]) =>
          key !== 's1' &&
          key !== 's2' &&
          !/^batasStudi[A-Z]/.test(key) &&
          !/^angkatanEvaluasi[A-Z]/.test(key) &&
          Array.isArray(value),
      ),
    [detailData],
  );
  const cohortKeys = useMemo(
    () => ['s1', 's2', ...extraCohorts.map(([key]) => key)],
    [extraCohorts],
  );
  // Tab hanya untuk jenjang yang datanya benar ada (batas hanya melabeli
  // angka) — kunci batas yatim tidak bisa membentuk tab S3 hantu.
  const tabs = useMemo(
    () =>
      tabsForSelectedJenjang(
        studySuccessTabs(Object.fromEntries(cohortKeys.map((key) => [key, batasByJenjang[key]]))),
        selectedJenjang,
      ),
    [batasByJenjang, cohortKeys, selectedJenjang],
  );
  const initialTab = selectedJenjang.length === 1 ? selectedJenjang[0].toLowerCase() : 's1';
  const { activeTab, handleTabChange, slideClass } = useTabTransition(tabs, initialTab);

  const kpis = data?.kpis || {};
  // Satu jenjang terpilih = banner menceritakan jenjang itu; selain itu S1.
  const bannerKey = selectedJenjang.length === 1 ? selectedJenjang[0].toLowerCase() : 's1';
  const bannerCanon = bannerKey.charAt(0).toUpperCase() + bannerKey.slice(1);
  const bannerRate =
    bannerKey === 's1'
      ? kpis.studySuccessRateS1
      : (data?.summary?.keberhasilanStudi?.[bannerKey] ?? null);
  const studySuccessRate = formatPercentage(bannerRate, 1, '0.0%');
  const bannerLabel = bannerKey.toUpperCase();
  // Angkatan evaluasi dibaca dari payload chart yang sama, bukan dari cache
  // summary — dialog tidak boleh mencampur dua sumber untuk satu fakta.
  const angkatanEvaluasi =
    detailData?.[`angkatanEvaluasi${bannerCanon}`] ??
    (bannerKey === 's1' ? detailData?.angkatanEvaluasiS1 : null);
  // Keberhasilan studi hanya mengikuti filter kohort; periode/predikat/tahun
  // lulus adalah filter kejadian dan tidak boleh muncul sebagai cakupan kartu.
  const { suffix: scopeSuffix } = describeScope({
    faculty: filters?.faculty,
    prodi: filters?.prodi,
    angkatan: filters?.selectedAngkatan,
  });
  const searchTail = searchSentence(filters?.search);
  const searchSuffix = searchTail ? ` ${searchTail}` : '';
  // Filter yang tidak mempersempit kohort disebut eksplisit supaya tidak dikira bug.
  const successClause = studySuccessClause({
    tahunLulus: filters?.selectedTahunLulus,
    periodeWisuda: filters?.periodeWisuda,
    predikat: filters?.predikat,
    defaultTahunLulus: data?.filterOptions?.rollingYears?.[0] ?? '',
  });
  const clauseSuffix = successClause ? ` ${successClause}` : '';
  // Penyebut kalimat: intake kohort yang dievaluasi, dari deret yang sama.
  const evaluatedCohort = (detailData?.[bannerKey] || []).find(
    (row) => row.cohortLabel === `Angkatan ${angkatanEvaluasi}`,
  );
  const evaluatedIntake =
    typeof evaluatedCohort?.intake === 'number' ? evaluatedCohort.intake : null;
  const lagPhrase =
    batasByJenjang[bannerKey] != null ? ` setelah ${batasByJenjang[bannerKey]} tahun` : '';

  const content = useMemo(() => {
    const entries = {
      s1: (
        <CohortTrendChart cohorts={s1Cohorts} batas={batasS1} isLoading={isLoading} error={error} />
      ),
      s2: (
        <CohortTrendChart cohorts={s2Cohorts} batas={batasS2} isLoading={isLoading} error={error} />
      ),
    };
    for (const [key, cohorts] of extraCohorts) {
      entries[key] = (
        <CohortTrendChart
          cohorts={cohorts}
          batas={batasByJenjang[key]}
          isLoading={isLoading}
          error={error}
        />
      );
    }
    return entries;
  }, [batasByJenjang, batasS1, batasS2, error, extraCohorts, isLoading, s1Cohorts, s2Cohorts]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rincian Keberhasilan Studi"
      subtitle={
        batasS1 && batasS2
          ? `Evaluasi keberhasilan studi setelah masa evaluasi (S1: ${batasS1} tahun, S2: ${batasS2} tahun sejak angkatan masuk)`
          : 'Evaluasi keberhasilan studi setelah masa evaluasi masing-masing jenjang'
      }
      maxWidth="max-w-4xl"
      originRect={originRect}
      showCloseButton
    >
      <div className="flex flex-col h-full space-y-4">
        <ModalSummaryBanner
          description={
            <div className="space-y-1.5 text-justify">
              {evaluatedIntake !== null ? (
                <p>
                  Dari {formatNumber(evaluatedIntake)} mahasiswa masuk Angkatan{' '}
                  {angkatanEvaluasi || '-'}
                  {scopeSuffix},{' '}
                  <strong className="text-digital-blue-900 font-bold">{studySuccessRate}</strong>{' '}
                  akhirnya lulus ({bannerLabel}). Penilaian dilakukan{lagPhrase} sejak masuk,
                  sehingga mahasiswa yang belum lulus sampai batas itu tidak dihitung berhasil.
                  {clauseSuffix}
                  {searchSuffix}
                </p>
              ) : (
                <p>
                  Tingkat keberhasilan studi jenjang {bannerLabel} tercatat sebesar{' '}
                  <strong className="text-digital-blue-900 font-bold">{studySuccessRate}</strong>{' '}
                  untuk angkatan evaluasi {angkatanEvaluasi || '-'}
                  {scopeSuffix}. Penilaian dilakukan{lagPhrase} sejak masuk, sehingga mahasiswa yang
                  belum lulus sampai batas itu tidak dihitung berhasil.
                  {clauseSuffix}
                  {searchSuffix}
                </p>
              )}
            </div>
          }
          label="Keberhasilan Studi"
          value={studySuccessRate}
          sublabel="Evaluasi Akhir Studi"
        />

        <div className="flex-1 flex flex-col min-h-0">
          <ModalTabNav tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />
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
