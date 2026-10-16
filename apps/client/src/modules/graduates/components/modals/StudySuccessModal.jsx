import { useMemo } from 'react';
import { Calendar, BookOpenCheck, Users, CheckCircle2 } from 'lucide-react';
import Modal from '../../../../components/common/modals/Modal';
import ModalSummaryBanner from '../../../../components/common/modals/ModalSummaryBanner';
import ModalTabNav from '../../../../components/common/modals/ModalTabNav';
import ModalTable from '../../../../components/common/modals/ModalTable';
import ModalTabContent from '../../../../components/common/modals/ModalTabContent';
import { useTabTransition } from '../../../../hooks/useTabTransition';
import { formatNumber, formatPercentage } from '@komet/shared/formatters';
import { DIGITAL_BLUE } from '../../../../utils/theme';
import { useDetail } from '../../graduateQueries';
import TrendBarChart from '../../../../components/common/charts/TrendBarChart';
import TrendChartTooltip from '../../../../components/common/charts/TrendChartTooltip';
import { studySuccessTabs, withBatas } from './graduateTrendConfig';
import { describeScope, searchSentence, studySuccessClause } from '../../utils/filterScope';

const SUCCESS_TABLE_COLUMNS = [
  {
    key: 'cohortLabel',
    label: 'Cohort Evaluasi',
    icon: Calendar,
    render: (row) => (
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-digital-blue-500" />
        <span className="font-semibold text-gray-900">{row.cohortLabel}</span>
      </div>
    ),
  },
  {
    key: 'intake',
    label: 'Total Mahasiswa Masuk (Intake)',
    icon: Users,
    headerClassName: 'text-right',
    cellClassName: 'text-right font-medium text-gray-800',
    render: (row) => `${formatNumber(row.intake)} mhs`,
  },
  {
    key: 'successCount',
    label: 'Mahasiswa Lulus',
    icon: CheckCircle2,
    headerClassName: 'text-right',
    cellClassName: 'text-right font-medium text-digital-blue-900',
    render: (row) => (
      <span className="bg-digital-blue-50/80 text-digital-blue-800 px-2.5 py-0.5 rounded-md border border-digital-blue-100 font-semibold">
        {formatNumber(row.successCount)} mhs
      </span>
    ),
  },
  {
    key: 'rate',
    label: 'Tingkat Keberhasilan',
    icon: BookOpenCheck,
    headerClassName: 'text-right',
    cellClassName: 'text-right font-bold text-digital-blue-700',
    render: (row) => (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-digital-blue-50 text-digital-blue-800 border border-digital-blue-200">
        {formatPercentage(row.rate, 1, '0.0%')}
      </span>
    ),
  },
];

// Satu builder dipakai tab S1 dan S2; hanya kohortnya yang berbeda.
function CohortTrendChart({ cohorts, batas, isLoading, error }) {
  return (
    <div className="h-full flex flex-col pt-0.5 px-1">
      <div className="h-56 sm:h-64 md:h-72 w-full">
        <TrendBarChart
          data={cohorts}
          xDataKey="cohortLabel"
          isLoading={isLoading}
          error={error}
          bars={[
            {
              dataKey: 'successCount',
              name: withBatas('Mahasiswa Lulus', batas, 'Maks'),
              color: DIGITAL_BLUE[600],
              labelKey: 'rate',
              labelFormatter: (value) => formatPercentage(value),
            },
            {
              dataKey: 'intake',
              name: 'Total Intake Awal',
              color: DIGITAL_BLUE[200],
              labelKey: 'intake',
            },
          ]}
          tooltipContent={
            <TrendChartTooltip
              titleKey="cohortLabel"
              rows={[
                { key: 'intake', label: 'Total Intake', colorClass: 'bg-digital-blue-200' },
                { key: 'successCount', label: 'Berhasil Lulus', colorClass: 'bg-digital-blue-600' },
              ]}
              footer={{ key: 'rate', label: 'Tingkat Keberhasilan', format: formatPercentage }}
            />
          }
        />
      </div>
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
    () => studySuccessTabs(Object.fromEntries(cohortKeys.map((key) => [key, batasByJenjang[key]]))),
    [batasByJenjang, cohortKeys],
  );
  const { activeTab, handleTabChange, slideClass } = useTabTransition(tabs, 's1');

  const kpis = data?.kpis || {};
  // Satu jenjang terpilih = banner menceritakan jenjang itu; selain itu S1.
  const selectedJenjang = Array.isArray(filters?.jenjang) ? filters.jenjang.filter(Boolean) : [];
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
    detailData?.[`angkatanEvaluasi${bannerCanon}`] ?? detailData?.angkatanEvaluasiS1;
  const { suffix: scopeSuffix } = describeScope({
    faculty: filters?.faculty,
    prodi: filters?.prodi,
    angkatan: filters?.selectedAngkatan,
    status: filters?.predikat,
    periode: filters?.periodeWisuda,
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
    return {
      ...entries,
      tabel: (
        <div className="h-full flex flex-col gap-4 pt-0.5 pb-1 overflow-y-auto custom-scrollbar">
          {[
            ['S1', s1Cohorts, batasS1],
            ['S2', s2Cohorts, batasS2],
            ...extraCohorts.map(([key, cohorts]) => [
              key.toUpperCase(),
              cohorts,
              batasByJenjang[key],
            ]),
          ].map(([jenjang, cohorts, batas]) => (
            <div key={jenjang} className="space-y-1.5">
              <h4 className="text-xs font-bold text-gray-700">
                Kohort {jenjang}
                {batas ? ` (dievaluasi sampai ${batas} tahun)` : ''}
              </h4>
              <ModalTable
                columns={SUCCESS_TABLE_COLUMNS}
                data={cohorts}
                isLoading={isLoading}
                error={error}
                emptyTitle="Tidak Ada Data Cohort"
                emptyDescription="Belum ada data riwayat keberhasilan studi dari backend."
              />
            </div>
          ))}
        </div>
      ),
    };
  }, [batasByJenjang, batasS1, batasS2, error, extraCohorts, isLoading, s1Cohorts, s2Cohorts]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rincian Keberhasilan Studi"
      subtitle={
        batasS1 && batasS2
          ? `Tingkat keberhasilan penyelesaian studi dihitung pada batas masa studi maksimal (S1: ${batasS1} tahun, S2: ${batasS2} tahun)`
          : 'Tingkat keberhasilan penyelesaian studi dihitung pada batas masa studi maksimal'
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
