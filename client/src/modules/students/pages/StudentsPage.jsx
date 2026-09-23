import { useState } from 'react';
import { Users, Globe, UserPlus, TrendingDown, TrendingUp, AlertCircle } from 'lucide-react';
import StatCard from '../../../components/common/cards/StatCard';
import { useStudentsData } from '../hooks/useStudentsData';
import { extractStudentKpis, getStudentKpiSubtitles } from '../../../utils/logic';
import StudentDetailModal from '../components/StudentDetailModal';

export default function StudentsPage() {
  const { data, isLoading, error } = useStudentsData();
  const [activeModalType, setActiveModalType] = useState(null); // 'active' | 'foreign' | 'intake' | 'decline' | null
  const [originRect, setOriginRect] = useState(null);

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
          value={kpis.formattedActiveCount !== '-' ? kpis.formattedActiveCount : null} 
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
          value={kpis.foreignRate !== '-' ? kpis.foreignRate : null} 
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
          value={kpis.formattedIntakeCount !== '-' ? kpis.formattedIntakeCount : null} 
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
