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

export default function IntakeStudentsModal({ isOpen, onClose, originRect, data, filters }) {
  const { activeTab, handleTabChange, slideClass } = useTabTransition(TREND_TABS, 'chart');
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

  const kpis = data?.kpis || {};
  const intakeCount = formatNumber(kpis.intakeCohortCount);
  const trendList = useMemo(() => intakeData?.trend || [], [intakeData]);
  const tableData = reverseTrendData(trendList);
  const hasData = trendList.length > 0;
  const content = useMemo(
    () => ({
      chart: (
        <div className="h-full flex flex-col pt-0.5 px-1">
          <IntakeChart
            trendList={trendList}
            hasData={hasData}
            isLoading={isLoading}
            error={error}
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
    [error, hasData, isLoading, tableData, trendList],
  );

  return (
    <TrendModal
      isOpen={isOpen}
      onClose={onClose}
      originRect={originRect}
      title="Rincian Intake Mahasiswa Baru"
      subtitle="Riwayat penerimaan mahasiswa baru semester 1 status aktif"
      banner={
        <ModalSummaryBanner
          description={getStudentIntakeDescription(kpis.intakePeriod, intakeCount)}
          label="Intake Semester 1"
          value={intakeCount}
          sublabel={kpis.intakePeriod ? `Periode ${kpis.intakePeriod}` : 'Mahasiswa Baru'}
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
