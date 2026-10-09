import { useMemo } from 'react';
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

  const batasS1 = detailData?.batasS1;
  const batasS2 = detailData?.batasS2;
  const batasProf = detailData?.batasProf;
  const tabs = useMemo(
    () => onTimeTabs({ s1: batasS1, s2: batasS2, prof: batasProf }),
    [batasS1, batasS2, batasProf],
  );
  const { activeTab, handleTabChange, slideClass } = useTabTransition(tabs, 's1');

  const kpis = data?.kpis || {};
  const onTimeS1 = formatPercentage(kpis.onTimeGraduationRateS1, 1, '0.0%');
  const onTimeS2 = formatPercentage(kpis.onTimeGraduationRateS2, 1, '0.0%');

  const cohortsByJenjang = useMemo(() => {
    const entries = Object.entries(detailData ?? {}).filter(
      ([key, value]) =>
        key !== 'batasS1' && key !== 'batasS2' && key !== 'batasProf' && Array.isArray(value),
    );
    return Object.fromEntries(entries);
  }, [detailData]);
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
          batas={key === 'prof' ? batasProf : undefined}
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
              key === 'prof' ? batasProf : undefined,
            ]),
          ].map(([jenjang, cohorts, batas]) => (
            <div key={jenjang} className="space-y-1.5">
              <h4 className="text-xs font-bold text-gray-700">
                Kohort {jenjang}
                {batas ? ` — tepat waktu ≤ ${batas} tahun` : ''}
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
  }, [batasProf, batasS1, batasS2, error, extraCohorts, isLoading, s1Cohorts, s2Cohorts]);

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
                Tingkat kelulusan tepat waktu mencapai{' '}
                <strong className="text-digital-blue-900 font-bold">{onTimeS1} (Jenjang S1)</strong>{' '}
                dan{' '}
                <strong className="text-digital-blue-900 font-bold">{onTimeS2} (Jenjang S2)</strong>{' '}
                dihitung berdasarkan rasio mahasiswa yang lulus dalam kurun waktu masa studi
                standar.
              </p>
            </div>
          }
          label="Tepat Waktu (S1)"
          value={onTimeS1}
          sublabel={`S2: ${onTimeS2}`}
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
