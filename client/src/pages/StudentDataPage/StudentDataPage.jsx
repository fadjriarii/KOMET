// Halaman Data Mahasiswa — fetch KPI dari API, filter lokal via hook
import React, { useEffect, useMemo, useState } from 'react';
import { StudentTable } from '@/components/student/StudentTable';
import { DetailModal } from '@/components/student/DetailModal';
import { exportToCsv } from '@/lib/exportUtils';
import { apiClient } from '@/services/apiClient';
import PageHeader from '@/components/common/PageHeader';
import MetricCard from '@/components/common/MetricCard';
import FilterBar from '@/components/common/FilterBar';
import { useStudentFilters } from './hooks/useStudentFilters';
import { StudentFilterBar } from './components/StudentFilterBar';
import { StudentFilterChips } from './components/StudentFilterChips';

export const StudentDataPage = () => {
  // State modal
  const [activeDetailType, setActiveDetailType] = useState(null);
  const [modalOriginRect, setModalOriginRect] = useState(null);

  // Data mahasiswa dari API
  const [allStudents, setAllStudents] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [foreignTrend, setForeignTrend] = useState([]);
  const [intakeTrend, setIntakeTrend] = useState([]);
  const [fluctuation, setFluctuation] = useState({ isPositive: true, chartData: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Muat semua data yang diperlukan secara paralel
    Promise.all([
      apiClient.getStudentTable({ limit: 9999 }),
      apiClient.getStudentKpis(),
      apiClient.getForeignTrend(5),
      apiClient.getIntakeTrend(5),
      apiClient.getIntakeFluctuation(5),
    ])
      .then(([tableResp, kpiData, fTrend, iTrend, iFluctuation]) => {
        // tableResp structure: { data: [...], meta: {...} }
        setAllStudents(Array.isArray(tableResp?.data) ? tableResp.data : (Array.isArray(tableResp) ? tableResp : []));
        setKpis(kpiData);
        console.log('🔍 KPI Data loaded:', kpiData); // Debug log
        setForeignTrend(Array.isArray(fTrend) ? fTrend : []);
        setIntakeTrend(Array.isArray(iTrend) ? iTrend : []);
        setFluctuation(iFluctuation || { isPositive: true, chartData: [] });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Filter lokal dari hook — tidak ada komputasi metrik berat di sini
  const {
    searchTerm, setSearchTerm,
    selectedFaculties, selectedProdis,
    statusFilter, setStatusFilter,
    nationalityFilter, setNationalityFilter,
    periodeTermFilter, setPeriodeTermFilter,
    selectedSemesters, selectedAngkatan,
    timeHorizon, setTimeHorizon,
    selectedCustomYears,
    availableYears, facultyOptions, prodiOptions,
    filteredStudents, isFiltered, dynamicMetrics,
    handleToggleFaculty, handleSelectAllFaculties, handleClearFaculties,
    handleToggleProdi, handleSelectAllProdis, handleClearProdis,
    handleToggleAngkatan, handleSelectAllAngkatan, handleClearAngkatan,
    handleToggleSemester, handleSelectAllSemesters, handleClearSemesters,
    handleToggleCustomYear, handleSelectAllCustomYears, handleClearCustomYears,
    handleResetFilters,
  } = useStudentFilters(allStudents);

  // Data analitik untuk modal
  const modalAnalytics = useMemo(() => {
    const active = filteredStudents.filter(
      (m) => String(m.status_keaktifan || '').toLowerCase().trim() === 'aktif'
    );
    const prodiMap = active.reduce((m, s) => {
      m.set(s.program_studi, (m.get(s.program_studi) || 0) + 1);
      return m;
    }, new Map());
    const facMap = active.reduce((m, s) => {
      m.set(s.fakultas, (m.get(s.fakultas) || 0) + 1);
      return m;
    }, new Map());
    const total = active.length || 1;

    return {
      activeStudents: active,
      prodiData: Array.from(prodiMap.entries())
        .map(([name, count]) => ({ name, count, percentage: `${((count / total) * 100).toFixed(1)}%` }))
        .sort((a, b) => b.count - a.count),
      facultyData: Array.from(facMap.entries())
        .map(([name, count]) => ({ name, count, percentage: `${((count / total) * 100).toFixed(1)}%` }))
        .sort((a, b) => b.count - a.count),
      jenjangData: [
        { name: 'Sarjana (S1)', count: active.filter((m) => m.jenjang !== 'S2').length },
        { name: 'Magister (S2)', count: active.filter((m) => m.jenjang === 'S2').length },
      ],
      foreignTrendData: foreignTrend,
      intakeTrendData: intakeTrend,
      fluctuationData: fluctuation,
    };
  }, [filteredStudents, foreignTrend, intakeTrend, fluctuation]);

  const handleOpenDetail = (type, rect) => {
    if (isFiltered) return;
    setActiveDetailType(type);
    setModalOriginRect(rect);
  };

  const handleExport = () => {
    const headers = ['No','NIM','Nama','Angkatan','Periode','Program Studi','Fakultas','Semester','Kewarganegaraan','Status'];
    const rows = filteredStudents.map((s, i) => [
      i + 1, s.nim, s.nama, s.angkatan, s.periode,
      s.program_studi, s.fakultas, s.semester, s.kewarganegaraan, s.status_keaktifan,
    ]);
    exportToCsv(`komet_student_data_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-on-surface-variant">Memuat data mahasiswa…</div>;
  if (error) return <div className="flex items-center justify-center h-64 text-red-600">Gagal memuat: {error}</div>;

  // KPI dari API — fallback ke 0 jika belum tersedia
  const activeCount = kpis?.activeStudentsCount ?? dynamicMetrics.activeCohort;
  const foreignPct = kpis?.foreignStudentsRate ?? dynamicMetrics.foreign?.percentage ?? '0.0%';
  const foreignCount = kpis?.foreignStudentsCount ?? dynamicMetrics.foreign?.count ?? 0;
  const foreignTotal = kpis?.intakeCohortCount ?? dynamicMetrics.foreign?.totalActive ?? 0;
  const foreignTrendBadge = kpis?.foreignStudentsTrend ?? '+0.0% dari periode lalu';
  const intakeCount = kpis?.intakeCohortCount ?? dynamicMetrics.intake?.count ?? 0;
  const fluctAvg = kpis?.intakeFluctuationAvg ?? dynamicMetrics.trend?.trendPercentage ?? '+0.0%';
  const fluctPos = kpis?.isFluctuationPositive ?? dynamicMetrics.trend?.isPositive ?? true;

  return (
    <div className="flex flex-col w-full gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <PageHeader
        title="Student Data Repository"
        description="Pelacakan longitudinal mahasiswa aktif, distribusi kewarganegaraan, intake, dan status akademik berdasarkan standar PDDikti."
        onExport={handleExport}
        exportLabel="Export (CSV / Excel)"
      />

      {/* Kartu metrik ringkasan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Mahasiswa Aktif"
          value={activeCount.toLocaleString('en-US')}
          description={isFiltered ? `${activeCount.toLocaleString('en-US')} mahasiswa aktif dari ${filteredStudents.length} record terfilter.` : 'Jumlah mahasiswa dengan status keaktifan aktif pada periode berjalan.'}
          iconName="groups"
          iconBgClass="bg-primary-fixed/50 text-primary"
          trendBadge="+4.1% dari periode lalu"
          trendPositive={true}
          footerLinkText="Lihat Rincian"
          isFiltered={isFiltered}
          onClick={(rect) => handleOpenDetail('active-students', rect)}
        />
        <MetricCard
          label="Persentase Mahasiswa Asing"
          value={foreignPct}
          description={`${foreignCount} mahasiswa Non-WNI dari total ${isFiltered ? filteredStudents.filter(m => String(m.status_keaktifan||'').toLowerCase()==='aktif').length : foreignTotal} mahasiswa aktif.`}
          iconName="public"
          iconBgClass="bg-secondary-fixed/50 text-secondary"
          trendBadge={foreignTrendBadge}
          trendPositive={!foreignTrendBadge.startsWith('-')}
          footerLinkText="Lihat Tren"
          isFiltered={isFiltered}
          onClick={(rect) => handleOpenDetail('foreign-students', rect)}
        />
        <MetricCard
          label="Intake Mahasiswa Baru"
          value={intakeCount.toLocaleString('en-US')}
          description={kpis ? `${kpis.intakeCohortLabel} — Ganjil: ${kpis.intakeGanjil}, Genap: ${kpis.intakeGenap}.` : 'Mahasiswa baru cohort terkini.'}
          iconName="person_add"
          iconBgClass="bg-tertiary-fixed/50 text-tertiary"
          trendBadge={kpis?.intakeGrowth ?? dynamicMetrics.intake?.trendBadge ?? '+0.0%'}
          trendPositive={!String(kpis?.intakeGrowth ?? '+').startsWith('-')}
          footerLinkText="Lihat Detail"
          isFiltered={isFiltered}
          onClick={(rect) => handleOpenDetail('intake-students', rect)}
        />
        <MetricCard
          label="Fluktuasi Intake (5 Thn)"
          value={fluctAvg}
          description="Rerata perubahan intake 5 cohort terakhir."
          iconName={fluctPos ? 'trending_up' : 'trending_down'}
          iconBgClass={fluctPos ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}
          trendBadge={kpis?.isFluctuationPositive ?? fluctPos ? 'Tumbuh' : 'Menurun'}
          trendPositive={fluctPos}
          footerLinkText="Lihat Grafik"
          isFiltered={isFiltered}
          onClick={(rect) => handleOpenDetail('intake-fluctuation', rect)}
        />
      </div>

      {/* Filter */}
      <div className="space-y-1">
        <StudentFilterBar
          searchTerm={searchTerm} setSearchTerm={setSearchTerm}
          timeHorizon={timeHorizon} setTimeHorizon={setTimeHorizon}
          selectedCustomYears={selectedCustomYears} availableYears={availableYears}
          handleSelectAllCustomYears={handleSelectAllCustomYears}
          handleClearCustomYears={handleClearCustomYears}
          handleToggleCustomYear={handleToggleCustomYear}
          selectedFaculties={selectedFaculties} facultyOptions={facultyOptions}
          handleToggleFaculty={handleToggleFaculty}
          handleSelectAllFaculties={handleSelectAllFaculties}
          handleClearFaculties={handleClearFaculties}
          selectedProdis={selectedProdis} prodiOptions={prodiOptions}
          handleToggleProdi={handleToggleProdi}
          handleSelectAllProdis={handleSelectAllProdis}
          handleClearProdis={handleClearProdis}
          selectedAngkatan={selectedAngkatan}
          handleToggleAngkatan={handleToggleAngkatan}
          handleSelectAllAngkatan={handleSelectAllAngkatan}
          handleClearAngkatan={handleClearAngkatan}
          selectedSemesters={selectedSemesters}
          handleToggleSemester={handleToggleSemester}
          handleSelectAllSemesters={handleSelectAllSemesters}
          handleClearSemesters={handleClearSemesters}
          nationalityFilter={nationalityFilter} setNationalityFilter={setNationalityFilter}
          statusFilter={statusFilter} setStatusFilter={setStatusFilter}
          periodeTermFilter={periodeTermFilter} setPeriodeTermFilter={setPeriodeTermFilter}
        />
        <StudentFilterChips
          selectedFaculties={selectedFaculties}
          selectedProdis={selectedProdis}
          selectedAngkatan={selectedAngkatan}
          periodeTermFilter={periodeTermFilter}
          selectedSemesters={selectedSemesters}
          statusFilter={statusFilter}
          nationalityFilter={nationalityFilter}
          timeHorizon={timeHorizon}
          selectedCustomYears={selectedCustomYears}
          onResetFilters={handleResetFilters}
          onToggleFaculty={handleToggleFaculty}
          onToggleProdi={handleToggleProdi}
          onToggleAngkatan={handleToggleAngkatan}
          onToggleSemester={handleToggleSemester}
          setStatusFilter={setStatusFilter}
          setNationalityFilter={setNationalityFilter}
          setPeriodeTermFilter={setPeriodeTermFilter}
        />
      </div>

      {/* Tabel */}
      <StudentTable data={filteredStudents} totalOriginalCount={allStudents.length} />

      {/* Modal detail */}
      <DetailModal
        isOpen={Boolean(activeDetailType)}
        metricType={activeDetailType}
        originRect={modalOriginRect}
        analytics={modalAnalytics}
        onClose={() => { setActiveDetailType(null); setModalOriginRect(null); }}
      />
    </div>
  );
};

export default StudentDataPage;
