import { useState } from 'react';
import { Users, Globe, UserPlus, TrendingDown, TrendingUp, AlertCircle } from 'lucide-react';
import StatCard from '../../../components/common/cards/StatCard';
import { useStudentsData } from '../hooks/useStudentsData';
import {
  extractStudentKpis,
  getStudentKpiSubtitles,
  formatKpiDisplay,
  extractStudentFilterOptions,
} from '../../../utils/logic';
import StudentDetailModal from '../components/StudentDetailModal';
import { StudentFilterContainer } from '../components/filters';

export default function StudentsPage() {
  const { data, isLoading, error } = useStudentsData();
  const [activeModalType, setActiveModalType] = useState(null); // 'active' | 'foreign' | 'intake' | 'decline' | null
  const [originRect, setOriginRect] = useState(null);

  // Filter States - Baris 1
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedProdi, setSelectedProdi] = useState('');
  const [selectedJenjang, setSelectedJenjang] = useState('');

  // Filter States - Baris 2
  const [selectedYears, setSelectedYears] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedNationality, setSelectedNationality] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPeriode, setSelectedPeriode] = useState('');

  const handleOpenModal = (type, e) => {
    // Cari elemen card terdekat untuk mendapatkan posisi & dimensi card di viewport
    const cardEl = e?.currentTarget?.closest('.stat-card') || e?.currentTarget?.closest('div.bg-white') || e?.currentTarget;
    if (cardEl) {
      const rect = cardEl.getBoundingClientRect();
      setOriginRect({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      });
    }
    setActiveModalType(type);
  };

  // Status apakah data siap ditampilkan dari backend asli
  const isDataReady = Boolean(data && data.success);
  const showSkeleton = isLoading || !isDataReady;

  // Ekstraksi & normalisasi nilai KPI via helper terpusat
  const kpis = extractStudentKpis(data);
  const subtitles = getStudentKpiSubtitles(kpis);

  // Ekstraksi opsi filter dari response backend
  const {
    fakultasOptions,
    prodiOptions,
    jenjangOptions,
    rollingYears,
    semesterOptions,
    kewarganegaraanOptions,
    statusKeaktifanOptions,
    periodeMasukOptions,
  } = extractStudentFilterOptions(data);

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
          value={formatKpiDisplay(kpis.formattedActiveCount)} 
          subtitle={subtitles.activeSubtitle}
          icon={Users}
          badge="Status Aktif"
          actionLabel="Lihat Rincian"
          onViewDetails={(e) => handleOpenModal('active', e)}
          isLoading={showSkeleton}
        />

        {/* 2. Persentase Mahasiswa Internasional */}
        <StatCard 
          title="Persentase Mahasiswa Internasional" 
          value={formatKpiDisplay(kpis.foreignRate)} 
          subtitle={subtitles.foreignSubtitle}
          icon={Globe}
          badge="Non-WNI Aktif"
          actionLabel="Lihat Rincian"
          onViewDetails={(e) => handleOpenModal('foreign', e)}
          isLoading={showSkeleton}
        />

        {/* 3. Intake Mahasiswa Baru */}
        <StatCard 
          title="Intake Mahasiswa Baru" 
          value={formatKpiDisplay(kpis.formattedIntakeCount)} 
          subtitle={subtitles.intakeSubtitle}
          icon={UserPlus}
          badge="Mhs Semester 1"
          actionLabel="Lihat Rincian"
          onViewDetails={(e) => handleOpenModal('intake', e)}
          isLoading={showSkeleton}
        />

        {/* 4. Penurunan Jumlah Mahasiswa Baru (5 Tahun) */}
        <StatCard 
          title="Penurunan Mhs Baru (5 Thn)" 
          value={kpis.declineAvg} 
          subtitle={subtitles.declineSubtitle}
          icon={kpis.isFluctuationPositive ? TrendingUp : TrendingDown}
          badge="5-Year Avg"
          actionLabel="Lihat Rincian"
          onViewDetails={(e) => handleOpenModal('decline', e)}
          isLoading={showSkeleton}
        />
      </div>

      {/* Fitur Filter Container Lengkap (2 Baris Filter Selebar 4 Card di Atasnya) */}
      <StudentFilterContainer
        // Baris 1: 40% (Search) - 20% (Fakultas) - 20% (Prodi) - 20% (Jenjang)
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchClear={() => setSearchQuery('')}
        facultyValue={selectedFaculty}
        onFacultyChange={setSelectedFaculty}
        facultyOptions={fakultasOptions}
        prodiValue={selectedProdi}
        onProdiChange={setSelectedProdi}
        prodiOptions={prodiOptions}
        jenjangValue={selectedJenjang}
        onJenjangChange={setSelectedJenjang}
        jenjangOptions={jenjangOptions}

        // Baris 2: Angkatan + Semester + Kewarganegaraan + Status Keaktifan + Periode Masuk
        selectedYears={selectedYears}
        onAngkatanChange={setSelectedYears}
        rollingYears={rollingYears}
        semesterValue={selectedSemester}
        onSemesterChange={setSelectedSemester}
        semesterOptions={semesterOptions}
        nationalityValue={selectedNationality}
        onNationalityChange={setSelectedNationality}
        nationalityOptions={kewarganegaraanOptions}
        statusValue={selectedStatus}
        onStatusChange={setSelectedStatus}
        statusOptions={statusKeaktifanOptions}
        periodeValue={selectedPeriode}
        onPeriodeChange={setSelectedPeriode}
        periodeOptions={periodeMasukOptions}

        isLoading={showSkeleton}
      />

      {/* Kontainer Kosong untuk Tabel Data Mahasiswa */}
      <div className="w-full bg-white rounded-2xl md:rounded-3xl border border-gray-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-5 sm:p-6 min-h-[360px]" />

      {/* Styled Detail Modal */}
      <StudentDetailModal
        isOpen={Boolean(activeModalType)}
        onClose={() => setActiveModalType(null)}
        activeModalType={activeModalType}
        originRect={originRect}
        data={data}
      />
    </div>
  );
}
