import { useState, useEffect } from 'react';
import { Briefcase, Building2, UserCheck, Award } from 'lucide-react';
import StatCard from '../../../components/common/cards/StatCard';
import ChartCard from '../../../components/common/cards/ChartCard';
import { mbkmService } from '../services/mbkmService';

export default function MbkmPage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setIsLoading(true);
      try {
        const res = await mbkmService.getSummary();
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
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 tracking-tight">MBKM Data</h1>
        <p className="text-xs md:text-sm text-gray-500 mt-1">
          Monitoring partisipasi Merdeka Belajar Kampus Merdeka (Magang, Studi Independen, IISMA, Riset).
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Partisipan MBKM" 
          value={data?.totalParticipants} 
          subtitle="Semester Aktif"
          icon={Briefcase}
          isLoading={showSkeleton}
        />
        <StatCard 
          title="Mitra Industri & Kampus" 
          value={data?.totalPartners} 
          subtitle="Organisasi Mitra Resmi"
          icon={Building2}
          isLoading={showSkeleton}
        />
        <StatCard 
          title="Mahasiswa Eligible" 
          value={data?.eligibleStudentsCount} 
          subtitle="Semester 5 - 7"
          icon={UserCheck}
          isLoading={showSkeleton}
        />
        <StatCard 
          title="Tingkat Konversi SKS" 
          value={data?.conversionRate} 
          subtitle="Rata-rata Konversi"
          icon={Award}
          isLoading={showSkeleton}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard 
          title="Sebaran Kategori Kegiatan MBKM" 
          subtitle="Magang Bersertifikat, Studi Independen, Pertukaran Mahasiswa"
          isLoading={showSkeleton}
        >
          <div className="text-center text-gray-400 text-sm py-12">
            Area visualisasi grafik sebaran kategori MBKM
          </div>
        </ChartCard>

        <ChartCard 
          title="Top 5 Mitra MBKM Terbanyak" 
          subtitle="Berdasarkan jumlah mahasiswa yang diterima"
          isLoading={showSkeleton}
        >
          <div className="text-center text-gray-400 text-sm py-12">
            Area visualisasi grafik top mitra industri
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
