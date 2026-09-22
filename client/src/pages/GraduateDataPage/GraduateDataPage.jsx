// Halaman Data Lulusan — fetch KPI dari API, filter lokal via hook
import React, { useEffect, useMemo, useState } from 'react';
import { GraduateTable } from '@/components/graduate/GraduateTable';
import { GraduateDetailModal } from '@/components/graduate/GraduateDetailModal';
import { exportToCsv } from '@/lib/exportUtils';
import { apiClient } from '@/services/apiClient';
import PageHeader from '@/components/common/PageHeader';
import MetricCard from '@/components/common/MetricCard';
import { useGraduateFilters } from './hooks/useGraduateFilters';
import { GraduateHeader } from './components/GraduateHeader';
import { GraduateFilterBar } from './components/GraduateFilterBar';
import { GraduateFilterChips } from './components/GraduateFilterChips';

export const GraduateDataPage = () => {
  // State modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalOriginRect, setModalOriginRect] = useState(null);
  const [activeModalType, setActiveModalType] = useState('gpa-overview');

  // Data dari API
  const [allGraduates, setAllGraduates] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [gpaAnalytics, setGpaAnalytics] = useState(null);
  const [onTimeS1, setOnTimeS1] = useState(null);
  const [onTimeS2, setOnTimeS2] = useState(null);
  const [successS1, setSuccessS1] = useState(null);
  const [successS2, setSuccessS2] = useState(null);
  const [distribution, setDistribution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      apiClient.getGraduateTable({ limit: 9999 }),
      apiClient.getGraduateKpis(),
      apiClient.getGpaAnalytics(),
      apiClient.getOnTimeGraduation('S1', 6),
      apiClient.getOnTimeGraduation('S2', 6),
      apiClient.getStudySuccess('S1', 6),
      apiClient.getStudySuccess('S2', 6),
      apiClient.getGraduateDistribution(),
    ])
      .then(([tableResp, kpiData, gpa, ots1, ots2, ss1, ss2, dist]) => {
        // tableResp structure: { data: [...], meta: {...} }
        setAllGraduates(Array.isArray(tableResp?.data) ? tableResp.data : (Array.isArray(tableResp) ? tableResp : []));
        setKpis(kpiData);
        setGpaAnalytics(gpa);
        setOnTimeS1(ots1);
        setOnTimeS2(ots2);
        setSuccessS1(ss1);
        setSuccessS2(ss2);
        setDistribution(dist);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Hook filter lokal — hanya menangani state filter dan filteredGraduates
  const {
    searchTerm, setSearchTerm,
    selectedFaculties, selectedProdis,
    selectedYears, selectedPeriode, setSelectedPeriode,
    selectedSemester, setSelectedSemester,
    selectedJenjang, setSelectedJenjang,
    selectedPredikat, setSelectedPredikat,
    timeHorizon, setTimeHorizon,
    selectedCustomAngkatan,
    availableYears, availableAngkatans,
    facultyOptions, prodiOptions,
    filteredGraduates, isFiltered, totalGraduates,
    handleToggleFaculty, handleSelectAllFaculties, handleClearFaculties,
    handleToggleProdi, handleSelectAllProdis, handleClearProdis,
    handleToggleYear, handleSelectAllYears, handleClearYears,
    handleToggleCustomAngkatan, handleSelectAllCustomAngkatan, handleClearCustomAngkatan,
    handleResetFilters,
  } = useGraduateFilters(allGraduates);

  // Objek analitik untuk modal — semua data dari API, bukan komputasi frontend
  const modalAnalytics = useMemo(() => ({
    totalCount: kpis?.totalGraduates ?? 0,
    yearTrendData: distribution?.byYear ?? [],
    predikatData: distribution?.byPredikat ?? [],
    prodiGpaData: gpaAnalytics?.byProdi ?? [],
    facultyGpaData: gpaAnalytics?.byFaculty ?? [],
    gpaBandsData: gpaAnalytics?.bands ?? [],
    s1Gpa: { average: kpis?.averageGpaS1 ?? '0.00' },
    s2Gpa: { average: kpis?.averageGpaS2 ?? '0.00' },
    onTimeRateS1: onTimeS1?.aggregate ?? { rate: '0.0%' },
    onTimeRateS2: onTimeS2?.aggregate ?? { rate: '0.0%' },
    studySuccessRateS1: successS1?.aggregate ?? { rate: '0.0%' },
    studySuccessRateS2: successS2?.aggregate ?? { rate: '0.0%' },
    onTimeCohortData: onTimeS1?.byCohort ?? [],
    onTimeCohortDataS2: onTimeS2?.byCohort ?? [],
    successCohortData: successS1?.byCohort ?? [],
    successCohortDataS2: successS2?.byCohort ?? [],
  }), [kpis, gpaAnalytics, onTimeS1, onTimeS2, successS1, successS2, distribution]);

  const handleOpenDetail = (type, rect) => {
    if (isFiltered) return;
    setActiveModalType(type);
    setModalOriginRect(rect);
    setIsModalOpen(true);
  };

  const handleExport = () => {
    const headers = ['No','NIM','Nama','Angkatan','Program Studi','Fakultas','Jenjang','Status','Tahun Lulus','IPK','SKS','Predikat'];
    const rows = filteredGraduates.map((g, i) => [
      i + 1, g.nim, g.nama, g.angkatan, g.program_studi,
      g.fakultas, g.jenjang || 'S1', g.status_keaktifan || 'Lulus',
      g.tahun_lulus, g.ipk != null ? Number(g.ipk).toFixed(2) : '',
      g.sks_lulus, g.predikat_lulus,
    ]);
    exportToCsv(`komet_graduate_data_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-on-surface-variant">Memuat data lulusan…</div>;
  if (error) return <div className="flex items-center justify-center h-64 text-red-600">Gagal memuat: {error}</div>;

  const onTimeRateS1Display = isFiltered
    ? `${((filteredGraduates.filter(g => g.jenjang !== 'S2' && g.tahun_lulus - Number(g.angkatan) === 4).length / (filteredGraduates.filter(g => g.jenjang !== 'S2').length || 1)) * 100).toFixed(1)}%`
    : (kpis?.onTimeGraduationRateS1 ?? '0.0%');
  const onTimeRateS2Display = kpis?.onTimeGraduationRateS2 ?? '0.0%';
  const successRateS1Display = isFiltered
    ? `${((filteredGraduates.filter(g => g.jenjang !== 'S2' && (g.tahun_lulus - Number(g.angkatan)) <= 7).length / (filteredGraduates.filter(g => g.jenjang !== 'S2').length || 1)) * 100).toFixed(1)}%`
    : (kpis?.studySuccessRateS1 ?? '0.0%');

  return (
    <div className="flex flex-col w-full gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <GraduateHeader onExport={handleExport} />

      {/* Kartu metrik ringkasan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Lulusan (PDDIKTI)"
          value={(isFiltered ? totalGraduates : (kpis?.totalGraduates ?? 0)).toLocaleString('en-US')}
          description={isFiltered ? `${totalGraduates.toLocaleString('en-US')} lulusan terfilter dari total ${kpis?.totalGraduates ?? 0}.` : 'Akumulasi seluruh lulusan terdaftar pada PDDIKTI.'}
          iconName="school"
          iconBgClass="bg-primary-fixed/50 text-primary"
          trendBadge="+5.8% YoY"
          trendPositive={true}
          footerLinkText="Lihat Rincian"
          isFiltered={isFiltered}
          onClick={(rect) => handleOpenDetail('total-graduates', rect)}
        />
        <MetricCard
          label="Rata-rata IPK Lulusan"
          value={kpis?.averageGpaS1 ?? '0.00'}
          description={`Sarjana S1 (${kpis?.averageGpaS1 ?? '0.00'}) · Magister S2 (${kpis?.averageGpaS2 ?? '0.00'}).`}
          iconName="grade"
          iconBgClass="bg-amber-100 text-amber-900"
          trendBadge={`S1: ${kpis?.averageGpaS1 ?? '—'} · S2: ${kpis?.averageGpaS2 ?? '—'}`}
          trendPositive={null}
          trendIcon="school"
          footerLinkText="Lihat IPK Prodi"
          isFiltered={isFiltered}
          onClick={(rect) => handleOpenDetail('gpa-overview', rect)}
        />
        <MetricCard
          label="Lulus Tepat Waktu"
          isFiltered={isFiltered}
          iconName="timer"
          iconBgClass="bg-amber-100 text-amber-900"
          footerLinkText="Lihat 6 Angkatan"
          trendBadge={onTimeS1?.aggregate?.badge ?? '—'}
          trendPositive={null}
          trendIcon="how_to_reg"
          onClick={(rect) => handleOpenDetail('on-time-graduation', rect)}
        >
          {/* Slot kustom untuk dual S1+S2 */}
          <div className="font-metric-display text-metric-display text-on-surface font-extrabold leading-none flex items-baseline gap-2 flex-wrap">
            <span>{onTimeRateS1Display}</span>
            <span className="text-[11px] font-bold text-primary bg-primary-fixed/60 px-1.5 py-0.5 rounded">S1</span>
            <span className="text-sm font-bold text-purple-700 leading-none">{onTimeRateS2Display}</span>
            <span className="text-[11px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">S2</span>
          </div>
          <p className="text-[11px] text-on-surface-variant mt-1.5 line-clamp-2 leading-tight">
            Evaluasi 5 Thn · S1 (4 thn): {onTimeS1?.aggregate?.onTimeCount ?? 0} / {onTimeS1?.aggregate?.totalIntake ?? 0} · S2 (2 thn): {onTimeS2?.aggregate?.onTimeCount ?? 0}
          </p>
        </MetricCard>
        <MetricCard
          label="Keberhasilan Studi"
          isFiltered={isFiltered}
          iconName="verified_user"
          iconBgClass="bg-amber-100 text-amber-900"
          footerLinkText="Lihat 6 Angkatan"
          trendBadge={successS1?.aggregate?.badge ?? '—'}
          trendPositive={null}
          trendIcon="how_to_reg"
          onClick={(rect) => handleOpenDetail('study-success', rect)}
        >
          <div className="font-metric-display text-metric-display text-on-surface font-extrabold leading-none flex items-baseline gap-2 flex-wrap">
            <span>{successRateS1Display}</span>
            <span className="text-[11px] font-bold text-primary bg-primary-fixed/60 px-1.5 py-0.5 rounded">S1</span>
            <span className="text-sm font-bold text-purple-700 leading-none">{kpis?.studySuccessRateS2 ?? '0.0%'}</span>
            <span className="text-[11px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">S2</span>
          </div>
          <p className="text-[11px] text-on-surface-variant mt-1.5 line-clamp-2 leading-tight">
            S1 ≤ 7 thn: {successS1?.aggregate?.successCount ?? 0} / {successS1?.aggregate?.totalIntake ?? 0} · S2 ≤ 4 thn: {successS2?.aggregate?.successCount ?? 0}
          </p>
        </MetricCard>
      </div>

      {/* Filter */}
      <div className="space-y-1">
        <GraduateFilterBar
          searchTerm={searchTerm} setSearchTerm={setSearchTerm}
          timeHorizon={timeHorizon} setTimeHorizon={setTimeHorizon}
          selectedCustomAngkatan={selectedCustomAngkatan} availableAngkatans={availableAngkatans}
          handleSelectAllCustomAngkatan={handleSelectAllCustomAngkatan}
          handleClearCustomAngkatan={handleClearCustomAngkatan}
          handleToggleCustomAngkatan={handleToggleCustomAngkatan}
          selectedFaculties={selectedFaculties} facultyOptions={facultyOptions}
          handleToggleFaculty={handleToggleFaculty}
          handleSelectAllFaculties={handleSelectAllFaculties}
          handleClearFaculties={handleClearFaculties}
          selectedProdis={selectedProdis} prodiOptions={prodiOptions}
          handleToggleProdi={handleToggleProdi}
          handleSelectAllProdis={handleSelectAllProdis}
          handleClearProdis={handleClearProdis}
          selectedYears={selectedYears} availableYears={availableYears}
          handleToggleYear={handleToggleYear}
          handleSelectAllYears={handleSelectAllYears}
          handleClearYears={handleClearYears}
          selectedPeriode={selectedPeriode} setSelectedPeriode={setSelectedPeriode}
          selectedSemester={selectedSemester} setSelectedSemester={setSelectedSemester}
          selectedJenjang={selectedJenjang} setSelectedJenjang={setSelectedJenjang}
          selectedPredikat={selectedPredikat} setSelectedPredikat={setSelectedPredikat}
        />
        <GraduateFilterChips
          selectedFaculties={selectedFaculties}
          selectedProdis={selectedProdis}
          selectedYears={selectedYears}
          selectedPeriode={selectedPeriode}
          selectedSemester={selectedSemester}
          selectedJenjang={selectedJenjang}
          selectedPredikat={selectedPredikat}
          timeHorizon={timeHorizon}
          availableAngkatans={availableAngkatans}
          selectedCustomAngkatan={selectedCustomAngkatan}
          onResetFilters={handleResetFilters}
          handleToggleFaculty={handleToggleFaculty}
          handleToggleProdi={handleToggleProdi}
          handleToggleYear={handleToggleYear}
          setSelectedPeriode={setSelectedPeriode}
          setSelectedSemester={setSelectedSemester}
          setSelectedJenjang={setSelectedJenjang}
          setSelectedPredikat={setSelectedPredikat}
        />
      </div>

      {/* Tabel */}
      <GraduateTable data={filteredGraduates} />

      {/* Modal detail */}
      {isModalOpen && (
        <GraduateDetailModal
          metricType={activeModalType}
          originRect={modalOriginRect}
          analytics={modalAnalytics}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default GraduateDataPage;
