import { useCallback } from 'react';
import Modal from '../../../../components/common/modals/Modal';
import ModalSummaryBanner from '../../../../components/common/modals/ModalSummaryBanner';
import ModalTabNav from '../../../../components/common/modals/ModalTabNav';
import ModalTable from '../../../../components/common/modals/ModalTable';
import EmptyState from '../../../../components/common/feedback/EmptyState';
import Skeleton from '../../../../components/common/feedback/Skeleton';
import { useTabTransition } from '../../../../hooks/useTabTransition';
import { TREND_TABS } from './studentTrendConfig';
import {
  getStudentIntakeDescription,
  formatCompactNumber,
  formatNumber,
  reverseTrendData,
  getTooltipPayloadItem,
} from '../../../../utils/uiHelpers';
import { DIGITAL_BLUE } from '../../../../utils/theme';
import { studentsService } from '../../services/studentsService';
import { useStudentDetailResource } from '../../hooks/useStudentDetailResource';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
} from 'recharts';

const INTAKE_TABS = TREND_TABS;

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
        {row.intakeCountFormatted}
      </span>
    ),
  },
  {
    key: 'growthFormatted',
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
        {row.growthFormatted}
      </span>
    ),
  },
];

export default function IntakeStudentsModal({
  isOpen,
  onClose,
  originRect,
  data,
  filters,
}) {
  const { activeTab, handleTabChange, slideClass } = useTabTransition(INTAKE_TABS, 'chart');
  const fetchIntakeDetail = useCallback(() => studentsService.getIntakeTrend(filters), [filters]);
  const {
    data: intakeData,
    isLoading,
    error,
  } = useStudentDetailResource(
    isOpen,
    fetchIntakeDetail,
    'Gagal memuat data intake mahasiswa'
  );

  const kpis = data?.kpis || {};
  const trendList = intakeData?.data || data?.summary?.intakeTrend?.trend || [];
  const tableData = reverseTrendData(trendList);
  const hasData = trendList.length > 0;

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
          description={getStudentIntakeDescription(kpis.intakePeriod, kpis.formattedIntakeCount)}
          label="Intake Semester 1"
          value={kpis.formattedIntakeCount}
          sublabel={kpis.intakePeriod ? `Periode ${kpis.intakePeriod}` : 'Mahasiswa Baru'}
        />

        {/* TABS: Diagram Tren | Tabel Riwayat */}
        <div className="flex-1 flex flex-col min-h-0">
          <ModalTabNav
            tabs={INTAKE_TABS}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />

          {/* Tab content area */}
          <div className="flex-1 min-h-0 overflow-x-hidden w-full">
            <div key={activeTab} className={`h-full ${slideClass}`}>
              {/* TAB 1: Diagram Tren — Recharts BarChart */}
              {activeTab === 'chart' && (
                <div className="h-full flex flex-col pt-0.5 px-1">
                  {isLoading ? (
                    <div className="space-y-3 py-6">
                      <Skeleton className="h-6 w-1/3 rounded-lg" />
                      <Skeleton className="h-44 w-full rounded-2xl" />
                    </div>
                  ) : !hasData ? (
                    <EmptyState
                      title="Tidak Ada Data Tren Intake"
                      description={error || 'Belum ada data tren intake mahasiswa baru dari backend.'}
                      icon={BarChart3}
                    />
                  ) : (
                    <ResponsiveContainer width="100%" height={230}>
                      <BarChart
                        data={trendList}
                        margin={{ top: 8, right: 24, left: 4, bottom: 44 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                        <XAxis
                          dataKey="tahun"
                          tick={{ fontSize: 10, fill: '#6b7280' }}
                          angle={-25}
                          textAnchor="end"
                          interval={0}
                          tickLine={false}
                          axisLine={{ stroke: '#e5e7eb' }}
                          dy={6}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: '#9ca3af' }}
                          tickFormatter={formatCompactNumber}
                          tickLine={false}
                          axisLine={false}
                          width={44}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const item = getTooltipPayloadItem(payload);
                            if (!item) return null;

                            return (
                              <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-xs min-w-[180px]">
                                <p className="font-bold text-gray-800 mb-2">{item.tahun}</p>
                                <div className="flex items-center justify-between gap-4 mb-1">
                                  <span className="flex items-center gap-1.5 text-gray-500">
                                    <span className="inline-block w-3 h-3 rounded-sm bg-digital-blue-600" />
                                    Intake Mahasiswa
                                  </span>
                                  <span className="font-semibold text-gray-800">
                                    {formatNumber(item.intakeCount)} mhs
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-4 mt-2 pt-2 border-t border-gray-100">
                                  <span className="text-gray-500 font-medium">Pertumbuhan</span>
                                  <span
                                    className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
                                      item.isPositive
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'bg-rose-50 text-rose-700'
                                    }`}
                                  >
                                    {item.growthFormatted}
                                  </span>
                                </div>
                              </div>
                            );
                          }}
                          cursor={{ fill: 'rgba(219,234,254,0.3)' }}
                        />
                        <Legend
                          verticalAlign="top"
                          height={32}
                          formatter={() => 'Jumlah Intake Mahasiswa Baru (Semester 1)'}
                          iconType="square"
                          wrapperStyle={{ fontSize: '11px', color: '#6b7280', paddingBottom: '50px' }}
                        />
                        <Bar
                          dataKey="intakeCount"
                          name="intakeCount"
                          fill={DIGITAL_BLUE[600]}
                          radius={[4, 4, 0, 0]}
                          maxBarSize={48}
                          animationDuration={800}
                        >
                          <LabelList
                            dataKey="intakeCountFormatted"
                            position="top"
                            style={{ fill: DIGITAL_BLUE[800], fontSize: 10, fontWeight: 700 }}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )}

              {/* TAB 2: Tabel Riwayat */}
              {activeTab === 'table' && (
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
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
