import { useMemo } from 'react';
import TrendModal from '../../../../components/common/modals/TrendModal';
import ModalSummaryBanner from '../../../../components/common/modals/ModalSummaryBanner';
import ModalTable from '../../../../components/common/modals/ModalTable';
import { IntakeChart } from './IntakeChart';
import { INTAKE_TABLE_COLUMNS } from './intakeTableColumns';
import { useTabTransition } from '../../../../hooks/useTabTransition';
import { TREND_TABS } from '../../../../components/common/modals/modalTabs';
import { getStudentIntakeDescription, reverseTrendData } from '../../../../utils/uiHelpers';
import { formatNumber } from '@komet/shared/formatters';
import { useDetail } from '../../studentQueries';
import { intakeExtraTabs } from './intakeExtraTabs';

export default function IntakeStudentsModal({ isOpen, onClose, originRect, data, filters }) {
  const {
    data: intakeData,
    isLoading,
    error,
  } = useDetail({
    isOpen,
    resourceKey: 'intake',
    filters,
    method: 'getIntakeTrend',
    errorMessage: 'Gagal memuat data intake mahasiswa',
    summaryData: data,
    summaryKey: 'intakeTrend',
  });
  // Rincian per prodi / status saat ini: satu endpoint dipakai modal Intake dan Penurunan.
  const { data: breakdown } = useDetail({
    isOpen,
    resourceKey: 'intake-breakdown',
    filters,
    method: 'getIntakeBreakdown',
    errorMessage: 'Gagal memuat rincian per program studi',
  });
  const extra = useMemo(() => intakeExtraTabs(breakdown, { withStatus: true }), [breakdown]);
  const tabs = useMemo(() => [...TREND_TABS, ...extra.tabs], [extra]);
  const { activeTab, handleTabChange, slideClass } = useTabTransition(tabs, 'chart');

  const kpis = data?.kpis || {};
  const intakeCount = formatNumber(kpis.intakeCohortCount);
  const trendList = useMemo(() => intakeData?.trend || [], [intakeData]);
  const tableData = reverseTrendData(trendList);
  const hasData = trendList.length > 0;
  // Tahun di balik angka kartu: angkatan yang dipilih, atau periode intake kartu.
  const selectedYears = filters?.selectedYears;
  const intakePeriod = kpis.intakePeriod;
  const highlightYears = useMemo(() => {
    if (Array.isArray(selectedYears) && selectedYears.length) return selectedYears;
    return /^\d{4}\/\d{4}$/.test(intakePeriod || '') ? [intakePeriod] : [];
  }, [selectedYears, intakePeriod]);
  const content = useMemo(
    () => ({
      chart: (
        <div className="h-full flex flex-col pt-0.5 px-1">
          <IntakeChart
            trendList={trendList}
            hasData={hasData}
            isLoading={isLoading}
            error={error}
            highlightYears={highlightYears}
          />
        </div>
      ),
      table: (
        <div className="h-full flex flex-col pt-0.5 pb-1">
          <ModalTable
            columns={INTAKE_TABLE_COLUMNS}
            data={tableData}
            isLoading={isLoading}
            error={error}
            emptyTitle="Tidak Ada Riwayat Intake"
            emptyDescription="Belum ada data riwayat intake mahasiswa baru dari backend."
          />
        </div>
      ),
    }),
    [error, hasData, highlightYears, isLoading, tableData, trendList],
  );

  return (
    <TrendModal
      isOpen={isOpen}
      onClose={onClose}
      originRect={originRect}
      title="Rincian Intake Mahasiswa Baru"
      subtitle="Riwayat penerimaan mahasiswa baru semester 1 (semua status)"
      banner={
        <ModalSummaryBanner
          description={getStudentIntakeDescription(kpis.intakePeriod, intakeCount)}
          label="Intake Semester 1"
          value={intakeCount}
          sublabel={kpis.intakePeriod ? `Periode ${kpis.intakePeriod}` : 'Mahasiswa Baru'}
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
