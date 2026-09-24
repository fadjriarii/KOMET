import { useState, useEffect } from 'react';
import Modal from '../../../../components/common/modals/Modal';
import ModalSummaryBanner from '../../../../components/common/modals/ModalSummaryBanner';
import ModalTabNav from '../../../../components/common/modals/ModalTabNav';
import ModalTable from '../../../../components/common/modals/ModalTable';
import EmptyState from '../../../../components/common/feedback/EmptyState';
import Skeleton from '../../../../components/common/feedback/Skeleton';
import { useTabTransition } from '../../../../hooks/useTabTransition';
import {
  extractStudentKpis,
  transformDeclineHistory,
  reverseTrendData,
} from '../../../../utils/logic';
import { DIGITAL_BLUE } from '../../../../utils/theme';
import { studentsService } from '../../services/studentsService';
import {
  BarChart3,
  Table,
  Calendar,
  Users,
  Percent,
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

const DECLINE_TABS = [
  { key: 'chart', label: 'Diagram Tren', icon: BarChart3 },
  { key: 'table', label: 'Tabel Riwayat', icon: Table },
];

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
        {row.intakeCountFormatted}
      </span>
    ),
  },
];

export default function DeclineStudentsModal({
  isOpen,
  onClose,
  originRect,
  data,
}) {
  const { activeTab, handleTabChange, slideClass } = useTabTransition(DECLINE_TABS, 'chart');
  const [declineData, setDeclineData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const kpis = extractStudentKpis(data);

  // Fetch data decline trend dari backend saat modal dibuka
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function fetchDeclineDetail() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await studentsService.getDeclineTrend();
        if (isMounted && res?.success) {
          setDeclineData(res);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Gagal memuat data penurunan mahasiswa');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchDeclineDetail();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Gunakan data dari endpoint khusus atau fallback ke summary
  const rawHistoryList =
    declineData?.data?.history ||
    declineData?.declineTrend?.history ||
    declineData?.chartData ||
    data?.summary?.newStudentDecline?.history ||
    [];

  const historyList = transformDeclineHistory(rawHistoryList);
  const chartList = reverseTrendData(historyList);
  const hasData = historyList.length > 0;

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
                Penurunan jumlah mahasiswa baru dihitung selama periode 5 tahun bergulir (periode aktif {kpis.declinePeriod || '-'}). Rata-rata fluktuasi saat ini tercatat sebesar <strong className="text-digital-blue-900 font-bold">{kpis.declineAvg}</strong>.
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
          value={kpis.declineAvg}
          sublabel={kpis.isFluctuationPositive ? 'Fluktuasi Positif' : '5-Year Average'}
        />

        {/* TABS: Diagram Tren | Tabel Riwayat */}
        <div className="flex-1 flex flex-col min-h-0">
          <ModalTabNav
            tabs={DECLINE_TABS}
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
                      title="Tidak Ada Data Penurunan"
                      description={error || 'Belum ada data fluktuasi mahasiswa baru dari backend.'}
                      icon={BarChart3}
                    />
                  ) : (
                    <ResponsiveContainer width="100%" height={230}>
                      <BarChart
                        data={chartList}
                        margin={{ top: 8, right: 24, left: 4, bottom: 44 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                        <XAxis
                          dataKey="academicYear"
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
                          tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : v)}
                          tickLine={false}
                          axisLine={false}
                          width={44}
                        />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null;
                            const item = payload[0]?.payload;
                            if (!item) return null;

                            return (
                              <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-xs min-w-[180px]">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="font-bold text-gray-800">{label}</p>
                                  {item.label && (
                                    <span className="w-5 h-5 rounded-full bg-digital-blue-50 text-digital-blue-700 font-bold inline-flex items-center justify-center text-[10px] border border-digital-blue-200">
                                      {item.label}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center justify-between gap-4 mb-1">
                                  <span className="flex items-center gap-1.5 text-gray-500">
                                    <span className="inline-block w-3 h-3 rounded-sm bg-digital-blue-600" />
                                    Jumlah Intake
                                  </span>
                                  <span className="font-semibold text-gray-800">
                                    {item.intakeCount?.toLocaleString('id-ID')} mhs
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
                          formatter={() => 'Jumlah Intake Mahasiswa Baru (5 Periode)'}
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
                    columns={DECLINE_TABLE_COLUMNS}
                    data={historyList}
                    isLoading={isLoading}
                    error={error}
                    emptyTitle="Tidak Ada Riwayat Fluktuasi"
                    emptyDescription="Belum ada data riwayat penurunan mahasiswa dari backend."
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
