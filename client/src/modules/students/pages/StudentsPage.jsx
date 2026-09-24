import { useEffect, useMemo, useState } from 'react';
import { Users, Globe, UserPlus, TrendingDown, TrendingUp, AlertCircle } from 'lucide-react';
import StatCard from '../../../components/common/cards/StatCard';
import { useStudentsData } from '../hooks/useStudentsData';
import { useStudentList } from '../hooks/useStudentList';
import { useStudentFilters } from '../hooks/useStudentFilters';
import { useStudentModalOrigin } from '../hooks/useStudentModalOrigin';
import { studentsService } from '../services/studentsService';
import {
  extractStudentKpis,
  getStudentKpiSubtitles,
  formatKpiDisplay,
  extractStudentFilterOptions,
  transformStudentListRows,
} from '../../../utils/logic';
import StudentDetailModal from '../components/StudentDetailModal';
import StudentDataTable from '../components/StudentDataTable';
import { StudentFilterContainer } from '../components/filters';

const TABLE_LIMIT = 10;

export default function StudentsPage() {
  const { data, isLoading, error } = useStudentsData();
  const {
    activeModalType,
    currentModalType,
    originRect,
    openModal,
    closeModal,
  } = useStudentModalOrigin();

  // Status apakah data siap ditampilkan dari backend asli
  const isDataReady = Boolean(data && data.success);
  const showSkeleton = isLoading || !isDataReady;

  // Ekstraksi & normalisasi nilai KPI via helper terpusat
  const kpis = extractStudentKpis(data);
  // Ekstraksi opsi filter dari response backend
  const {
    fakultasOptions,
    prodiOptions,
    jenjangOptions,
    angkatanOptions,
    rollingYears,
    semesterOptions,
    kewarganegaraanOptions,
    statusKeaktifanOptions,
    periodeMasukOptions,
  } = extractStudentFilterOptions(data);

  const {
    values: filters,
    setters: filterSetters,
    studentListQuery,
    activeFilterCount,
    resetFilters,
  } = useStudentFilters(angkatanOptions, TABLE_LIMIT);

  const {
    rows: studentRows,
    pagination: studentPagination,
    page: studentPage,
    setPage: setStudentPage,
    isLoading: isStudentListLoading,
  } = useStudentList(studentListQuery, { limit: TABLE_LIMIT });
  const hasCustomFilters = activeFilterCount > 0;
  const kpiActionLabel = hasCustomFilters ? 'Filtered' : 'Lihat Rincian';
  const [filteredKpis, setFilteredKpis] = useState(null);

  const filteredSummaryQuery = useMemo(() => {
    const params = new URLSearchParams(studentListQuery.toString());
    params.delete('page');
    params.delete('limit');
    return params;
  }, [studentListQuery]);

  useEffect(() => {
    let isMounted = true;

    if (!hasCustomFilters) {
      return undefined;
    }

    async function fetchFilteredKpis() {
      try {
        setFilteredKpis(null);
        const response = await studentsService.getSummary(filteredSummaryQuery);
        if (!isMounted) return;
        setFilteredKpis(extractStudentKpis(response));
      } catch {
        if (isMounted) setFilteredKpis(null);
      }
    }

    fetchFilteredKpis();

    return () => {
      isMounted = false;
    };
  }, [filteredSummaryQuery, hasCustomFilters]);

  const displayKpis = hasCustomFilters && filteredKpis ? filteredKpis : kpis;
  const displaySubtitles = getStudentKpiSubtitles(displayKpis);

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 tracking-tight">Student Data</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            Analitik demografi, persentase mahasiswa asing, intake mahasiswa baru, dan tren fluktuasi 5 tahun.
          </p>
        </div>

        {/* Notifikasi jika backend belum terhubung */}
        {error && !isDataReady && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-medium">
            <AlertCircle size={14} className="text-amber-600 flex-shrink-0" />
            <span>Backend belum terhubung ({error})</span>
          </div>
        )}
      </div>

      {/* KPI Cards Grid - 4 Card Utama */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Mahasiswa Aktif */}
        <StatCard 
          title="Mahasiswa Aktif" 
          value={formatKpiDisplay(displayKpis.formattedActiveCount)} 
          subtitle={displaySubtitles.activeSubtitle}
          icon={Users}
          badge="Status Aktif"
          actionLabel={kpiActionLabel}
          onViewDetails={(e) => openModal('active', e)}
          actionDisabled={hasCustomFilters}
          isLoading={showSkeleton}
        />

        {/* 2. Persentase Mahasiswa Internasional */}
        <StatCard 
          title="Persentase Mahasiswa Internasional" 
          value={formatKpiDisplay(displayKpis.foreignRate)} 
          subtitle={displaySubtitles.foreignSubtitle}
          icon={Globe}
          badge="Non-WNI Aktif"
          actionLabel={kpiActionLabel}
          onViewDetails={(e) => openModal('foreign', e)}
          actionDisabled={hasCustomFilters}
          isLoading={showSkeleton}
        />

        {/* 3. Intake Mahasiswa Baru */}
        <StatCard 
          title="Intake Mahasiswa Baru" 
          value={formatKpiDisplay(displayKpis.formattedIntakeCount)} 
          subtitle={displaySubtitles.intakeSubtitle}
          icon={UserPlus}
          badge="Mhs Semester 1"
          actionLabel={kpiActionLabel}
          onViewDetails={(e) => openModal('intake', e)}
          actionDisabled={hasCustomFilters}
          isLoading={showSkeleton}
        />

        {/* 4. Penurunan Jumlah Mahasiswa Baru (5 Tahun) */}
        <StatCard 
          title="Penurunan Mhs Baru (5 Thn)" 
          value={displayKpis.declineAvg} 
          subtitle={displaySubtitles.declineSubtitle}
          icon={displayKpis.isFluctuationPositive ? TrendingUp : TrendingDown}
          badge="5-Year Avg"
          actionLabel={kpiActionLabel}
          onViewDetails={(e) => openModal('decline', e)}
          actionDisabled={hasCustomFilters}
          isLoading={showSkeleton}
        />
      </div>

      {/* Fitur Filter Container Lengkap (2 Baris Filter Selebar 4 Card di Atasnya) */}
      <StudentFilterContainer
        // Baris 1: 40% (Search) - 20% (Fakultas) - 20% (Prodi) - 20% (Jenjang)
        searchValue={filters.searchQuery}
        onSearchChange={filterSetters.setSearchQuery}
        onSearchClear={() => filterSetters.setSearchQuery('')}
        facultyValue={filters.selectedFaculty}
        onFacultyChange={filterSetters.setSelectedFaculty}
        facultyOptions={fakultasOptions}
        prodiValue={filters.selectedProdi}
        onProdiChange={filterSetters.setSelectedProdi}
        prodiOptions={prodiOptions}
        jenjangValue={filters.selectedJenjang}
        onJenjangChange={filterSetters.setSelectedJenjang}
        jenjangOptions={jenjangOptions}

        // Baris 2: Angkatan + Semester + Kewarganegaraan + Status Keaktifan + Periode Masuk
        selectedYears={filters.selectedYears}
        onAngkatanChange={filterSetters.setSelectedYears}
        rollingYears={rollingYears}
        semesterValue={filters.selectedSemester}
        onSemesterChange={filterSetters.setSelectedSemester}
        semesterOptions={semesterOptions}
        nationalityValue={filters.selectedNationality}
        onNationalityChange={filterSetters.setSelectedNationality}
        nationalityOptions={kewarganegaraanOptions}
        statusValue={filters.selectedStatus}
        onStatusChange={filterSetters.setSelectedStatus}
        statusOptions={statusKeaktifanOptions}
        periodeValue={filters.selectedPeriode}
        onPeriodeChange={filterSetters.setSelectedPeriode}
        periodeOptions={periodeMasukOptions}
        activeCount={activeFilterCount}
        onResetAll={resetFilters}

        isLoading={showSkeleton}
      />

      {/* Tabel Daftar Mahasiswa (Data Real dari Endpoint /api/students/students) */}
      <StudentDataTable
        rows={transformStudentListRows(studentRows)}
        page={studentPage}
        limit={TABLE_LIMIT}
        pagination={studentPagination}
        onPageChange={setStudentPage}
        isLoading={isStudentListLoading}
      />

      {/* Styled Detail Modal */}
      <StudentDetailModal
        isOpen={Boolean(activeModalType)}
        onClose={closeModal}
        activeModalType={currentModalType}
        originRect={originRect}
        data={data}
      />
    </div>
  );
}
