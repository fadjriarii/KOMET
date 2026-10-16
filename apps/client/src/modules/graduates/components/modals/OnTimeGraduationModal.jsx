import { Fragment, useMemo } from 'react';
import { Calendar, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
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
import { onTimeTabs, withBatas } from './graduateTrendConfig';
import { describeScope, searchSentence } from '../../utils/filterScope';

const ON_TIME_TABLE_COLUMNS = [
  {
    key: 'cohortLabel',
    label: 'Cohort / Angkatan',
    icon: Calendar,
    render: (row) => (
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-digital-blue-500" />
        <span className="font-semibold text-gray-900">{row.cohortLabel}</span>
      </div>
    ),
  },
  {
    key: 'fastCount',
    label: 'Lulus Lebih Cepat',
    icon: CheckCircle2,
    headerClassName: 'text-right',
    cellClassName: 'text-right font-medium text-emerald-700',
    render: (row) => `${formatNumber(row.fastCount)} mhs`,
  },
  {
    key: 'onTimeCount',
    label: 'Lulus Tepat Waktu',
    icon: Clock,
    headerClassName: 'text-right',
    cellClassName: 'text-right font-medium text-digital-blue-900',
    render: (row) => (
      <span className="bg-digital-blue-50/80 text-digital-blue-800 px-2.5 py-0.5 rounded-md border border-digital-blue-100 font-semibold">
        {formatNumber(row.onTimeCount)} mhs
      </span>
    ),
  },
  {
    key: 'lateCount',
    label: 'Lewat Batas Waktu',
    icon: AlertCircle,
    headerClassName: 'text-right',
    cellClassName: 'text-right font-medium text-amber-700',
    render: (row) => `${formatNumber(row.lateCount)} mhs`,
  },
  {
    key: 'rate',
    label: 'Persentase Tepat Waktu',
    icon: Clock,
    headerClassName: 'text-right',
    cellClassName: 'text-right font-bold text-digital-blue-700',
    render: (row) => (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-digital-blue-50 text-digital-blue-800 border border-digital-blue-200">
        {formatPercentage(row.rate, 1, '0.0%')}
      </span>
    ),
  },
];

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
          bars={[
            {
              dataKey: 'onTimeCount',
              name: withBatas('Tepat Waktu', batas, '≤'),
              color: DIGITAL_BLUE[600],
              labelKey: 'rate',
              labelFormatter: (value) => formatPercentage(value),
            },
            {
              dataKey: 'fastCount',
              name: withBatas('Lebih Cepat', batas, '<'),
              color: '#10B981',
              labelKey: 'fastCount',
            },
            {
              dataKey: 'lateCount',
              name: withBatas('Lewat Waktu', batas, '>'),
              color: '#F59E0B',
              labelKey: 'lateCount',
            },
          ]}
          tooltipContent={
            <TrendChartTooltip
              titleKey="cohortLabel"
              rows={[
                { key: 'onTimeCount', label: 'Tepat Waktu', colorClass: 'bg-digital-blue-600' },
                { key: 'fastCount', label: 'Lebih Cepat', colorClass: 'bg-emerald-500' },
                { key: 'lateCount', label: 'Lewat Batas', colorClass: 'bg-amber-500' },
              ]}
              footer={{
                key: 'rate',
                label: 'Persentase Tepat Waktu',
                format: formatPercentage,
              }}
            />
          }
        />
      </div>
    </div>
  );
}

export default function OnTimeGraduationModal({ isOpen, onClose, originRect, data, filters }) {
  const {
    data: detailData,
    isLoading,
    error,
  } = useDetail({
    isOpen,
    resourceKey: 'tepat-waktu',
    filters,
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
    const entries = Object.entries(detailData ?? {}).filter(
      ([key, value]) => !/^batas[A-Z]/.test(key) && Array.isArray(value),
    );
    return Object.fromEntries(entries);
  }, [detailData]);
  // Tab hanya untuk jenjang yang datanya benar ada (batas hanya melabeli
  // angka) — kunci batas yatim tidak bisa membentuk tab S3 hantu.
  const tabs = useMemo(
    () =>
      onTimeTabs(
        Object.fromEntries(Object.keys(cohortsByJenjang).map((key) => [key, batasByJenjang[key]])),
      ),
    [batasByJenjang, cohortsByJenjang],
  );
  const { activeTab, handleTabChange, slideClass } = useTabTransition(tabs, 's1');

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
  // Segmen jenjang bernilai 0 disembunyikan, hanya yang ada nilainya.
  const onTimeSegments = [
    ...(kpis.onTimeGraduationRateS1
      ? [{ key: 's1', jenjang: 'S1', value: onTimeS1, batas: s1BatasPhrase }]
      : []),
    ...(kpis.onTimeGraduationRateS2
      ? [{ key: 's2', jenjang: 'S2', value: onTimeS2, batas: s2BatasPhrase }]
      : []),
    ...Object.entries(kpis.onTimeByJenjang || {})
      .filter(([key, value]) => key !== 's1' && key !== 's2' && value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => ({
        key,
        jenjang: key.toUpperCase(),
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
                {batas ? ` (tepat waktu ≤ ${batas} tahun)` : ''}
              </h4>
              <ModalTable
                columns={ON_TIME_TABLE_COLUMNS}
                data={cohorts}
                isLoading={isLoading}
                error={error}
                emptyTitle="Tidak Ada Data Cohort"
                emptyDescription="Belum ada data riwayat kelulusan tepat waktu dari backend."
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
                , dihitung dari lulusan {onTimeScopePhrase}.{searchSuffix}
              </p>
            </div>
          }
          label="Tepat Waktu"
          value={onTimeOverall}
          sublabel={`S1: ${onTimeS1}, S2: ${onTimeS2}`}
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
