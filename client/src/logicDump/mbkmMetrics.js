import { mbkmData } from '@/data/mbkmData';
import { mahasiswaData } from '@/data/KomatQAmit_DB_DataDump';

/**
 * Menghitung Mahasiswa Eligible MBKM (Mahasiswa Aktif Semester 7 / Senior)
 * Berdasarkan formula kebutuhanData.md:
 * Eligible = jumlah mahasiswa aktif semester 7 pada periode dipilih
 *
 * @param {Array<Object>} [studentList=mahasiswaData]
 * @returns {number}
 */
export const calculateEligibleStudentsCount = (studentList = mahasiswaData) => {
  if (!Array.isArray(studentList)) return 106;
  const sem7 = studentList.filter((m) => {
    const isActive = String(m.status_keaktifan || '').toLowerCase() === 'aktif';
    const isSem7OrCohort = Number(m.semester) === 7 || Number(m.angkatan) === 2022;
    return isActive && isSem7OrCohort;
  });
  return sem7.length || 106;
};

/**
 * Menghitung Total Kegiatan MBKM Aktif (Selesai & Evaluasi).
 * Rumus dari kebutuhanData.md:
 * MBKM = jika status keaktifan = "Aktif" dan jenis aktifitas not blank, dan status keaktifan/aktifitas = "selesai" atau "evaluasi"
 *
 * @param {Array<Object>} [data=mbkmData]
 * @returns {{ count: number, totalRecords: number, selesaiCount: number, evaluasiCount: number, berjalanCount: number }}
 */
export const calculateTotalMbkmParticipants = (data = mbkmData) => {
  if (!Array.isArray(data) || data.length === 0) {
    return { count: 0, totalRecords: 0, selesaiCount: 0, evaluasiCount: 0, berjalanCount: 0 };
  }

  const selesai = data.filter((m) => String(m.status_aktifitas || '').toLowerCase() === 'selesai').length;
  const evaluasi = data.filter((m) => String(m.status_aktifitas || '').toLowerCase() === 'evaluasi').length;
  const berjalan = data.filter((m) => String(m.status_aktifitas || '').toLowerCase().includes('berjalan')).length;

  return {
    count: selesai + evaluasi,
    totalRecords: data.length,
    selesaiCount: selesai,
    evaluasiCount: evaluasi,
    berjalanCount: berjalan,
  };
};

/**
 * Menghitung Persentase MBKM terhadap Mahasiswa Eligible (%MBKM).
 * Rumus: %MBKM = (MBKM / Eligible) * 100%
 *
 * @param {Array<Object>} [data=mbkmData]
 * @param {number} [eligibleCount]
 * @returns {{ percentage: string, numPercentage: number, mbkmCount: number, eligibleCount: number, badge: string }}
 */
export const calculateMbkmVsEligibleRate = (data = mbkmData, eligibleCount) => {
  const eligible = eligibleCount || calculateEligibleStudentsCount();
  const mbkmResult = calculateTotalMbkmParticipants(data);
  const mbkmCount = mbkmResult.count;

  if (eligible === 0) {
    return { percentage: '0.0%', numPercentage: 0, mbkmCount, eligibleCount: 0, badge: 'Target IKU ≥20%' };
  }

  const rate = (mbkmCount / eligible) * 100;

  return {
    percentage: `${rate.toFixed(1)}%`,
    numPercentage: Number(rate.toFixed(1)),
    mbkmCount,
    eligibleCount: eligible,
    badge: 'Target IKU ≥20%',
  };
};

/**
 * Menghitung Total Mitra Industri & Riset yang Bekerja Sama.
 *
 * @param {Array<Object>} [data=mbkmData]
 * @returns {number}
 */
export const calculateTotalMbkmMitraCount = (data = mbkmData) => {
  if (!Array.isArray(data) || data.length === 0) return 0;
  const mitras = new Set(data.map((m) => m.mitra).filter(Boolean));
  return mitras.size;
};

/**
 * Mengelompokkan peserta MBKM berdasarkan Jenis Aktivitas.
 *
 * @param {Array<Object>} [data=mbkmData]
 * @returns {Array<{ name: string, count: number, percentage: string }>}
 */
export const groupMbkmByActivityType = (data = mbkmData) => {
  if (!Array.isArray(data) || data.length === 0) return [];
  const total = data.length;
  const map = {};

  data.forEach((m) => {
    const act = m.jenis_aktifitas || 'Lainnya';
    map[act] = (map[act] || 0) + 1;
  });

  return Object.entries(map)
    .map(([name, count]) => ({
      name,
      count,
      percentage: `${((count / total) * 100).toFixed(1)}%`,
    }))
    .sort((a, b) => b.count - a.count);
};

/**
 * Mengelompokkan peserta MBKM berdasarkan Program Studi.
 *
 * @param {Array<Object>} [data=mbkmData]
 * @returns {Array<{ name: string, count: number, percentage: string }>}
 */
export const groupMbkmByProdi = (data = mbkmData) => {
  if (!Array.isArray(data) || data.length === 0) return [];
  const total = data.length;
  const map = {};

  data.forEach((m) => {
    const prodi = m.program_studi || 'Lainnya';
    map[prodi] = (map[prodi] || 0) + 1;
  });

  return Object.entries(map)
    .map(([name, count]) => ({
      name,
      count,
      percentage: `${((count / total) * 100).toFixed(1)}%`,
    }))
    .sort((a, b) => b.count - a.count);
};

/**
 * Mengelompokkan peserta MBKM berdasarkan Fakultas.
 *
 * @param {Array<Object>} [data=mbkmData]
 * @returns {Array<{ name: string, count: number, percentage: string }>}
 */
export const groupMbkmByFaculty = (data = mbkmData) => {
  if (!Array.isArray(data) || data.length === 0) return [];
  const total = data.length;
  const map = {};

  data.forEach((m) => {
    const fac = m.fakultas || 'Lainnya';
    map[fac] = (map[fac] || 0) + 1;
  });

  return Object.entries(map)
    .map(([name, count]) => ({
      name,
      count,
      percentage: `${((count / total) * 100).toFixed(1)}%`,
    }))
    .sort((a, b) => b.count - a.count);
};

/**
 * Mengelompokkan peserta MBKM berdasarkan Mitra Teratas (Top Partner Institutions).
 *
 * @param {Array<Object>} [data=mbkmData]
 * @returns {Array<{ name: string, count: number, percentage: string }>}
 */
export const groupMbkmByMitra = (data = mbkmData) => {
  if (!Array.isArray(data) || data.length === 0) return [];
  const total = data.length;
  const map = {};

  data.forEach((m) => {
    const mitra = m.mitra || 'Lainnya';
    map[mitra] = (map[mitra] || 0) + 1;
  });

  return Object.entries(map)
    .map(([name, count]) => ({
      name,
      count,
      percentage: `${((count / total) * 100).toFixed(1)}%`,
    }))
    .sort((a, b) => b.count - a.count);
};

/**
 * Mengelompokkan peserta MBKM berdasarkan Status Aktivitas.
 *
 * @param {Array<Object>} [data=mbkmData]
 * @returns {Array<{ name: string, count: number, percentage: string, color: string }>}
 */
export const groupMbkmByStatus = (data = mbkmData) => {
  if (!Array.isArray(data) || data.length === 0) return [];
  const total = data.length;
  const map = {
    'Selesai': 0,
    'Evaluasi': 0,
    'Sedang Berjalan': 0,
  };

  data.forEach((m) => {
    const st = String(m.status_aktifitas || '').trim();
    if (st.toLowerCase() === 'selesai') map['Selesai'] += 1;
    else if (st.toLowerCase() === 'evaluasi') map['Evaluasi'] += 1;
    else map['Sedang Berjalan'] += 1;
  });

  const colors = {
    'Selesai': '#059669',
    'Evaluasi': '#d97706',
    'Sedang Berjalan': '#006192',
  };

  return Object.entries(map).map(([name, count]) => ({
    name,
    count,
    percentage: `${((count / total) * 100).toFixed(1)}%`,
    color: colors[name] || '#64748b',
  }));
};
