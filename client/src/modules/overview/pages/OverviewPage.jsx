import { useState, useEffect } from 'react';
import { Users, GraduationCap, Briefcase, TrendingUp } from 'lucide-react';
import StatCard from '../../../components/common/cards/StatCard';
import ChartCard from '../../../components/common/cards/ChartCard';
import { overviewService } from '../services/overviewService';

export default function OverviewPage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setIsLoading(true);
      try {
        const res = await overviewService.getDashboardMetrics();
        if (isMounted && res?.success) {
          setData(res);
        }
      } catch {
        // Backend offline, biarkan skeleton
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, []);

  const isDataReady = Boolean(data && data.success);
  const showSkeleton = isLoading || !isDataReady;

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 tracking-tight">Overview Dashboard</h1>
        <p className="text-xs md:text-sm text-gray-500 mt-1">
          Ringkasan komprehensif data kemahasiswaan, kelulusan, dan program MBKM.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Mahasiswa Aktif" 
          value={data?.totalActiveStudents} 
          subtitle="Status Aktif"
          icon={Users}
          isLoading={showSkeleton}
        />
        <StatCard 
          title="Total Lulusan" 
          value={data?.totalGraduates} 
          subtitle="Tahun Berjalan"
          icon={GraduationCap}
          isLoading={showSkeleton}
        />
        <StatCard 
          title="Peserta MBKM" 
          value={data?.totalMbkmParticipants} 
          subtitle="Semester Aktif"
          icon={Briefcase}
          isLoading={showSkeleton}
        />
        <StatCard 
          title="Rata-rata IPK" 
          value={data?.averageGpa} 
          subtitle="Seluruh Fakultas"
          icon={TrendingUp}
          isLoading={showSkeleton}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard 
          title="Tren Penerimaan & Kelulusan" 
          subtitle="Perbandingan multi-tahun"
          isLoading={showSkeleton}
        >
          <div className="text-center text-gray-400 text-sm py-12">
            Area visualisasi grafik tren penerimaan dan kelulusan
          </div>
        </ChartCard>

        <ChartCard 
          title="Distribusi MBKM per Program" 
          subtitle="Magang, Studi Independen, Pertukaran Mahasiswa"
          isLoading={showSkeleton}
        >
          <div className="text-center text-gray-400 text-sm py-12">
            Area visualisasi grafik distribusi program MBKM
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
