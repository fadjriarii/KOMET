import { useCallback } from 'react';
import Modal from '../../../../components/common/modals/Modal';
import ModalSummaryBanner from '../../../../components/common/modals/ModalSummaryBanner';
import ModalTabNav from '../../../../components/common/modals/ModalTabNav';
import ModalTable from '../../../../components/common/modals/ModalTable';
import EmptyState from '../../../../components/common/feedback/EmptyState';
import { useTabTransition } from '../../../../hooks/useTabTransition';
import { TREND_TABS } from './studentTrendConfig';
import {
  getCurrentAcademicYear,
  formatCompactNumber,
  formatNumber,
  reverseTrendData,
  getTooltipPayloadItem,
} from '../../../../utils/uiHelpers';
import { DIGITAL_BLUE } from '../../../../utils/theme';
import { studentsService } from '../../services/studentsService';
import { useStudentDetailResource } from '../../hooks/useStudentDetailResource';
import { BarChart3, Calendar, Users, Globe, Percent } from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const FOREIGN_TABS = TREND_TABS;

const FOREIGN_TABLE_COLUMNS = [
  {
    key: 'academicYear',
    label: 'Tahun Akademik',
    icon: Calendar,
    render: (row) => (
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-digital-blue-500"></span>
        <span className="font-semibold text-gray-900">{row.academicYear}</span>
      </div>
    ),
  },
  {
    key: 'foreignCount',
    label: 'Mahasiswa Asing (Non-WNI)',
    icon: Globe,
    headerClassName: 'text-right',
    cellClassName: 'text-right',
    render: (row) => (
      <span className="bg-digital-blue-50/80 text-digital-blue-800 px-2 py-0.5 rounded-md border border-digital-blue-100 font-medium">
        {formatNumber(row.foreignCount)} mhs
      </span>
    ),
  },
  {
    key: 'totalCount',
    label: 'Total Mahasiswa Aktif',
    icon: Users,
    headerClassName: 'text-right',
    cellClassName: 'text-right font-medium text-gray-800',
    render: (row) => `${formatNumber(row.rawTotal)} mhs`,
  },
  {
    key: 'percentage',
    label: 'Persentase Mahasiswa Asing',
    icon: Percent,
    headerClassName: 'text-right',
    cellClassName: 'text-right',
    render: (row) => (
      <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-digital-blue-100/70 text-digital-blue-800 border border-digital-blue-200 shadow-2xs">
        {row.percentage}
      </span>
    ),
  },
];

export default function ForeignStudentsModal({
  isOpen,
  onClose,
  originRect,
  data,
  filters,
}) {
  const { activeTab, handleTabChange, slideClass } = useTabTransition(FOREIGN_TABS, 'chart');
  const fetchSummary = useCallback(() => studentsService.getSummary(filters), [filters]);
  const { data: filteredData } = useStudentDetailResource(isOpen, fetchSummary, 'Gagal memuat data mahasiswa asing');

  const sourceData = filteredData || data;
  const kpis = sourceData?.kpis || {};
  const currentAcademicYear = getCurrentAcademicYear();

  const trendData = sourceData?.summary?.internationalStudentsTrend?.trend || [];
  const tableData = reverseTrendData(trendData);
  const hasTrend = trendData.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rincian Mahasiswa Asing (Non-WNI)"
      subtitle="Distribusi dan tren rasio mahasiswa berkewarganegaraan asing"
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
                Persentase mahasiswa asing ({kpis.foreignRate}) dihitung berdasarkan rasio total mahasiswa berkewarganegaraan Non-WNI yang berstatus aktif ({kpis.formattedForeignCount} mahasiswa) terhadap keseluruhan total student body aktif ({kpis.formattedActiveCount} mahasiswa) pada tahun ajaran {currentAcademicYear}.
              </p>
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="font-bold text-digital-blue-900 text-[11px] uppercase tracking-wider">Rumus:</span>
                <code className="px-2.5 py-0.5 rounded-md bg-white/95 border border-digital-blue-200/90 text-digital-blue-900 font-mono font-bold text-[11px] shadow-2xs">
                  (Jumlah Mahasiswa Non-WNI Aktif / Total Student Body Aktif) × 100%
                </code>
              </div>
            </div>
          }
          label="Mahasiswa Asing"
          value={kpis.foreignRate}
          sublabel={`${kpis.formattedActiveCount} Total Mahasiswa`}
        />

        {/* TABS: Diagram Tren | Tabel Riwayat */}
        <div className="flex-1 flex flex-col min-h-0">
          <ModalTabNav
            tabs={FOREIGN_TABS}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />

          {/* Tab content area */}
          <div className="flex-1 min-h-0 overflow-x-hidden w-full">
            <div key={activeTab} className={`h-full ${slideClass}`}>
              {/* TAB 1: Diagram Tren — Recharts ComposedChart */}
              {activeTab === 'chart' && (
                <div className="h-full flex flex-col pt-0.5 px-1">
                  {!hasTrend ? (
                    <EmptyState
                      title="Tidak Ada Data Tren"
                      description="Belum ada data tren historis mahasiswa asing dari backend."
                      icon={BarChart3}
                    />
                  ) : (
                    <ResponsiveContainer width="100%" height={230}>
                      <ComposedChart
                        data={trendData}
                        margin={{ top: 8, right: 24, left: 4, bottom: 52 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                        <XAxis
                          dataKey="academicYear"
                          tick={{ fontSize: 10, fill: '#6b7280' }}
                          angle={-38}
                          textAnchor="end"
                          interval={0}
                          tickLine={false}
                          axisLine={{ stroke: '#e5e7eb' }}
                          dy={6}
                        />
                        <YAxis
                          yAxisId="left"
                          orientation="left"
                          tick={{ fontSize: 10, fill: '#9ca3af' }}
                          tickFormatter={formatCompactNumber}
                          tickLine={false}
                          axisLine={false}
                          width={44}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tick={{ fontSize: 10, fill: DIGITAL_BLUE[600] }}
                          tickFormatter={(v) => `${v}%`}
                          tickLine={false}
                          axisLine={false}
                          width={40}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const current = getTooltipPayloadItem(payload);
                            if (!current) return null;

                            return (
                              <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-xs min-w-[190px]">
                                <p className="font-bold text-gray-800 mb-2">{current.academicYear}</p>
                                
                                <div className="flex items-center justify-between gap-4 mb-1">
                                  <span className="flex items-center gap-1.5 text-gray-500">
                                    <span className="inline-block w-3 h-3 rounded-sm bg-digital-blue-300 opacity-75" />
                                    Total Mahasiswa
                                  </span>
                                  <span className="font-semibold text-gray-800">
                                    {formatNumber(current.rawTotal)} mhs
                                  </span>
                                </div>

                                <div className="flex items-center justify-between gap-4 mb-1">
                                  <span className="flex items-center gap-1.5 text-digital-blue-700">
                                    <span className="inline-block w-3 h-1.5 rounded-full bg-digital-blue-700" />
                                    Mahasiswa Asing
                                  </span>
                                  <span className="font-semibold text-digital-blue-800">
                                    {formatNumber(current.foreignCount)} mhs
                                  </span>
                                </div>

                                <div className="flex items-center justify-between gap-4 mt-2 pt-2 border-t border-gray-100">
                                  <span className="text-gray-500 font-medium">Persentase (Rasio)</span>
                                  <span className="font-bold text-digital-blue-700 bg-digital-blue-50 px-2 py-0.5 rounded">
                                    {current.percentage}
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
                          formatter={(value) =>
                            value === 'rawTotal' ? 'Total Mahasiswa (Orang)' : 'Rasio Mhs Asing (%)'
                          }
                          iconType="square"
                          wrapperStyle={{ fontSize: '11px', color: '#6b7280', paddingBottom: '50px' }}
                        />
                        <Bar
                          yAxisId="left"
                          dataKey="rawTotal"
                          name="rawTotal"
                          fill={DIGITAL_BLUE[300]}
                          opacity={0.75}
                          radius={[4, 4, 0, 0]}
                          maxBarSize={38}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="rawRate"
                          name="rawRate"
                          stroke={DIGITAL_BLUE[600]}
                          strokeWidth={2.4}
                          dot={{ r: 4, fill: 'white', stroke: DIGITAL_BLUE[600], strokeWidth: 2 }}
                          activeDot={{ r: 6, fill: DIGITAL_BLUE[600], stroke: 'white', strokeWidth: 2 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )}

              {/* TAB 2: Tabel Riwayat */}
              {activeTab === 'table' && (
                <div className="h-full flex flex-col pt-0.5 pb-1">
                  <ModalTable
                    columns={FOREIGN_TABLE_COLUMNS}
                    data={tableData}
                    emptyTitle="Tidak Ada Data Riwayat"
                    emptyDescription="Belum ada data riwayat mahasiswa asing dari backend."
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
