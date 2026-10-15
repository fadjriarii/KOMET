import { useMemo } from 'react';
import TrendModal from '../../../../components/common/modals/TrendModal';
import ModalTable from '../../../../components/common/modals/ModalTable';
import { ForeignBanner } from './ForeignBanner';
import { FOREIGN_TABLE_COLUMNS } from './foreignTableColumns';
import { useTabTransition } from '../../../../hooks/useTabTransition';
import { reverseTrendData } from '../../../../utils/uiHelpers';
import { formatNumber, formatPercentage } from '@komet/shared/formatters';
import { useDetail } from '../../studentQueries';
import ForeignTrendComposedChart from './ForeignTrendComposedChart';
import { TREND_TABS } from '../../../../components/common/modals/modalTabs';

export default function ForeignStudentsModal({ isOpen, onClose, originRect, data, filters }) {
  const { activeTab, handleTabChange, slideClass } = useTabTransition(TREND_TABS, 'chart');
  const {
    data: detailData,
    isLoading,
    error,
  } = useDetail({
    isOpen,
    resourceKey: 'foreign',
    filters,
    method: 'getInternationalDetail',
    errorMessage: 'Gagal memuat data mahasiswa asing',
    summaryData: data,
    summaryKey: 'internationalStudentsTrend',
  });
  const kpis = data?.kpis || {};
  const trendData = useMemo(() => detailData?.trendData || [], [detailData]);
  // Baris mana yang mewakili tahun terpilih sudah ditentukan server; klien tinggal
  // membacanya, dan ikut memakai tahun baris itu bila pemilih tahun kosong.
  const targetItem = detailData?.selected || null;

  const foreignRate = formatPercentage(targetItem?.percentage ?? kpis.foreignRate, 1);
  const foreignCount = formatNumber(targetItem?.foreignCount ?? kpis.foreignStudentsCount);
  const activeCount = formatNumber(targetItem?.totalCount ?? kpis.activeStudentsCount);
  const displayAcademicYear = filters?.tahunAjaran || targetItem?.academicYear;

  const content = useMemo(
    () => ({
      chart: (
        <div className="h-full flex flex-col pt-0.5 px-1">
          <ForeignTrendComposedChart data={trendData} isLoading={isLoading} error={error} />
        </div>
      ),
      table: (
        <div className="h-full flex flex-col pt-0.5 pb-1">
          <ModalTable
            columns={FOREIGN_TABLE_COLUMNS}
            data={reverseTrendData(trendData)}
            isLoading={isLoading}
            error={error}
            emptyTitle="Tidak Ada Data Riwayat"
            emptyDescription="Belum ada data riwayat mahasiswa asing dari backend."
          />
        </div>
      ),
    }),
    [error, isLoading, trendData],
  );

  return (
    <TrendModal
      isOpen={isOpen}
      onClose={onClose}
      originRect={originRect}
      title="Rincian Mahasiswa Asing (Non-WNI)"
      subtitle="Distribusi dan tren rasio mahasiswa berkewarganegaraan asing"
      banner={
        <ForeignBanner
          foreignRate={foreignRate}
          foreignCount={foreignCount}
          activeCount={activeCount}
          displayAcademicYear={displayAcademicYear}
        />
      }
      tabs={TREND_TABS}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      slideClass={slideClass}
      chart={content.chart}
      table={content.table}
    />
  );
}
