import { useMemo } from 'react';
import Modal from '../../../../components/common/modals/Modal';
import ModalSummaryBanner from '../../../../components/common/modals/ModalSummaryBanner';
import ModalTabNav from '../../../../components/common/modals/ModalTabNav';
import ModalTable from '../../../../components/common/modals/ModalTable';
import EmptyState from '../../../../components/common/feedback/EmptyState';
import ChartLoadingSkeleton from '../../../../components/common/feedback/ChartLoadingSkeleton';
import ModalTabContent from '../../../../components/common/modals/ModalTabContent';
import { useTabTransition } from '../../../../hooks/useTabTransition';
import { TREND_TABS } from './studentTrendConfig';
import { getStudentIntakeDescription, reverseTrendData } from '../../../../utils/uiHelpers';
import { formatNumber, formatSignedPercentage } from '@komet/shared/formatters';
import { useDetail } from '../../studentQueries';
import TrendBarChart from '../../../../components/common/charts/TrendBarChart';
import TrendChartTooltip from '../../../../components/common/charts/TrendChartTooltip';
import { Calendar, TrendingUp, TrendingDown, Users, BarChart3 } from 'lucide-react';

const INTAKE_TABLE_COLUMNS = [
  {
    key: 'tahun',
    label: 'Tahun Akademik / Angkatan',
    icon: Calendar,
    render: (row) => (
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-digital-blue-500"></span>
        <span className="font-semibold text-gray-900">{row.tahun}</span>
      </div>
    ),
  },
  {
    key: 'intakeCount',
    label: 'Jumlah Intake (Semester 1)',
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
    key: 'growthPercentage',
    label: 'Pertumbuhan Intake',
    icon: TrendingUp,
    headerClassName: 'text-right',
    cellClassName: 'text-right',
    render: (row) => (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border shadow-2xs ${
          row.isPositive
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-rose-50 text-rose-700 border-rose-200'
        }`}
      >
        {row.isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {formatSignedPercentage(row.growthPercentage)}
      </span>
    ),
  },
];

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
          {isLoading ? (
            <ChartLoadingSkeleton />
          ) : !hasData ? (
            <EmptyState
              title="Tidak Ada Data Tren Intake"
              description={error || 'Belum ada data tren intake mahasiswa baru dari backend.'}
              icon={BarChart3}
            />
          ) : (
            <div className="h-48 sm:h-56 md:h-64 w-full">
              <TrendBarChart
                data={trendList}
                bars={[
                  {
                    dataKey: 'intakeCount',
                    name: 'Jumlah Intake Mahasiswa Baru (Semester 1)',
                    color: '#2563eb',
                    labelKey: 'intakeCount',
                  },
                ]}
                tooltipContent={
                  <TrendChartTooltip
                    titleKey="tahun"
                    rows={[
                      {
                        key: 'intakeCount',
                        label: 'Intake Mahasiswa',
                        colorClass: 'bg-digital-blue-600',
                      },
                    ]}
                    footer={{
                      key: 'growthPercentage',
                      label: 'Pertumbuhan',
                      format: formatSignedPercentage,
                      valueClassName: (_value, item) =>
                        `font-bold px-1.5 py-0.5 rounded text-[11px] ${item.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`,
                    }}
                  />
                }
              />
            </div>
          )}
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rincian Intake Mahasiswa Baru"
      subtitle="Riwayat penerimaan mahasiswa baru semester 1 status aktif"
      maxWidth="max-w-4xl"
      originRect={originRect}
      showCloseButton={true}
    >
      <div className="flex flex-col h-full space-y-4">
        {/* TOP: 80/20 Summary Banner */}
        <ModalSummaryBanner
          description={getStudentIntakeDescription(kpis.intakePeriod, intakeCount)}
          label="Intake Semester 1"
          value={intakeCount}
          sublabel={kpis.intakePeriod ? `Periode ${kpis.intakePeriod}` : 'Mahasiswa Baru'}
        />

        {/* TABS: Diagram Tren | Tabel Riwayat */}
        <div className="flex-1 flex flex-col min-h-0">
          <ModalTabNav tabs={TREND_TABS} activeTab={activeTab} onTabChange={handleTabChange} />

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
