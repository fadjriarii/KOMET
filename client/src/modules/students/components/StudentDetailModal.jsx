import { useState, useEffect } from 'react';
import Modal from '../../../components/common/modals/Modal';
import Skeleton from '../../../components/common/feedback/Skeleton';
import EmptyState from '../../../components/common/feedback/EmptyState';
import { 
  extractStudentKpis, 
  getCurrentAcademicYear, 
  getStudentActiveDescription,
  getStudentForeignDescription,
  transformForeignTrend,
  transformIntakeTrend,
  transformDeclineHistory,
  transformFacultyDistribution,
  transformProdiDistribution,
  transformJenjangDistribution,
} from '../../../utils/logic';
import { studentsService } from '../services/studentsService';
import { Users, Globe, UserPlus, TrendingDown, TrendingUp, Building2, BookOpen, Layers, BarChart3, Table } from 'lucide-react';
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

const STUDENT_TABS = [
  { key: 'fakultas', label: 'Per Fakultas' },
  { key: 'prodi', label: 'Per Program Studi' },
  { key: 'jenjang', label: 'Per Jenjang' },
];

const FOREIGN_TABS = [
  { key: 'chart', label: 'Diagram Tren', icon: BarChart3 },
  { key: 'table', label: 'Tabel Riwayat', icon: Table },
];

export default function StudentDetailModal({
  isOpen,
  onClose,
  activeModalType, // 'active' | 'foreign' | 'intake' | 'decline'
  originRect,
  data,
}) {
  const [cachedType, setCachedType] = useState(activeModalType);
  const [activeStudentTab, setActiveStudentTab] = useState('fakultas');
  const [activeForeignTab, setActiveForeignTab] = useState('chart');
  const [tabSlideDirection, setTabSlideDirection] = useState('forward'); // 'forward' | 'backward'
  const [foreignSlideDirection, setForeignSlideDirection] = useState('forward');
  const [activeDetailData, setActiveDetailData] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const handleTabChange = (newTabKey) => {
    if (newTabKey === activeStudentTab) return;
    const prevIdx = STUDENT_TABS.findIndex((t) => t.key === activeStudentTab);
    const nextIdx = STUDENT_TABS.findIndex((t) => t.key === newTabKey);
    setTabSlideDirection(nextIdx > prevIdx ? 'forward' : 'backward');
    setActiveStudentTab(newTabKey);
  };

  const handleForeignTabChange = (newTabKey) => {
    if (newTabKey === activeForeignTab) return;
    const prevIdx = FOREIGN_TABS.findIndex((t) => t.key === activeForeignTab);
    const nextIdx = FOREIGN_TABS.findIndex((t) => t.key === newTabKey);
    setForeignSlideDirection(nextIdx > prevIdx ? 'forward' : 'backward');
    setActiveForeignTab(newTabKey);
  };

  useEffect(() => {
    if (activeModalType) {
      setCachedType(activeModalType);
    }
  }, [activeModalType]);

  // Fetch data breakdown multisektor mahasiswa aktif saat modal dibuka
  useEffect(() => {
    if (!isOpen || (activeModalType !== 'active' && cachedType !== 'active')) return;

    let isMounted = true;
    async function fetchActiveDetail() {
      setIsLoadingDetail(true);
      setDetailError(null);
      try {
        const res = await studentsService.getActiveStudentsDetail();
        if (isMounted && res?.success) {
          setActiveDetailData(res);
        }
      } catch (err) {
        if (isMounted) {
          setDetailError(err.message || 'Gagal memuat rincian mahasiswa aktif');
        }
      } finally {
        if (isMounted) {
          setIsLoadingDetail(false);
        }
      }
    }

    fetchActiveDetail();

    return () => {
      isMounted = false;
    };
  }, [isOpen, activeModalType, cachedType]);

  const currentModalType = activeModalType || cachedType;
  if (!currentModalType) return null;

  const summary = data?.summary;
  const kpis = extractStudentKpis(data);
  const currentAcademicYear = getCurrentAcademicYear();

  // Data terstruktur dari logic.js
  const facultyList = transformFacultyDistribution(
    activeDetailData?.byFaculty, 
    activeDetailData?.totalActiveStudents || kpis.activeCount
  );
  const prodiList = transformProdiDistribution(
    activeDetailData?.byProdi, 
    activeDetailData?.totalActiveStudents || kpis.activeCount
  );
  const jenjangList = transformJenjangDistribution(
    activeDetailData?.byJenjang, 
    activeDetailData?.totalActiveStudents || kpis.activeCount
  );

  // Konfigurasi modal berdasarkan card yang diklik
  const modalConfigs = {
    active: {
      title: 'Rincian Mahasiswa Aktif',
      subtitle: 'Informasi total student body dengan status aktif',
      icon: Users,
    },
    foreign: {
      title: 'Rincian Mahasiswa Asing (Non-WNI)',
      subtitle: 'Distribusi dan tren rasio mahasiswa berkewarganegaraan asing',
      icon: Globe,
    },
    intake: {
      title: 'Rincian Intake Mahasiswa Baru',
      subtitle: 'Riwayat mahasiswa baru semester 1 status aktif',
      icon: UserPlus,
    },
    decline: {
      title: 'Rincian Penurunan Mahasiswa Baru (5 Tahun)',
      subtitle: 'Formula dan riwayat tren fluktuasi mahasiswa baru periode 5 tahun',
      icon: TrendingDown,
    },
  };

  const config = modalConfigs[currentModalType] || modalConfigs.active;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={config.title}
      subtitle={config.subtitle}
      maxWidth="max-w-4xl"
      originRect={originRect}
    >
      {/* 1. Modal Detail Mahasiswa Aktif */}
      {currentModalType === 'active' && (
        <div className="flex flex-col h-full space-y-4">
          {/* TOP: 80/20 split - FIXED TOP (shrink-0) */}
          <div className="flex gap-3 shrink-0">
            {/* LEFT 80%: Description */}
            <div className="w-[80%] bg-digital-blue-50/70 border border-digital-blue-100 rounded-2xl p-4 sm:p-5 flex items-center">
              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed text-justify">
                {getStudentActiveDescription(currentAcademicYear, kpis.formattedActiveCount)}
              </p>
            </div>

            {/* RIGHT 20%: KPI count (Text Only with Clean Typography) */}
            <div className="w-[20%] bg-digital-blue-50/80 border border-digital-blue-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-1 shadow-xs">
              <span className="text-digital-blue-700/90 text-[11px] font-bold uppercase tracking-wider">
                Total Aktif
              </span>
              <h4 className="text-2xl sm:text-3xl font-black text-digital-blue-900 leading-none tracking-tight my-0.5">
                {kpis.formattedActiveCount}
              </h4>
              <p className="text-xs font-semibold text-digital-blue-700">Mahasiswa</p>
            </div>
          </div>

          {/* TABS: Per Fakultas | Per Program Studi | Per Jenjang */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Tab header - FIXED (shrink-0) */}
            <div className="flex gap-1 border-b border-gray-100 mb-3 shrink-0">
              {STUDENT_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleTabChange(tab.key)}
                  className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors duration-150 cursor-pointer ${
                    activeStudentTab === tab.key
                      ? 'text-digital-blue-700 border-b-2 border-digital-blue-600 bg-digital-blue-50/60'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content wrapper (Hanya chart list di bawah tab bar yang bergeser & scroll, bebas glitch horizontal) */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar scroll-smooth pr-1">
              <div className="overflow-x-hidden w-full">
                <div 
                  key={activeStudentTab} 
                  className={`w-full ${tabSlideDirection === 'forward' ? 'animate-slide-in-left' : 'animate-slide-in-right'}`}
                >
                  {/* 1. Tab content: Per Fakultas (Horizontal Bar Chart) */}
                  {activeStudentTab === 'fakultas' && (
                    <div className="pt-1">
                      {isLoadingDetail ? (
                        <div className="space-y-3 py-3">
                          {[1, 2, 3, 4].map((n) => (
                            <div key={n} className="flex items-center gap-3">
                              <Skeleton className="h-5 w-44 sm:w-56 shrink-0" />
                              <Skeleton className="h-6 flex-1 rounded-lg" />
                              <Skeleton className="h-5 w-14 shrink-0 rounded-md" />
                            </div>
                          ))}
                        </div>
                      ) : detailError ? (
                        <EmptyState 
                          title="Gagal Memuat Data Fakultas" 
                          description={detailError}
                          icon={Building2}
                        />
                      ) : facultyList.length === 0 ? (
                        <EmptyState 
                          title="Tidak Ada Data Fakultas" 
                          description="Belum ada data distribusi mahasiswa per fakultas dari backend."
                          icon={Building2}
                        />
                      ) : (
                        <div className="space-y-2.5">
                          {facultyList.map((item, idx) => (
                            <div 
                              key={idx} 
                              className="flex items-center gap-3 py-1.5 px-2 rounded-xl hover:bg-gray-50/80 transition-colors"
                            >
                              {/* 1. Nama Fakultas di paling kiri */}
                              <div className="w-44 sm:w-56 shrink-0 flex items-center gap-2">
                                <span className="w-5 h-5 rounded-md bg-digital-blue-50 text-digital-blue-700 text-[11px] font-bold inline-flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                                <span className="text-xs sm:text-sm font-semibold text-gray-800 truncate" title={item.name}>
                                  {item.name}
                                </span>
                              </div>

                              {/* 2. Horizontal Bar dari kiri ke kanan */}
                              <div className="flex-1 bg-gray-100/90 rounded-lg h-6 overflow-hidden p-0.5 relative flex items-center">
                                <div 
                                  style={{ width: `${item.barWidth}%` }}
                                  className="h-full rounded-md bg-gradient-to-r from-digital-blue-500 to-digital-blue-600 transition-all duration-700 ease-out shadow-2xs flex items-center justify-end pr-2"
                                >
                                  {item.barWidth > 25 && (
                                    <span className="text-[11px] font-bold text-white tracking-wide leading-none select-none">
                                      {item.formattedCount} mhs
                                    </span>
                                  )}
                                </div>
                                {item.barWidth <= 25 && (
                                  <span className="ml-2 text-[11px] font-bold text-gray-700 select-none">
                                    {item.formattedCount} mhs
                                  </span>
                                )}
                              </div>

                              {/* 3. Persentase di ujung kanan */}
                              <div className="w-14 sm:w-16 shrink-0 text-right">
                                <span className="text-xs font-bold text-digital-blue-700 bg-digital-blue-50 px-2 py-0.5 rounded-md">
                                  {item.percentageFormatted}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. Tab content: Per Program Studi */}
                  {activeStudentTab === 'prodi' && (
                    <div className="pt-1">
                      {isLoadingDetail ? (
                        <div className="space-y-3 py-3">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <div key={n} className="flex items-center gap-3">
                              <Skeleton className="h-5 w-44 sm:w-56 shrink-0" />
                              <Skeleton className="h-6 flex-1 rounded-lg" />
                              <Skeleton className="h-5 w-14 shrink-0 rounded-md" />
                            </div>
                          ))}
                        </div>
                      ) : detailError ? (
                        <EmptyState 
                          title="Gagal Memuat Data Prodi" 
                          description={detailError}
                          icon={BookOpen}
                        />
                      ) : prodiList.length === 0 ? (
                        <EmptyState 
                          title="Tidak Ada Data Program Studi" 
                          description="Belum ada data distribusi mahasiswa per program studi dari backend."
                          icon={BookOpen}
                        />
                      ) : (
                        <div className="space-y-2.5">
                          {prodiList.map((item, idx) => (
                            <div 
                              key={idx} 
                              className="flex items-center gap-3 py-1.5 px-2 rounded-xl hover:bg-gray-50/80 transition-colors"
                            >
                              <div className="w-44 sm:w-56 shrink-0 flex items-center gap-2">
                                <span className="w-5 h-5 rounded-md bg-digital-blue-50 text-digital-blue-700 text-[11px] font-bold inline-flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                                <span className="text-xs sm:text-sm font-semibold text-gray-800 truncate" title={item.name}>
                                  {item.name}
                                </span>
                              </div>

                              <div className="flex-1 bg-gray-100/90 rounded-lg h-6 overflow-hidden p-0.5 relative flex items-center">
                                <div 
                                  style={{ width: `${item.barWidth}%` }}
                                  className="h-full rounded-md bg-gradient-to-r from-digital-blue-500 to-digital-blue-600 transition-all duration-700 ease-out shadow-2xs flex items-center justify-end pr-2"
                                >
                                  {item.barWidth > 25 && (
                                    <span className="text-[11px] font-bold text-white tracking-wide leading-none select-none">
                                      {item.formattedCount} mhs
                                    </span>
                                  )}
                                </div>
                                {item.barWidth <= 25 && (
                                  <span className="ml-2 text-[11px] font-bold text-gray-700 select-none">
                                    {item.formattedCount} mhs
                                  </span>
                                )}
                              </div>

                              <div className="w-14 sm:w-16 shrink-0 text-right">
                                <span className="text-xs font-bold text-digital-blue-700 bg-digital-blue-50 px-2 py-0.5 rounded-md">
                                  {item.percentageFormatted}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3. Tab content: Per Jenjang */}
                  {activeStudentTab === 'jenjang' && (
                    <div className="pt-1">
                      {isLoadingDetail ? (
                        <div className="space-y-3 py-3">
                          {[1, 2].map((n) => (
                            <div key={n} className="flex items-center gap-3">
                              <Skeleton className="h-5 w-44 sm:w-56 shrink-0" />
                              <Skeleton className="h-6 flex-1 rounded-lg" />
                              <Skeleton className="h-5 w-14 shrink-0 rounded-md" />
                            </div>
                          ))}
                        </div>
                      ) : detailError ? (
                        <EmptyState 
                          title="Gagal Memuat Data Jenjang" 
                          description={detailError}
                          icon={Layers}
                        />
                      ) : jenjangList.length === 0 ? (
                        <EmptyState 
                          title="Tidak Ada Data Jenjang" 
                          description="Belum ada data distribusi mahasiswa per jenjang dari backend."
                          icon={Layers}
                        />
                      ) : (
                        <div className="space-y-2.5">
                          {jenjangList.map((item, idx) => (
                            <div 
                              key={idx} 
                              className="flex items-center gap-3 py-1.5 px-2 rounded-xl hover:bg-gray-50/80 transition-colors"
                            >
                              <div className="w-44 sm:w-56 shrink-0 flex items-center gap-2">
                                <span className="w-5 h-5 rounded-md bg-digital-blue-50 text-digital-blue-700 text-[11px] font-bold inline-flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                                <span className="text-xs sm:text-sm font-semibold text-gray-800 truncate" title={item.name}>
                                  {item.name}
                                </span>
                              </div>

                              <div className="flex-1 bg-gray-100/90 rounded-lg h-6 overflow-hidden p-0.5 relative flex items-center">
                                <div 
                                  style={{ width: `${item.barWidth}%` }}
                                  className="h-full rounded-md bg-gradient-to-r from-digital-blue-500 to-digital-blue-600 transition-all duration-700 ease-out shadow-2xs flex items-center justify-end pr-2"
                                >
                                  {item.barWidth > 25 && (
                                    <span className="text-[11px] font-bold text-white tracking-wide leading-none select-none">
                                      {item.formattedCount} mhs
                                    </span>
                                  )}
                                </div>
                                {item.barWidth <= 25 && (
                                  <span className="ml-2 text-[11px] font-bold text-gray-700 select-none">
                                    {item.formattedCount} mhs
                                  </span>
                                )}
                              </div>

                              <div className="w-14 sm:w-16 shrink-0 text-right">
                                <span className="text-xs font-bold text-digital-blue-700 bg-digital-blue-50 px-2 py-0.5 rounded-md">
                                  {item.percentageFormatted}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal Detail Mahasiswa Asing */}
      {currentModalType === 'foreign' && (
        <div className="flex flex-col h-full space-y-4">
          {/* TOP: 80/20 split - FIXED TOP (shrink-0) */}
          <div className="flex gap-3 shrink-0">
            {/* LEFT 80%: Description & Formula */}
            <div className="w-[80%] bg-digital-blue-50/70 border border-digital-blue-100 rounded-2xl p-4 sm:p-5 flex items-center">
              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed text-justify">
                {getStudentForeignDescription(
                  currentAcademicYear, 
                  kpis.formattedForeignCount, 
                  kpis.formattedActiveCount, 
                  kpis.foreignRate
                )}
              </p>
            </div>

            {/* RIGHT 20%: Percentage & Total Students */}
            <div className="w-[20%] bg-digital-blue-50/80 border border-digital-blue-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-1 shadow-xs">
              <span className="text-digital-blue-700/90 text-[11px] font-bold uppercase tracking-wider">
                Mahasiswa Asing
              </span>
              <h4 className="text-2xl sm:text-3xl font-black text-digital-blue-900 leading-none tracking-tight my-0.5">
                {kpis.foreignRate}
              </h4>
              <p className="text-xs font-semibold text-digital-blue-700">
                {kpis.formattedActiveCount} Total Mahasiswa
              </p>
            </div>
          </div>

          {/* TABS: Diagram Tren | Tabel Riwayat */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Tab header - shrink-0 */}
            <div className="flex gap-1 border-b border-gray-100 mb-3 shrink-0">
              {FOREIGN_TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => handleForeignTabChange(tab.key)}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors duration-150 cursor-pointer ${
                      activeForeignTab === tab.key
                        ? 'text-digital-blue-700 border-b-2 border-digital-blue-600 bg-digital-blue-50/60'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={13} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab content area - overflow-x-hidden to prevent glitch */}
            <div className="flex-1 min-h-0 overflow-x-hidden w-full">
              {(() => {
                const trendData = transformForeignTrend(summary?.internationalStudentsTrend?.trend || []);
                const hasTrend = trendData.length > 0;
                const slideClass = foreignSlideDirection === 'forward' ? 'animate-slide-in-left' : 'animate-slide-in-right';

                return (
                  <div key={activeForeignTab} className={`h-full ${slideClass}`}>

                    {/* TAB 1: Diagram Tren — Recharts ComposedChart (Bar total + Line asing) */}
                    {activeForeignTab === 'chart' && (
                      <div className="h-full flex flex-col justify-center px-1">
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
                              margin={{ top: 16, right: 16, left: 4, bottom: 52 }}
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
                                yAxisId="total"
                                orientation="left"
                                tick={{ fontSize: 10, fill: '#9ca3af' }}
                                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : v}
                                tickLine={false}
                                axisLine={false}
                                width={42}
                              />
                              <YAxis
                                yAxisId="foreign"
                                orientation="right"
                                tick={{ fontSize: 10, fill: '#1d4ed8' }}
                                tickLine={false}
                                axisLine={false}
                                width={36}
                              />
                              <Tooltip
                                content={({ active, payload, label }) => {
                                  if (!active || !payload?.length) return null;
                                  const total   = payload.find(p => p.dataKey === 'rawTotal');
                                  const foreign = payload.find(p => p.dataKey === 'foreignCount');
                                  const pct     = payload[0]?.payload?.percentage;
                                  return (
                                    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-xs min-w-[170px]">
                                      <p className="font-bold text-gray-800 mb-2">{label}</p>
                                      {total && (
                                        <div className="flex items-center justify-between gap-4 mb-1">
                                          <span className="flex items-center gap-1.5 text-gray-500">
                                            <span className="inline-block w-3 h-3 rounded-sm bg-blue-300 opacity-75" />
                                            Total Mahasiswa
                                          </span>
                                          <span className="font-semibold text-gray-800">{total.value?.toLocaleString('id-ID')}</span>
                                        </div>
                                      )}
                                      {foreign && (
                                        <div className="flex items-center justify-between gap-4 mb-1">
                                          <span className="flex items-center gap-1.5 text-blue-700">
                                            <span className="inline-block w-3 h-1.5 rounded-full bg-blue-700" />
                                            Mhs Asing
                                          </span>
                                          <span className="font-semibold text-blue-800">{foreign.value?.toLocaleString('id-ID')}</span>
                                        </div>
                                      )}
                                      {pct && (
                                        <div className="flex items-center justify-between gap-4 mt-2 pt-2 border-t border-gray-100">
                                          <span className="text-gray-500">Persentase</span>
                                          <span className="font-bold text-blue-700">{pct}</span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                }}
                                cursor={{ fill: 'rgba(219,234,254,0.3)' }}
                              />
                              <Legend
                                verticalAlign="top"
                                height={28}
                                formatter={(value) => value === 'rawTotal' ? 'Total Mahasiswa' : 'Mhs Asing'}
                                iconType="square"
                                wrapperStyle={{ fontSize: '11px', color: '#6b7280', paddingBottom: '4px' }}
                              />
                              <Bar
                                yAxisId="total"
                                dataKey="rawTotal"
                                name="rawTotal"
                                fill="#93c5fd"
                                opacity={0.75}
                                radius={[3, 3, 0, 0]}
                                maxBarSize={40}
                              />
                              <Line
                                yAxisId="foreign"
                                type="monotone"
                                dataKey="foreignCount"
                                name="foreignCount"
                                stroke="#1d4ed8"
                                strokeWidth={2.2}
                                dot={{ r: 4, fill: 'white', stroke: '#1d4ed8', strokeWidth: 2 }}
                                activeDot={{ r: 6, fill: '#1d4ed8', stroke: 'white', strokeWidth: 2 }}
                              />
                            </ComposedChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    )}

                    {/* TAB 2: Tabel Riwayat — tahun terbaru di atas */}
                    {activeForeignTab === 'table' && (
                      <div className="h-full overflow-y-auto custom-scrollbar scroll-smooth">
                        {!hasTrend ? (
                          <EmptyState
                            title="Tidak Ada Data Riwayat"
                            description="Belum ada data riwayat mahasiswa asing dari backend."
                            icon={Table}
                          />
                        ) : (
                          <div className="border border-gray-100 rounded-xl overflow-hidden">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 font-semibold sticky top-0">
                                <tr>
                                  <th className="px-3.5 py-2.5">Tahun Akademik</th>
                                  <th className="px-3.5 py-2.5 text-right">Mhs Asing</th>
                                  <th className="px-3.5 py-2.5 text-right">Total Mhs</th>
                                  <th className="px-3.5 py-2.5 text-right">%</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 text-gray-700">
                                {[...trendData].reverse().map((row, idx) => (
                                  <tr key={idx} className="hover:bg-gray-50/60">
                                    <td className="px-3.5 py-2.5 font-medium text-gray-900">{row.academicYear}</td>
                                    <td className="px-3.5 py-2.5 text-right">{row.formattedForeignCount}</td>
                                    <td className="px-3.5 py-2.5 text-right">{row.totalCount}</td>
                                    <td className="px-3.5 py-2.5 text-right font-semibold text-digital-blue-700">{row.percentage}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal Detail Intake Mahasiswa Baru */}
      {currentModalType === 'intake' && (
        <div className="flex flex-col h-full space-y-4">
          <div className="bg-digital-blue-50/70 border border-digital-blue-100 rounded-2xl p-4 flex items-center justify-between shrink-0">
            <div>
              <p className="text-xs font-semibold text-digital-blue-800 uppercase tracking-wider">Intake Semester 1</p>
              <h4 className="text-2xl font-bold text-digital-blue-900 mt-0.5">
                {kpis.formattedIntakeCount} Mahasiswa
              </h4>
              <p className="text-[11px] text-digital-blue-700 mt-1">
                Periode Aktif: {kpis.intakePeriod || '-'}
              </p>
            </div>
            <div className="p-3 bg-digital-blue-600 text-white rounded-xl shadow-xs">
              <UserPlus size={24} />
            </div>
          </div>

          {summary?.intakeTrend?.trend?.length > 0 && (
            <div className="flex-1 flex flex-col min-h-0">
              <h5 className="text-xs font-bold text-gray-700 mb-2 shrink-0">Riwayat Intake per Angkatan</h5>
              <div className="flex-1 border border-gray-100 rounded-xl overflow-y-auto custom-scrollbar">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 font-semibold sticky top-0 bg-white">
                    <tr>
                      <th className="px-3.5 py-2.5">Tahun Ajaran</th>
                      <th className="px-3.5 py-2.5">Jumlah Intake</th>
                      <th className="px-3.5 py-2.5">Pertumbuhan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {transformIntakeTrend(summary.intakeTrend.trend).map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/60">
                        <td className="px-3.5 py-2 font-medium text-gray-900">{row.tahun}</td>
                        <td className="px-3.5 py-2">{row.intakeCountFormatted}</td>
                        <td className="px-3.5 py-2 font-medium">
                          <span className={row.isPositive ? 'text-emerald-600' : 'text-rose-600'}>
                            {row.growthFormatted}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Modal Detail Penurunan Mahasiswa Baru (5 Tahun) */}
      {currentModalType === 'decline' && (
        <div className="flex flex-col h-full space-y-4">
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Rata-rata Penurunan (5 Tahun)</p>
                <h4 className={`text-2xl font-bold mt-0.5 ${kpis.isFluctuationPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {kpis.declineAvg}
                </h4>
              </div>
              <div className={`p-3 rounded-xl ${kpis.isFluctuationPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {kpis.isFluctuationPositive ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
              </div>
            </div>
            
            {summary?.newStudentDecline?.formula && (
              <div className="mt-3 pt-3 border-t border-gray-200/60">
                <p className="text-[11px] text-gray-500 font-mono bg-white px-2.5 py-1.5 rounded-lg border border-gray-100">
                  Formula: {summary.newStudentDecline.formula}
                </p>
              </div>
            )}
          </div>

          {summary?.newStudentDecline?.history?.length > 0 && (
            <div className="flex-1 flex flex-col min-h-0">
              <h5 className="text-xs font-bold text-gray-700 mb-2 shrink-0">Riwayat Periode 5 Tahun</h5>
              <div className="flex-1 border border-gray-100 rounded-xl overflow-y-auto custom-scrollbar">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 font-semibold sticky top-0 bg-white">
                    <tr>
                      <th className="px-3.5 py-2.5">Simbol</th>
                      <th className="px-3.5 py-2.5">Tahun Akademik</th>
                      <th className="px-3.5 py-2.5">Jumlah Intake (Smt 1)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {transformDeclineHistory(summary.newStudentDecline.history).map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/60">
                        <td className="px-3.5 py-2">
                          <span className="w-5 h-5 rounded-full bg-digital-blue-50 text-digital-blue-700 font-bold inline-flex items-center justify-center text-[10px]">
                            {row.label}
                          </span>
                        </td>
                        <td className="px-3.5 py-2 font-medium text-gray-900">{row.academicYear}</td>
                        <td className="px-3.5 py-2">{row.intakeCountFormatted}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
