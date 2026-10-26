import { useMemo } from 'react';
import TrendModal from '../../../../components/common/modals/TrendModal';
import ModalTable from '../../../../components/common/modals/ModalTable';
import { DeclineBanner } from './DeclineBanner';
import { DeclineChart } from './DeclineChart';
import { DECLINE_TABLE_COLUMNS } from './declineTableColumns';
import { useTabTransition } from '../../../../hooks/useTabTransition';
import { TREND_TABS } from '../../../../components/common/modals/modalTabs';
import { reverseTrendData } from '../../../../utils/uiHelpers';
import { formatSignedPercentage } from '@komet/shared/formatters';
import { getTrendStyle, INSUFFICIENT_DATA_TREND_STYLE } from '../../../../utils/theme';
import { useDetail } from '../../studentQueries';
import { intakeExtraTabs } from './intakeExtraTabs';

export default function DeclineStudentsModal({ isOpen, onClose, originRect, data, filters }) {
  const {
    data: declineData,
    isLoading,
    error,
  } = useDetail({
    isOpen,
    resourceKey: 'decline',
    filters,
    method: 'getDeclineTrend',
    errorMessage: 'Gagal memuat data penurunan mahasiswa',
    summaryData: data,
    summaryKey: 'newStudentDecline',
  });
  // Rincian per prodi / status saat ini: satu endpoint dipakai modal Intake dan Penurunan.
  const { data: breakdown } = useDetail({
    isOpen,
    resourceKey: 'intake-breakdown',
    filters,
    method: 'getIntakeBreakdown',
    errorMessage: 'Gagal memuat rincian per program studi',
  });
  const extra = useMemo(() => intakeExtraTabs(breakdown), [breakdown]);
  const tabs = useMemo(() => [...TREND_TABS, ...extra.tabs], [extra]);
  const { activeTab, handleTabChange, slideClass } = useTabTransition(tabs, 'chart');

  const kpis = data?.kpis || {};
  const yearsCount =
    Number.isInteger(kpis.declineYearsCount) && kpis.declineYearsCount > 0
      ? kpis.declineYearsCount
      : 5;
  const declineAverage = kpis.hasEnoughDeclineData
    ? formatSignedPercentage(kpis.declinePercentage)
    : '-';
  // Backend mengirim history dari terbaru ke terlama (A → E), cocok untuk tabel.
  const historyList = useMemo(() => declineData?.history || [], [declineData]);
  // Chart dibaca kiri ke kanan, maka urutannya diubah menjadi terlama ke terbaru.
  const chartList = reverseTrendData(historyList);
  const hasData = historyList.length > 0;
  const hasEnoughDeclineData = kpis.hasEnoughDeclineData !== false;
  const trendStyle = hasEnoughDeclineData
    ? getTrendStyle(kpis.isFluctuationPositive)
    : INSUFFICIENT_DATA_TREND_STYLE;
  const content = useMemo(
    () => ({
      chart: (
        <div className="h-full flex flex-col pt-0.5 px-1">
          <DeclineChart
            chartList={chartList}
            hasData={hasData}
            isLoading={isLoading}
            error={error}
            yearsCount={yearsCount}
          />
        </div>
      ),
      table: (
        <div className="h-full flex flex-col pt-0.5 pb-1">
          <ModalTable
            columns={DECLINE_TABLE_COLUMNS}
            data={historyList}
            isLoading={isLoading}
            error={error}
            emptyTitle="Tidak Ada Riwayat Fluktuasi"
            emptyDescription="Belum ada data riwayat penurunan mahasiswa dari backend."
          />
        </div>
      ),
    }),
    [chartList, error, hasData, historyList, isLoading, yearsCount],
  );

  return (
    <TrendModal
      isOpen={isOpen}
      onClose={onClose}
      originRect={originRect}
      title={`Rincian Penurunan Mahasiswa Baru (${yearsCount} Tahun)`}
      subtitle={`Formula dan riwayat tren fluktuasi mahasiswa baru periode ${yearsCount} tahun`}
      banner={
        <DeclineBanner
          kpis={kpis}
          declineAverage={declineAverage}
          trendStyle={trendStyle}
          yearsCount={yearsCount}
        />
      }
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      slideClass={slideClass}
      chart={content.chart}
      table={content.table}
      extraContent={extra.content}
    />
  );
}
