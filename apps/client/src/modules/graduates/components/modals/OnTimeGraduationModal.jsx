import { Fragment, useMemo } from 'react';
import Modal from '../../../../components/common/modals/Modal';
import ModalSummaryBanner from '../../../../components/common/modals/ModalSummaryBanner';
import ModalTabNav from '../../../../components/common/modals/ModalTabNav';
import ModalTabContent from '../../../../components/common/modals/ModalTabContent';
import { useTabTransition } from '../../../../hooks/useTabTransition';
import { formatPercentage } from '@komet/shared/formatters';
import { BarChart3 } from 'lucide-react';
import EmptyState from '../../../../components/common/feedback/EmptyState';
import { useDetail } from '../../graduateQueries';
import TrendBarChart from '../../../../components/common/charts/TrendBarChart';
import TrendChartTooltip from '../../../../components/common/charts/TrendChartTooltip';
import {
  onTimeTabs,
  selectChartCohorts,
  tabsForSelectedJenjang,
  withBatas,
  withoutDefaultTahunLulus,
} from './graduateTrendConfig';
import { OUTCOME_COLORS, jenjangName } from './totalTrendBars';
import { describeScope, searchSentence } from '../../utils/filterScope';

// Satu builder dipakai tab S1 dan S2; angka batas datang dari server (batasS1/batasS2).
function CohortTrendChart({ cohorts, batas, isLoading, error }) {
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
              dataKey: 'onTimeCount',
              name: withBatas('Tepat Waktu', batas, '='),
              color: OUTCOME_COLORS.onTime,
              labelKey: 'onTimeCount',
            },
            {
              dataKey: 'fastCount',
              name: withBatas('Lebih Cepat', batas, '<'),
              color: OUTCOME_COLORS.fast,
              labelKey: 'fastCount',
            },
            {
              dataKey: 'lateCount',
              name: withBatas('Lewat Waktu', batas, '>'),
              color: OUTCOME_COLORS.late,
              labelKey: 'lateCount',
            },
          ]}
          tooltipContent={
            <TrendChartTooltip
              titleKey="cohortLabel"
              rows={[
                {
                  key: 'onTimeCount',
                  label: 'Lulus Tepat Waktu',
                  color: OUTCOME_COLORS.onTime,
                },
                {
                  key: 'fastCount',
                  label: 'Lulus Lebih Cepat',
                  color: OUTCOME_COLORS.fast,
                },
                {
                  key: 'lateCount',
                  label: 'Lewat Batas Waktu',
                  color: OUTCOME_COLORS.late,
                },
              ]}
            />
          }
        />
      </div>
      <p className="text-[10px] text-gray-500 text-center">
        Jendela 5 cohort terbaru; pilih Tahun Lulus spesifik untuk satu tahun.
      </p>
    </div>
  );
}

export default function OnTimeGraduationModal({ isOpen, onClose, originRect, data, filters }) {
  // Tahun Lulus default = tahun terbaru; untuk chart itu jangkar jendela,
  // bukan filter satu tahun. Pilihan manual user tetap diteruskan.
  const defaultTahunLulus = data?.filterOptions?.rollingYears?.[0];
  const detailFilters = useMemo(
    () => withoutDefaultTahunLulus(filters, defaultTahunLulus),
    [filters, defaultTahunLulus],
  );

  const {
    data: detailData,
    isLoading,
    error,
  } = useDetail({
    isOpen,
    resourceKey: 'tepat-waktu',
    filters: detailFilters,
    method: 'getTepatWaktuDetail',
    errorMessage: 'Gagal memuat data kelulusan tepat waktu',
  });

  // Batas per jenjang dibaca generik dari payload (batasS1/batasS2/
  // batasProfesi, dan batas jenjang baru bila server mengirimnya) supaya
  // tab jenjang baru muncul tanpa ubah client.
  const batasByJenjang = useMemo(() => {
    const entries = Object.entries(detailData ?? {}).filter(
      ([key, value]) => /^batas[A-Z]/.test(key) && typeof value === 'number',
    );
    return Object.fromEntries(
      entries.map(([key, value]) => [key.replace(/^batas/, '').toLowerCase(), value]),
    );
  }, [detailData]);
  const batasS1 = batasByJenjang.s1;
  const batasS2 = batasByJenjang.s2;

  const cohortsByJenjang = useMemo(() => {
    // Jenjang tanpa kohort (mis. D3 tanpa data) tidak membentuk tab kosong.
    const entries = Object.entries(detailData ?? {}).filter(
      ([key, value]) => !/^batas[A-Z]/.test(key) && Array.isArray(value) && value.length > 0,
    );
    return Object.fromEntries(entries);
  }, [detailData]);
  // Tab hanya untuk jenjang yang datanya benar ada (batas hanya melabeli
  // angka) — kunci batas yatim tidak bisa membentuk tab S3 hantu.
  const selectedJenjang = useMemo(() => filters?.jenjang || [], [filters?.jenjang]);
  const tabs = useMemo(
    () =>
      tabsForSelectedJenjang(
        onTimeTabs(
          Object.fromEntries(
            Object.keys(cohortsByJenjang).map((key) => [key, batasByJenjang[key]]),
          ),
        ),
        selectedJenjang,
      ),
    [batasByJenjang, cohortsByJenjang, selectedJenjang],
  );
  const initialTab = selectedJenjang.length === 1 ? selectedJenjang[0].toLowerCase() : tabs[0]?.key;
  const { activeTab, handleTabChange, slideClass } = useTabTransition(tabs, initialTab);

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
  const onTimeScopePhrase =
    data?.summary?.tepatWaktu?.tahunScope?.phrase || 'di seluruh tahun akademik tercatat';
  const s1BatasPhrase = batasS1 ? ` (≤ ${batasS1} tahun)` : ' tepat waktu';
  const s2BatasPhrase = batasS2 ? ` (≤ ${batasS2} tahun)` : ' tepat waktu';
  const onTimeS1 = formatPercentage(kpis.onTimeGraduationRateS1, 1, '0.0%');
  const onTimeS2 = formatPercentage(kpis.onTimeGraduationRateS2, 1, '0.0%');
  const onTimeOverall = formatPercentage(kpis.onTimeGraduationRateOverall, 1, '0.0%');
  // Segmen jenjang tanpa data (null) disembunyikan; 0% tetap tampil.
  const onTimeSegments = [
    ...(kpis.onTimeGraduationRateS1 != null
      ? [{ key: 's1', jenjang: 'S1', value: onTimeS1, batas: s1BatasPhrase }]
      : []),
    ...(kpis.onTimeGraduationRateS2 != null
      ? [{ key: 's2', jenjang: 'S2', value: onTimeS2, batas: s2BatasPhrase }]
      : []),
    ...Object.entries(kpis.onTimeByJenjang || {})
      .filter(([key, value]) => key !== 's1' && key !== 's2' && value != null)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => ({
        key,
        jenjang: jenjangName(key),
        value: formatPercentage(value, 1),
        batas: batasByJenjang[key] ? ` (≤ ${batasByJenjang[key]} tahun)` : ' tepat waktu',
      })),
  ];
  const s1Cohorts = useMemo(() => cohortsByJenjang.s1 || [], [cohortsByJenjang]);
  const s2Cohorts = useMemo(() => cohortsByJenjang.s2 || [], [cohortsByJenjang]);
  const extraCohorts = useMemo(
    () => Object.entries(cohortsByJenjang).filter(([key]) => key !== 's1' && key !== 's2'),
    [cohortsByJenjang],
  );
  const explicitYear = Boolean(detailFilters?.selectedTahunLulus?.length);

  const content = useMemo(() => {
    const entries = {
      s1: (
        <CohortTrendChart
          cohorts={selectChartCohorts(s1Cohorts, explicitYear)}
          batas={batasS1}
          isLoading={isLoading}
          error={error}
        />
      ),
      s2: (
        <CohortTrendChart
          cohorts={selectChartCohorts(s2Cohorts, explicitYear)}
          batas={batasS2}
          isLoading={isLoading}
          error={error}
        />
      ),
    };
    for (const [key, cohorts] of extraCohorts) {
      entries[key] = (
        <CohortTrendChart
          cohorts={selectChartCohorts(cohorts, explicitYear)}
          batas={batasByJenjang[key]}
          isLoading={isLoading}
          error={error}
        />
      );
    }
    return entries;
  }, [
    batasByJenjang,
    batasS1,
    batasS2,
    error,
    explicitYear,
    extraCohorts,
    isLoading,
    s1Cohorts,
    s2Cohorts,
  ]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rincian Kelulusan Tepat Waktu"
      subtitle={
        batasS1 && batasS2
          ? `Evaluasi masa studi standar: S1 (≤ ${batasS1} tahun) dan S2 (≤ ${batasS2} tahun)`
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
                <strong className="text-digital-blue-900 font-bold">{onTimeOverall}</strong> lulusan
                lulus tepat waktu, dihitung dari lulusan {onTimeScopePhrase}. Tepat waktu berarti
                lulus dalam masa studi standar jenjangnya masing-masing, dihitung dari tahun masuk
                hingga tahun lulus. Rincian:{' '}
                {onTimeSegments.length ? (
                  onTimeSegments.map((segment, index) => (
                    <Fragment key={segment.key}>
                      {index > 0 ? ' dan ' : null}
                      {segment.jenjang}{' '}
                      <strong className="text-digital-blue-900 font-bold">
                        {segment.value}
                        {segment.batas}
                      </strong>{' '}
                      lulus
                    </Fragment>
                  ))
                ) : (
                  <>
                    S1{' '}
                    <strong className="text-digital-blue-900 font-bold">
                      {onTimeS1}
                      {s1BatasPhrase}
                    </strong>{' '}
                    lulus dan S2{' '}
                    <strong className="text-digital-blue-900 font-bold">
                      {onTimeS2}
                      {s2BatasPhrase}
                    </strong>{' '}
                    lulus
                  </>
                )}
                .{searchSuffix}
              </p>
            </div>
          }
          label="Tepat Waktu"
          value={onTimeOverall}
          sublabel={
            onTimeSegments.length
              ? onTimeSegments.map((segment) => `${segment.jenjang}: ${segment.value}`).join(', ')
              : `S1: ${onTimeS1}, S2: ${onTimeS2}`
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
