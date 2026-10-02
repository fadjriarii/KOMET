import { useCallback, useMemo } from 'react';
import Modal from '../../../../components/common/modals/Modal';
import ModalSummaryBanner from '../../../../components/common/modals/ModalSummaryBanner';
import ModalTabNav from '../../../../components/common/modals/ModalTabNav';
import ModalTable from '../../../../components/common/modals/ModalTable';
import EmptyState from '../../../../components/common/feedback/EmptyState';
import ChartLoadingSkeleton from '../../../../components/common/feedback/ChartLoadingSkeleton';
import ModalTabContent from '../../../../components/common/modals/ModalTabContent';
import { useTabTransition } from '../../../../hooks/useTabTransition';
import { TREND_TABS } from './studentTrendConfig';
import {
  reverseTrendData,
  formatNumber,
  formatSignedPercentage,
} from '../../../../utils/uiHelpers';
import { getTrendStyle } from '../../../../utils/theme';
import { studentsService } from '../../services/studentsService';
import { useStudentDetailResource } from '../../hooks/useStudentDetailResource';
import TrendBarChart from '../../../../components/common/charts/TrendBarChart';
import TrendChartTooltip from '../../../../components/common/charts/TrendChartTooltip';
import {
  BarChart3,
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  Percent,
} from 'lucide-react';

const DECLINE_TABLE_COLUMNS = [
  {
    key: 'label',
    label: 'Simbol Rumus',
    icon: Percent,
    render: (row, idx) => (
      <span className="w-6 h-6 rounded-full bg-digital-blue-100/80 text-digital-blue-800 font-bold inline-flex items-center justify-center text-xs border border-digital-blue-200 shadow-2xs">
        {row.label || String.fromCharCode(65 + idx)}
      </span>
    ),
  },
  {
    key: 'academicYear',
    label: 'Tahun Akademik',
    icon: Calendar,
    cellClassName: 'font-semibold text-gray-900',
  },
  {
    key: 'intakeCount',
    label: 'Jumlah Mahasiswa Baru (Smt 1)',
    icon: Users,
    headerClassName: 'text-right',
    cellClassName: 'text-right font-medium text-digital-blue-900',
    render: (row) => (
      <span className="bg-digital-blue-50/80 text-digital-blue-800 px-2.5 py-0.5 rounded-md border border-digital-blue-100 font-semibold">
        {formatNumber(row.intakeCount)} mhs
      </span>
    ),
  },
  {
    key: 'changeFromPrev',
    label: 'Persentase Perubahan',
    icon: TrendingUp,
    headerClassName: 'text-right',
    cellClassName: 'text-right',
    render: (row) => {
      const hasChange = row.changeFromPrev !== null && row.changeFromPrev !== undefined;
      const isPositive = Number(row.changeFromPrev) >= 0;

      if (!hasChange) {
        return <span className="text-gray-400 font-medium">-</span>;
      }

      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border shadow-2xs ${
            isPositive
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {`${isPositive ? '+' : ''}${Number(row.changeFromPrev).toFixed(1)}%`}
        </span>
      );
    },
  },
];

export default function DeclineStudentsModal({
  isOpen,
  onClose,
  originRect,
  data,
  filters,
}) {
  const { activeTab, handleTabChange, slideClass } = useTabTransition(TREND_TABS, 'chart');
  const fetchDeclineDetail = useCallback((signal) => studentsService.getDeclineTrend(filters, { signal }), [filters]);
  const {
    data: declineData,
    isLoading,
    error,
  } = useStudentDetailResource({ isOpen, resourceKey: 'decline', filters, fetcher: fetchDeclineDetail, errorMessage: 'Gagal memuat data penurunan mahasiswa', summaryData: data, summaryKey: 'newStudentDecline' });

  const kpis = data?.kpis || {};
  const declineAverage = kpis.hasEnoughDeclineData ? formatSignedPercentage(kpis.declinePercentage) : '-';
  // Backend mengirim history dari terbaru ke terlama (A → E), cocok untuk tabel.
  const historyList = useMemo(() => declineData?.data?.history || declineData?.history || data?.summary?.newStudentDecline?.history || [], [data, declineData]);
  // Chart dibaca kiri ke kanan, maka urutannya diubah menjadi terlama ke terbaru.
  const chartList = reverseTrendData(historyList);
  const hasData = historyList.length > 0;
  const hasEnoughDeclineData = kpis.hasEnoughDeclineData !== false;
  const trendStyle = hasEnoughDeclineData
    ? getTrendStyle(kpis.isFluctuationPositive)
    : { textClass: 'text-gray-500', label: 'Data belum cukup' };
  const content = useMemo(() => ({
    chart: <div className="h-full flex flex-col pt-0.5 px-1">{isLoading ? <ChartLoadingSkeleton /> : !hasData ? <EmptyState title="Tidak Ada Data Penurunan" description={error || 'Belum ada data fluktuasi mahasiswa baru dari backend.'} icon={BarChart3} /> : <div className="h-48 sm:h-56 md:h-64 w-full"><TrendBarChart data={chartList} xDataKey="academicYear" bars={[{ dataKey: 'intakeCount', name: 'Jumlah Intake Mahasiswa Baru (5 Periode)', color: '#2563eb', labelKey: 'intakeCount' }]} tooltipContent={<TrendChartTooltip rows={[{ key: 'intakeCount', label: 'Jumlah Intake', colorClass: 'bg-digital-blue-600' }]} titleAccessory={(item) => item.label && <span className="w-5 h-5 rounded-full bg-digital-blue-50 text-digital-blue-700 font-bold inline-flex items-center justify-center text-[10px] border border-digital-blue-200">{item.label}</span>} />} /></div>}</div>,
    table: <div className="h-full flex flex-col pt-0.5 pb-1"><ModalTable columns={DECLINE_TABLE_COLUMNS} data={historyList} isLoading={isLoading} error={error} emptyTitle="Tidak Ada Riwayat Fluktuasi" emptyDescription="Belum ada data riwayat penurunan mahasiswa dari backend." /></div>,
  }), [chartList, error, hasData, historyList, isLoading]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rincian Penurunan Mahasiswa Baru (5 Tahun)"
      subtitle="Formula dan riwayat tren fluktuasi mahasiswa baru periode 5 tahun"
      maxWidth="max-w-4xl"
      originRect={originRect}
      showCloseButton={true}
    >
      <div className="flex flex-col h-full space-y-4">
        {/* TOP: 80/20 Summary Banner with Formula Highlight */}
        <ModalSummaryBanner
          description={
            <div className="space-y-1.5 text-justify">
              <p>
                Penurunan jumlah mahasiswa baru dihitung selama periode 5 tahun bergulir (periode aktif {kpis.declinePeriod || '-'}). Rata-rata fluktuasi saat ini tercatat sebesar <strong className="text-digital-blue-900 font-bold">{declineAverage}</strong>.
              </p>
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="font-bold text-digital-blue-900 text-[11px] uppercase tracking-wider">Formula:</span>
                <code className="px-2.5 py-0.5 rounded-md bg-white/95 border border-digital-blue-200/90 text-digital-blue-900 font-mono font-bold text-[11px] shadow-2xs">
                  % Penurunan MB = average [((B-A)/A) + ((C-B)/B) + ((D-C)/C) + ((E-D)/D)]
                </code>
              </div>
            </div>
          }
          label="Rata-rata Penurunan"
          value={declineAverage}
          sublabel={trendStyle.label}
          valueClassName={trendStyle.textClass}
          sublabelClassName={trendStyle.textClass}
        />

        {/* TABS: Diagram Tren | Tabel Riwayat */}
        <div className="flex-1 flex flex-col min-h-0">
          <ModalTabNav
            tabs={TREND_TABS}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />

          {/* Tab content area */}
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
