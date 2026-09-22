// Halaman Data MBKM — fetch KPI dari API, filter lokal via hook
import React, { useEffect, useMemo, useState } from 'react';
import { MbkmTable } from '@/components/mbkm/MbkmTable';
import { MbkmDetailModal } from '@/components/mbkm/MbkmDetailModal';
import { exportToCsv } from '@/lib/exportUtils';
import { apiClient } from '@/services/apiClient';
import PageHeader from '@/components/common/PageHeader';
import MetricCard from '@/components/common/MetricCard';
import FilterChips from '@/components/common/FilterChips';
import { useMbkmFilters } from './hooks/useMbkmFilters';
import { MbkmHeader } from './components/MbkmHeader';
import { MbkmFilterBar } from './components/MbkmFilterBar';
import { MbkmFilterChips } from './components/MbkmFilterChips';

export const MbkmDataPage = () => {
  // State modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalOriginRect, setModalOriginRect] = useState(null);
  const [activeModalType, setActiveModalType] = useState('rate-mbkm');

  // Data dari API
  const [allMbkm, setAllMbkm] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [distribution, setDistribution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      apiClient.getMbkmTable({ limit: 9999 }),
      apiClient.getMbkmKpis(),
      apiClient.getMbkmDistribution(),
    ])
      .then(([tableResp, kpiData, dist]) => {
        // tableResp structure: { data: [...], meta: {...} }
        setAllMbkm(Array.isArray(tableResp?.data) ? tableResp.data : (Array.isArray(tableResp) ? tableResp : []));
        setKpis(kpiData);
        setDistribution(dist);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Hook filter lokal — hanya state filter dan filteredMbkm
  const {
    searchTerm, setSearchTerm,
    selectedFaculties, selectedProdis,
    selectedStatus, setSelectedStatus,
    selectedAngkatan, selectedJenjang, setSelectedJenjang,
    timeHorizon, setTimeHorizon,
    selectedCustomAngkatan,
    availableAngkatans, facultyOptions, prodiOptions,
    filteredMbkm, isFiltered,
    participantStats, mbkmRate, totalMitra,
    handleToggleFaculty, handleSelectAllFaculties, handleClearFaculties,
    handleToggleProdi, handleSelectAllProdis, handleClearProdis,
    handleToggleAngkatan, handleSelectAllAngkatan, handleClearAngkatan,
    handleToggleCustomAngkatan, handleSelectAllCustomAngkatan, handleClearCustomAngkatan,
    handleResetFilters,
  } = useMbkmFilters(allMbkm);

  // Analitik untuk modal — dari API, bukan komputasi frontend
  const modalAnalytics = useMemo(() => {
    const toCountMap = (arr) => arr ?? [];
    return {
      activityData: distribution?.byActivityType ?? [],
      prodiData: distribution?.byProdi ?? [],
      facultyData: distribution?.byFaculty ?? [],
      mitraData: distribution?.byMitra ?? [],
      statusData: distribution?.byStatus ?? [],
      participantStats: {
        count: kpis?.totalParticipants ?? 0,
        selesaiCount: kpis?.selesaiCount ?? 0,
        evaluasiCount: kpis?.evaluasiCount ?? 0,
        berjalanCount: kpis?.berjalanCount ?? 0,
      },
      eligibleRate: {
        percentage: kpis?.participationRate ?? '0.0%',
        numPercentage: kpis?.participationNumRate ?? 0,
      },
    };
  }, [kpis, distribution]);

  const handleOpenDetail = (type, rect) => {
    if (isFiltered) return;
    setActiveModalType(type);
    setModalOriginRect(rect);
    setIsModalOpen(true);
  };

  const handleExport = () => {
    const headers = ['No','NIM','Nama','Angkatan','Program Studi','Fakultas','Jenjang','Status','Jenis Aktivitas','Mitra','Status Aktivitas'];
    const rows = filteredMbkm.map((m, i) => [
      i + 1, m.nim, m.nama, m.angkatan, m.program_studi,
      m.fakultas, m.jenjang || 'S1', m.status_keaktifan || 'Aktif',
      m.jenis_aktifitas, m.mitra, m.status_aktifitas,
    ]);
    exportToCsv(`komet_mbkm_data_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-on-surface-variant">Memuat data MBKM…</div>;
  if (error) return <div className="flex items-center justify-center h-64 text-red-600">Gagal memuat: {error}</div>;

  // Nilai kartu — prioritaskan API, fallback ke hook lokal
  const displayRate = isFiltered ? `${((participantStats.count / (filteredMbkm.length || 1)) * 100).toFixed(1)}%` : (kpis?.participationRate ?? mbkmRate.percentage);
  const displayParticipants = isFiltered ? participantStats.count : (kpis?.totalParticipants ?? participantStats.count);
  const displayEligible = kpis?.eligibleCount ?? 0;
  const displayMitra = isFiltered ? totalMitra : (kpis?.totalMitra ?? totalMitra);

  return (
    <div className="flex flex-col w-full gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <MbkmHeader onExport={handleExport} />

      {/* Kartu metrik ringkasan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="% MBKM vs Eligible"
          value={displayRate}
          description={isFiltered
            ? `${participantStats.count} kegiatan (selesai/evaluasi) dari ${filteredMbkm.length} data terfilter.`
            : `${displayParticipants} kegiatan berstatus selesai/evaluasi dari ${displayEligible} mahasiswa aktif semester 7.`}
          iconName="percent"
          iconBgClass="bg-primary-fixed/50 text-primary"
          trendBadge={kpis?.meetsIkuTarget ? 'Target IKU-2 ≥ 20% ✓' : 'Target IKU-2 ≥ 20%'}
          trendPositive={kpis?.meetsIkuTarget ?? false}
          trendIcon={kpis?.meetsIkuTarget ? 'verified' : 'info'}
          footerLinkText="Lihat Analisis"
          isFiltered={isFiltered}
          onClick={(rect) => handleOpenDetail('rate-mbkm', rect)}
        />
        <MetricCard
          label="Total MBKM Aktif"
          value={displayParticipants}
          description={`${kpis?.selesaiCount ?? participantStats.selesaiCount} selesai · ${kpis?.evaluasiCount ?? participantStats.evaluasiCount} evaluasi · ${kpis?.berjalanCount ?? participantStats.berjalanCount} sedang berjalan.`}
          iconName="handshake"
          iconBgClass="bg-amber-100 text-amber-900"
          trendBadge="+12.3% YoY"
          trendPositive={true}
          footerLinkText="Lihat Aktivitas"
          isFiltered={isFiltered}
          onClick={(rect) => handleOpenDetail('active-mbkm', rect)}
        />
        <MetricCard
          label="Mahasiswa Eligible (Sem 7)"
          value={isFiltered ? filteredMbkm.length : displayEligible}
          description="Mahasiswa aktif semester 7 yang berhak mengonversi 20 SKS via program MBKM."
          iconName="how_to_reg"
          iconBgClass="bg-amber-100 text-amber-900"
          trendBadge="Kohort Senior"
          trendPositive={null}
          trendIcon="groups"
          footerLinkText="Lihat Sebaran"
          isFiltered={isFiltered}
          onClick={(rect) => handleOpenDetail('eligible-students', rect)}
        />
        <MetricCard
          label="Mitra Kolaborasi MBKM"
          value={displayMitra}
          description="Jumlah mitra industri dan lembaga riset unik yang terlibat dalam program MBKM."
          iconName="domain"
          iconBgClass="bg-amber-100 text-amber-900"
          trendBadge="Industri & Riset"
          trendPositive={null}
          trendIcon="handshake"
          footerLinkText="Lihat Mitra"
          isFiltered={isFiltered}
          onClick={(rect) => handleOpenDetail('mitra-mbkm', rect)}
        />
      </div>

      {/* Filter */}
      <div className="space-y-1">
        <MbkmFilterBar
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
          selectedAngkatan={selectedAngkatan}
          handleToggleAngkatan={handleToggleAngkatan}
          handleSelectAllAngkatan={handleSelectAllAngkatan}
          handleClearAngkatan={handleClearAngkatan}
          selectedStatus={selectedStatus} setSelectedStatus={setSelectedStatus}
          selectedJenjang={selectedJenjang} setSelectedJenjang={setSelectedJenjang}
        />
        <MbkmFilterChips
          isFiltered={isFiltered}
          timeHorizon={timeHorizon} setTimeHorizon={setTimeHorizon}
          selectedCustomAngkatan={selectedCustomAngkatan}
          selectedFaculties={selectedFaculties} handleToggleFaculty={handleToggleFaculty}
          selectedProdis={selectedProdis} handleToggleProdi={handleToggleProdi}
          selectedStatus={selectedStatus} setSelectedStatus={setSelectedStatus}
          selectedAngkatan={selectedAngkatan} handleToggleAngkatan={handleToggleAngkatan}
          selectedJenjang={selectedJenjang} setSelectedJenjang={setSelectedJenjang}
          onResetFilters={handleResetFilters}
        />
      </div>

      {/* Tabel */}
      <MbkmTable data={filteredMbkm} />

      {/* Modal detail */}
      {isModalOpen && (
        <MbkmDetailModal
          metricType={activeModalType}
          originRect={modalOriginRect}
          analytics={modalAnalytics}
          eligibleCount={displayEligible}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default MbkmDataPage;
