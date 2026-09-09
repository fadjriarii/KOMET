import { kelulusanData } from '@/data/KomatQAmit_DB_DataDump';
import { getFacultyByProdi } from '@/utils/academicStructure';

/**
 * Helper untuk mem-parsing tahun lulus secara aman dari data kelulusan.
 * Menangani kasus tahun_lulus = 0 dengan fallback ke string periode atau angkatan + 4.
 *
 * @param {Object} item - Objek kelulusan
 * @returns {number} Tahun lulus yang dinormalisasi
 */
export const parseGraduationYear = (item) => {
  if (item?.tahun_lulus && Number(item.tahun_lulus) > 2000) {
    return Number(item.tahun_lulus);
  }
  const matchSlash = String(item?.periode || '').match(/(\d{4})\/(\d{4})/);
  if (matchSlash) {
    return parseInt(matchSlash[2], 10);
  }
  const matchSingle = String(item?.periode || '').match(/(\d{4})/);
  if (matchSingle) {
    return parseInt(matchSingle[1], 10);
  }
  return item?.angkatan ? Number(item.angkatan) + 4 : 2026;
};

/**
 * Normalisasi data kelulusan untuk memastikan tahun_lulus dan fakultas bersih.
 *
 * @param {Array<Object>} [data=kelulusanData] - Raw kelulusan array
 * @returns {Array<Object>} Array kelulusan yang sudah dinormalisasi
 */
export const normalizeGraduateData = (data = kelulusanData) => {
  if (!Array.isArray(data)) return [];
  return data.map((item) => {
    const cleanProdi = String(item.program_studi || 'Unknown')
      .replace(/\s*\(Akun Lama\)\s*$/i, '')
      .trim();
    const cleanFaculty = getFacultyByProdi(cleanProdi, item.fakultas);
    const parsedYear = parseGraduationYear(item);

    return {
      ...item,
      program_studi_clean: cleanProdi,
      fakultas_clean: cleanFaculty,
      tahun_lulus_clean: parsedYear,
      jenjang_clean: String(item.jenjang || 'S1').toUpperCase(),
    };
  });
};

/**
 * Menghitung Total Lulusan dari dataset kelulusan yang diberikan.
 *
 * @param {Array<Object>} [data=kelulusanData]
 * @returns {number}
 */
export const calculateTotalGraduatesCount = (data = kelulusanData) => {
  if (!Array.isArray(data)) return 0;
  return data.length;
};

/**
 * Menghitung Rata-rata IPK Lulusan secara keseluruhan atau terfilter jenjang ("S1" / "S2").
 *
 * @param {Array<Object>} [data=kelulusanData]
 * @param {string} [jenjang] - 'S1' | 'S2'
 * @returns {{ average: string, numAverage: number, count: number }}
 */
export const calculateGraduateAverageGpa = (data = kelulusanData, jenjang) => {
  if (!Array.isArray(data) || data.length === 0) {
    return { average: '0.00', numAverage: 0, count: 0 };
  }

  const scoped = jenjang
    ? data.filter((item) => String(item.jenjang || '').toUpperCase() === jenjang.toUpperCase())
    : data;

  const valid = scoped.filter(
    (item) => typeof item.ipk === 'number' && !Number.isNaN(item.ipk) && item.ipk > 0
  );

  if (valid.length === 0) {
    return { average: '0.00', numAverage: 0, count: 0 };
  }

  const sum = valid.reduce((acc, cur) => acc + cur.ipk, 0);
  const avg = sum / valid.length;

  return {
    average: avg.toFixed(2),
    numAverage: Number(avg.toFixed(2)),
    count: valid.length,
  };
};

/**
 * Menghitung Persentase Lulus Tepat Waktu (S1 4 Tahun).
 * Rumus dari kebutuhanData.md:
 * A = Jumlah lulusan yang (Tahun lulus - Tahun Angkatan) = 4
 * B = Jumlah lulusan jenjang S1 pada cohort/dataset yang dianalisis
 * % Tepat Waktu = (A / B) * 100%
 *
 * @param {Array<Object>} [data=kelulusanData]
 * @returns {{ rate: string, numRate: number, onTimeCount: number, totalS1: number, badge: string }}
 */
export const calculateOnTimeGraduationRate = (data = kelulusanData) => {
  if (!Array.isArray(data) || data.length === 0) {
    return { rate: '0.0%', numRate: 0, onTimeCount: 0, totalS1: 0, badge: 'Target ≥80%' };
  }

  const normalized = normalizeGraduateData(data);
  const s1Data = normalized.filter((item) => String(item.jenjang || '').toUpperCase() === 'S1');

  if (s1Data.length === 0) {
    return { rate: '0.0%', numRate: 0, onTimeCount: 0, totalS1: 0, badge: 'Target ≥80%' };
  }

  const onTimeCount = s1Data.filter((item) => {
    const diff = item.tahun_lulus_clean - Number(item.angkatan);
    return diff === 4;
  }).length;

  const numRate = (onTimeCount / s1Data.length) * 100;

  return {
    rate: `${numRate.toFixed(1)}%`,
    numRate: Number(numRate.toFixed(1)),
    onTimeCount,
    totalS1: s1Data.length,
    badge: 'Target ≥80%',
  };
};

/**
 * Menghitung Keberhasilan Studi (Lulus <= 7 Tahun untuk S1 / <= 4 tahun untuk S2).
 * Rumus dari kebutuhanData.md:
 * A = Jumlah mahasiswa yang sudah lulus sampai batas 7 tahun
 * B = Total lulusan dalam kelompok data
 * Keberhasilan Studi (%) = (A / B) * 100%
 *
 * @param {Array<Object>} [data=kelulusanData]
 * @returns {{ rate: string, numRate: number, successCount: number, total: number, badge: string }}
 */
export const calculateStudySuccessRate = (data = kelulusanData) => {
  if (!Array.isArray(data) || data.length === 0) {
    return { rate: '0.0%', numRate: 0, successCount: 0, total: 0, badge: 'Target ≥85%' };
  }

  const normalized = normalizeGraduateData(data);
  const successCount = normalized.filter((item) => {
    const diff = item.tahun_lulus_clean - Number(item.angkatan);
    const isS2 = String(item.jenjang || '').toUpperCase() === 'S2';
    const maxYears = isS2 ? 4 : 7;
    return diff >= 0 && diff <= maxYears;
  }).length;

  const numRate = (successCount / normalized.length) * 100;

  return {
    rate: `${numRate.toFixed(1)}%`,
    numRate: Number(numRate.toFixed(1)),
    successCount,
    total: normalized.length,
    badge: 'Target ≥85%',
  };
};

/**
 * Mengelompokkan rata-rata IPK per Program Studi.
 *
 * @param {Array<Object>} [data=kelulusanData]
 * @returns {Array<{ name: string, gpa: string, gpaValue: number, count: number, s1Avg: string, s2Avg: string }>}
 */
export const groupGraduateGpaByProdi = (data = kelulusanData) => {
  if (!Array.isArray(data) || data.length === 0) return [];
  const normalized = normalizeGraduateData(data);

  const map = new Map();
  for (const item of normalized) {
    if (typeof item.ipk !== 'number' || Number.isNaN(item.ipk) || item.ipk <= 0) continue;
    const prodi = item.program_studi_clean;
    const current = map.get(prodi) || { totalIpk: 0, count: 0, s1Total: 0, s1Count: 0, s2Total: 0, s2Count: 0 };
    current.totalIpk += item.ipk;
    current.count += 1;

    if (String(item.jenjang || '').toUpperCase() === 'S2') {
      current.s2Total += item.ipk;
      current.s2Count += 1;
    } else {
      current.s1Total += item.ipk;
      current.s1Count += 1;
    }
    map.set(prodi, current);
  }

  return Array.from(map.entries())
    .map(([name, val]) => {
      const avg = val.totalIpk / val.count;
      const s1Avg = val.s1Count > 0 ? (val.s1Total / val.s1Count).toFixed(2) : '-';
      const s2Avg = val.s2Count > 0 ? (val.s2Total / val.s2Count).toFixed(2) : '-';
      return {
        name,
        gpa: avg.toFixed(2),
        gpaValue: Number(avg.toFixed(2)),
        count: val.count,
        s1Avg,
        s2Avg,
      };
    })
    .sort((a, b) => b.gpaValue - a.gpaValue);
};

/**
 * Mengelompokkan rata-rata IPK per Fakultas.
 *
 * @param {Array<Object>} [data=kelulusanData]
 * @returns {Array<{ name: string, gpa: string, gpaValue: number, count: number }>}
 */
export const groupGraduateGpaByFaculty = (data = kelulusanData) => {
  if (!Array.isArray(data) || data.length === 0) return [];
  const normalized = normalizeGraduateData(data);

  const map = new Map();
  for (const item of normalized) {
    if (typeof item.ipk !== 'number' || Number.isNaN(item.ipk) || item.ipk <= 0) continue;
    const faculty = item.fakultas_clean;
    const current = map.get(faculty) || { totalIpk: 0, count: 0 };
    current.totalIpk += item.ipk;
    current.count += 1;
    map.set(faculty, current);
  }

  return Array.from(map.entries())
    .map(([name, val]) => {
      const avg = val.totalIpk / val.count;
      return {
        name,
        gpa: avg.toFixed(2),
        gpaValue: Number(avg.toFixed(2)),
        count: val.count,
      };
    })
    .sort((a, b) => b.gpaValue - a.gpaValue);
};

/**
 * Mengelompokkan data lulusan per Rentang/Band IPK.
 *
 * @param {Array<Object>} [data=kelulusanData]
 * @returns {Array<{ range: string, count: number, percentage: string }>}
 */
export const groupGraduateGpaBands = (data = kelulusanData) => {
  if (!Array.isArray(data) || data.length === 0) return [];
  const normalized = normalizeGraduateData(data);
  const total = normalized.filter((k) => typeof k.ipk === 'number' && k.ipk > 0).length || 1;

  const bands = [
    { range: '< 3.00', min: 0, max: 2.99, count: 0 },
    { range: '3.00 - 3.24', min: 3.00, max: 3.24, count: 0 },
    { range: '3.25 - 3.49', min: 3.25, max: 3.49, count: 0 },
    { range: '3.50 - 3.74', min: 3.50, max: 3.74, count: 0 },
    { range: '3.75 - 4.00', min: 3.75, max: 4.00, count: 0 },
  ];

  normalized.forEach((item) => {
    if (typeof item.ipk !== 'number' || item.ipk <= 0) return;
    const ipk = item.ipk;
    for (const b of bands) {
      if (ipk >= b.min && ipk <= b.max) {
        b.count += 1;
        break;
      }
    }
  });

  return bands.map((b) => ({
    range: b.range,
    count: b.count,
    percentage: `${((b.count / total) * 100).toFixed(1)}%`,
  }));
};

/**
 * Mengelompokkan data lulusan per Tahun Kelulusan (Yearly Trend).
 *
 * @param {Array<Object>} [data=kelulusanData]
 * @returns {Array<{ year: number, count: number, avgGpa: string, onTimeRate: string }>}
 */
export const groupGraduatesByGraduationYear = (data = kelulusanData) => {
  if (!Array.isArray(data) || data.length === 0) return [];
  const normalized = normalizeGraduateData(data);

  const map = new Map();
  for (const item of normalized) {
    const yr = item.tahun_lulus_clean;
    if (!yr || yr < 2010) continue;
    const current = map.get(yr) || { count: 0, totalIpk: 0, validIpkCount: 0, s1Count: 0, onTimeCount: 0 };
    current.count += 1;
    if (typeof item.ipk === 'number' && item.ipk > 0) {
      current.totalIpk += item.ipk;
      current.validIpkCount += 1;
    }
    if (String(item.jenjang || '').toUpperCase() === 'S1') {
      current.s1Count += 1;
      if (item.tahun_lulus_clean - Number(item.angkatan) === 4) {
        current.onTimeCount += 1;
      }
    }
    map.set(yr, current);
  }

  return Array.from(map.entries())
    .map(([year, val]) => {
      const avgGpa = val.validIpkCount > 0 ? (val.totalIpk / val.validIpkCount).toFixed(2) : '0.00';
      const onTimeRate = val.s1Count > 0 ? ((val.onTimeCount / val.s1Count) * 100).toFixed(1) + '%' : '0.0%';
      return {
        year,
        count: val.count,
        avgGpa,
        onTimeRate,
      };
    })
    .sort((a, b) => a.year - b.year);
};

/**
 * Mengelompokkan lulusan berdasarkan Predikat Kelulusan (Cum Laude, Sangat Memuaskan, Memuaskan, dll).
 *
 * @param {Array<Object>} [data=kelulusanData]
 * @returns {Array<{ name: string, count: number, percentage: string, color: string }>}
 */
export const groupGraduatesByPredikat = (data = kelulusanData) => {
  if (!Array.isArray(data) || data.length === 0) return [];
  const total = data.length;

  const map = {
    'Cum Laude': 0,
    'Sangat Memuaskan': 0,
    'Memuaskan': 0,
    'Lainnya / Belum Ada Data': 0,
  };

  data.forEach((item) => {
    const p = String(item.predikat_lulus || '').trim();
    if (p.toLowerCase().includes('cum laude')) {
      map['Cum Laude'] += 1;
    } else if (p.toLowerCase().includes('sangat memuaskan')) {
      map['Sangat Memuaskan'] += 1;
    } else if (p.toLowerCase().includes('memuaskan')) {
      map['Memuaskan'] += 1;
    } else {
      map['Lainnya / Belum Ada Data'] += 1;
    }
  });

  const colors = {
    'Cum Laude': '#006192',
    'Sangat Memuaskan': '#0d9488',
    'Memuaskan': '#d97706',
    'Lainnya / Belum Ada Data': '#94a3b8',
  };

  return Object.entries(map).map(([name, count]) => ({
    name,
    count,
    percentage: `${((count / total) * 100).toFixed(1)}%`,
    color: colors[name] || '#64748b',
  }));
};

/**
 * Analisis Lulus Tepat Waktu per Angkatan (Cohort Analysis S1).
 *
 * @param {Array<Object>} [data=kelulusanData]
 * @returns {Array<{ cohort: number, cohortLabel: string, totalS1: number, onTimeCount: number, lateCount: number, fastCount: number, rate: number, rateFormatted: string }>}
 */
export const getOnTimeGraduationByCohort = (data = kelulusanData) => {
  if (!Array.isArray(data) || data.length === 0) return [];
  const normalized = normalizeGraduateData(data);
  const cohorts = [...new Set(normalized.map((k) => Number(k.angkatan)).filter((a) => a > 2000))].sort((a, b) => a - b);

  return cohorts
    .map((c) => {
      const s1Cohort = normalized.filter((k) => Number(k.angkatan) === c && k.jenjang_clean === 'S1');
      const onTime = s1Cohort.filter((k) => k.tahun_lulus_clean - Number(k.angkatan) === 4);
      const late = s1Cohort.filter((k) => k.tahun_lulus_clean - Number(k.angkatan) > 4);
      const fast = s1Cohort.filter((k) => k.tahun_lulus_clean - Number(k.angkatan) < 4);
      const numRate = s1Cohort.length > 0 ? (onTime.length / s1Cohort.length) * 100 : 0;

      return {
        cohort: c,
        cohortLabel: `Angkatan ${c}`,
        totalS1: s1Cohort.length,
        onTimeCount: onTime.length,
        lateCount: late.length,
        fastCount: fast.length,
        rate: Number(numRate.toFixed(1)),
        rateFormatted: `${numRate.toFixed(1)}%`,
      };
    })
    .filter((row) => row.totalS1 > 0);
};

/**
 * Analisis Keberhasilan Studi per Angkatan (Cohort Study Success).
 *
 * @param {Array<Object>} [data=kelulusanData]
 * @returns {Array<{ cohort: number, cohortLabel: string, total: number, successCount: number, rate: number, rateFormatted: string }>}
 */
export const getStudySuccessByCohort = (data = kelulusanData) => {
  if (!Array.isArray(data) || data.length === 0) return [];
  const normalized = normalizeGraduateData(data);
  const cohorts = [...new Set(normalized.map((k) => Number(k.angkatan)).filter((a) => a > 2000))].sort((a, b) => a - b);

  return cohorts
    .map((c) => {
      const cohortAll = normalized.filter((k) => Number(k.angkatan) === c);
      const success = cohortAll.filter((k) => {
        const diff = k.tahun_lulus_clean - Number(k.angkatan);
        const max = k.jenjang_clean === 'S2' ? 4 : 7;
        return diff >= 0 && diff <= max;
      });
      const numRate = cohortAll.length > 0 ? (success.length / cohortAll.length) * 100 : 0;

      return {
        cohort: c,
        cohortLabel: `Angkatan ${c}`,
        total: cohortAll.length,
        successCount: success.length,
        rate: Number(numRate.toFixed(1)),
        rateFormatted: `${numRate.toFixed(1)}%`,
      };
    })
    .filter((row) => row.total > 0);
};
