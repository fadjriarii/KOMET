import { useState, useEffect } from 'react';
import Modal from '../../../components/common/modals/Modal';
import { formatNumber } from '../../../utils/formatters';
import { Users, Globe, UserPlus, TrendingDown, TrendingUp, Info } from 'lucide-react';

export default function StudentDetailModal({
  isOpen,
  onClose,
  activeModalType, // 'active' | 'foreign' | 'intake' | 'decline'
  originRect,
  data,
}) {
  const [cachedType, setCachedType] = useState(activeModalType);

  useEffect(() => {
    if (activeModalType) {
      setCachedType(activeModalType);
    }
  }, [activeModalType]);

  const currentModalType = activeModalType || cachedType;
  if (!currentModalType) return null;

  const summary = data?.summary;
  const kpis = data?.kpis;

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
      maxWidth="max-w-2xl"
      originRect={originRect}
    >
      {/* 1. Modal Detail Mahasiswa Aktif */}
      {currentModalType === 'active' && (
        <div className="space-y-4">
          <div className="bg-digital-blue-50/70 border border-digital-blue-100 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-digital-blue-800 uppercase tracking-wider">Total Mahasiswa Aktif</p>
              <h4 className="text-2xl font-bold text-digital-blue-900 mt-0.5">
                {formatNumber(kpis?.activeStudentsCount ?? summary?.totalActiveStudents)} Mahasiswa
              </h4>
            </div>
            <div className="p-3 bg-digital-blue-600 text-white rounded-xl shadow-xs">
              <Users size={24} />
            </div>
          </div>

          <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100 space-y-2">
            <h5 className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <Info size={14} className="text-gray-400" />
              Kriteria Data Backend
            </h5>
            <p className="text-xs text-gray-500 leading-relaxed">
              Data mencakup seluruh mahasiswa dengan <strong>Status Keaktifan = "Aktif"</strong> yang terdaftar pada sistem informasi akademik kampus Komet.
            </p>
          </div>
        </div>
      )}

      {/* 2. Modal Detail Mahasiswa Asing */}
      {currentModalType === 'foreign' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-digital-blue-50/70 border border-digital-blue-100 rounded-2xl p-4">
              <p className="text-xs font-semibold text-digital-blue-800 uppercase tracking-wider">Rasio Non-WNI</p>
              <h4 className="text-2xl font-bold text-digital-blue-900 mt-0.5">
                {kpis?.foreignStudentsRate ?? `${summary?.internationalStudentsTrend?.latest?.rate ?? 0}%`}
              </h4>
              <p className="text-[11px] text-digital-blue-700 mt-1">Dari total student body aktif</p>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Jumlah Mahasiswa Asing</p>
              <h4 className="text-2xl font-bold text-gray-900 mt-0.5">
                {formatNumber(kpis?.foreignStudentsCount ?? summary?.totalInternationalStudents)} Orang
              </h4>
              <p className="text-[11px] text-gray-500 mt-1">Status kewarganegaraan WNA</p>
            </div>
          </div>

          {/* Tabel Tren Mahasiswa Asing per Periode */}
          {summary?.internationalStudentsTrend?.trend?.length > 0 && (
            <div>
              <h5 className="text-xs font-bold text-gray-700 mb-2">Riwayat per Tahun Akademik</h5>
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 font-semibold">
                    <tr>
                      <th className="px-3.5 py-2.5">Tahun Akademik</th>
                      <th className="px-3.5 py-2.5">Mahasiswa Asing</th>
                      <th className="px-3.5 py-2.5">Total Mahasiswa</th>
                      <th className="px-3.5 py-2.5">Persentase</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {summary.internationalStudentsTrend.trend.slice(-5).map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/60">
                        <td className="px-3.5 py-2 font-medium text-gray-900">{row.academicYear || row.cohortLabel}</td>
                        <td className="px-3.5 py-2">{row.foreignActive ?? row.foreignCount}</td>
                        <td className="px-3.5 py-2">{formatNumber(row.totalActive ?? row.totalCount)}</td>
                        <td className="px-3.5 py-2 font-semibold text-digital-blue-700">{row.rate ?? row.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Modal Detail Intake Mahasiswa Baru */}
      {currentModalType === 'intake' && (
        <div className="space-y-4">
          <div className="bg-digital-blue-50/70 border border-digital-blue-100 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-digital-blue-800 uppercase tracking-wider">Intake Semester 1</p>
              <h4 className="text-2xl font-bold text-digital-blue-900 mt-0.5">
                {formatNumber(kpis?.intakeCohortCount ?? summary?.intakeTrend?.latest?.intakeCount)} Mahasiswa
              </h4>
              <p className="text-[11px] text-digital-blue-700 mt-1">
                Periode Aktif: {summary?.intakeTrend?.latest?.tahun || '-'}
              </p>
            </div>
            <div className="p-3 bg-digital-blue-600 text-white rounded-xl shadow-xs">
              <UserPlus size={24} />
            </div>
          </div>

          {summary?.intakeTrend?.trend?.length > 0 && (
            <div>
              <h5 className="text-xs font-bold text-gray-700 mb-2">Riwayat Intake per Angkatan</h5>
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 font-semibold">
                    <tr>
                      <th className="px-3.5 py-2.5">Tahun Ajaran</th>
                      <th className="px-3.5 py-2.5">Jumlah Intake</th>
                      <th className="px-3.5 py-2.5">Pertumbuhan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {summary.intakeTrend.trend.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/60">
                        <td className="px-3.5 py-2 font-medium text-gray-900">{row.tahun}</td>
                        <td className="px-3.5 py-2">{formatNumber(row.intakeCount)} mhs</td>
                        <td className="px-3.5 py-2 font-medium">
                          <span className={Number(row.rawGrowth || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                            {row.growth || '0.00%'}
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
        <div className="space-y-4">
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Rata-rata Penurunan (5 Tahun)</p>
                <h4 className={`text-2xl font-bold mt-0.5 ${kpis?.isFluctuationPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {kpis?.intakeFluctuationAvg ?? `${summary?.newStudentDecline?.declinePercentage ?? 0}%`}
                </h4>
              </div>
              <div className={`p-3 rounded-xl ${kpis?.isFluctuationPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {kpis?.isFluctuationPositive ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
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
            <div>
              <h5 className="text-xs font-bold text-gray-700 mb-2">Riwayat Periode 5 Tahun</h5>
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 font-semibold">
                    <tr>
                      <th className="px-3.5 py-2.5">Simbol</th>
                      <th className="px-3.5 py-2.5">Tahun Akademik</th>
                      <th className="px-3.5 py-2.5">Jumlah Intake (Smt 1)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {summary.newStudentDecline.history.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/60">
                        <td className="px-3.5 py-2">
                          <span className="w-5 h-5 rounded-full bg-digital-blue-50 text-digital-blue-700 font-bold inline-flex items-center justify-center text-[10px]">
                            {row.label}
                          </span>
                        </td>
                        <td className="px-3.5 py-2 font-medium text-gray-900">{row.academicYear}</td>
                        <td className="px-3.5 py-2">{formatNumber(row.intakeCount)} mhs</td>
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
