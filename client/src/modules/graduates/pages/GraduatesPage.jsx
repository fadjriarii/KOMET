import { useState, useEffect } from 'react';
import { GraduationCap, Award, Clock, BookOpenCheck } from 'lucide-react';
import StatCard from '../../../components/common/cards/StatCard';
import ChartCard from '../../../components/common/cards/ChartCard';
import { graduatesService } from '../services/graduatesService';

export default function GraduatesPage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setIsLoading(true);
      try {
        const res = await graduatesService.getSummary();
        if (isMounted && res?.success) {
          setData(res);
        }
      } catch {
        // Backend offline
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
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 tracking-tight">Graduate Data</h1>
        <p className="text-xs md:text-sm text-gray-500 mt-1">
          Statistik kelulusan mahasiswa, distribusi IPK, dan persentase kelulusan tepat waktu.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Wisudawan" 
          value={data?.totalGraduates} 
          subtitle="Tahun Akademik Berjalan"
          icon={GraduationCap}
          isLoading={showSkeleton}
        />
        <StatCard 
          title="Rata-rata IPK Lulusan" 
          value={data?.averageGpa} 
          subtitle="Skala 4.00"
          icon={Award}
          isLoading={showSkeleton}
        />
        <StatCard 
          title="Lulus Tepat Waktu" 
          value={data?.onTimeGraduationRate} 
          subtitle="Masa studi ≤ 4 tahun"
          icon={Clock}
          isLoading={showSkeleton}
        />
        <StatCard 
          title="Keberhasilan Studi" 
          value={data?.studySuccessRate} 
          subtitle="Tingkat kelulusan akhir"
          icon={BookOpenCheck}
          isLoading={showSkeleton}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard 
          title="Distribusi Rentang IPK Kelulusan" 
          subtitle="Persentase predikat kelulusan"
          isLoading={showSkeleton}
        >
          <div className="text-center text-gray-400 text-sm py-12">
            Area visualisasi grafik sebaran IPK
          </div>
        </ChartCard>

        <ChartCard 
          title="Tren Kelulusan Tepat Waktu per Prodi" 
          subtitle="Evaluasi masa studi per program studi"
          isLoading={showSkeleton}
        >
          <div className="text-center text-gray-400 text-sm py-12">
            Area visualisasi grafik masa studi per prodi
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
