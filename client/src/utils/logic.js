/**
 * ============================================================================
 * logic.js - Kumpulan Seluruh Business Logic, Kalkulasi, Formatting, 
 * dan Data Transformation Frontend KOMET
 * ============================================================================
 * 
 * File ini dirancang sebagai Single Source of Truth untuk seluruh logic 
 * pengolahan data di frontend agar dapat dengan mudah dipindahkan / disinkronkan
 * ke backend (Node.js / Express / Prisma Service) nantinya.
 */

// ============================================================================
// 1. FORMATTING & NUMBER UTILITIES
// ============================================================================

/**
 * Format angka dengan pemisah ribuan standar Indonesia (e.g., 12.345)
 * @param {number|string} num 
 * @returns {string}
 */
export function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '-';
  return new Intl.NumberFormat('id-ID').format(num);
}

/**
 * Format persentase dengan jumlah desimal yang dapat disesuaikan (e.g., 85.5%)
 * @param {number|string} value 
 * @param {number} decimals 
 * @returns {string}
 */
export function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) return '-';
  return `${Number(value).toFixed(decimals)}%`;
}

/**
 * Format Indeks Prestasi Kumulatif (IPK) 2 digit desimal (e.g., 3.65)
 * @param {number|string} gpa 
 * @returns {string}
 */
export function formatGPA(gpa) {
  if (gpa === null || gpa === undefined || isNaN(gpa)) return '-';
  return Number(gpa).toFixed(2);
}

/**
 * Format tanggal standar Bahasa Indonesia (e.g., 23 September 2026)
 * @param {string|Date} dateStr 
 * @returns {string}
 */
export function formatDateIndo(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

// ============================================================================
// 2. KALKULASI AKADEMIK & TAHUN AJARAN
// ============================================================================

/**
 * Mendapatkan format Tahun Ajaran aktif (e.g., 2026/2027).
 * Berganti secara otomatis setiap tanggal 1 September (cut-off semester ganjil).
 * @param {Date|string} [date=new Date()] 
 * @returns {string} Contoh: '2026/2027'
 */
export function getCurrentAcademicYear(date = new Date()) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth(); // 0 = Jan, 8 = Sept
  return month >= 8 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
}

// ============================================================================
// 3. LOGIC MODULE: STUDENTS (KEMAHASISWAAN)
// ============================================================================

/**
 * Ekstraksi & normalisasi data 4 KPI Mahasiswa dari response API / summary.
 * Menangani kompatibilitas antara struktur KPI baru (`kpis.*`) vs struktur summary lama (`summary.*`).
 * 
 * @param {Object} data - Payload response dari API endpoint /api/students/summary
 * @returns {Object} Object data KPI siap pakai dan terformat
 */
export function extractStudentKpis(data) {
  const summary = data?.summary;
  const kpis = data?.kpis;

  const activeCount = kpis?.activeStudentsCount ?? summary?.totalActiveStudents ?? null;
  const foreignCount = kpis?.foreignStudentsCount ?? summary?.totalInternationalStudents ?? null;
  
  // Format persentase mahasiswa asing
  let foreignRate = kpis?.foreignStudentsRate;
  if (!foreignRate && summary?.internationalStudentsTrend?.latest?.rate !== undefined) {
    foreignRate = `${summary.internationalStudentsTrend.latest.rate}%`;
  }

  const intakeCount = kpis?.intakeCohortCount ?? summary?.intakeTrend?.latest?.intakeCount ?? null;
  const intakePeriod = summary?.intakeTrend?.latest?.tahun ?? null;

  // Format rata-rata penurunan mahasiswa baru 5 tahun
  let declineAvg = kpis?.intakeFluctuationAvg;
  if (!declineAvg && summary?.newStudentDecline?.declinePercentage !== undefined) {
    declineAvg = `${summary.newStudentDecline.declinePercentage}%`;
  }

  const isFluctuationPositive = kpis?.isFluctuationPositive ?? false;
  const declinePeriod = summary?.newStudentDecline?.selectedPeriod ?? null;

  return {
    activeCount,
    formattedActiveCount: activeCount !== null ? formatNumber(activeCount) : '-',
    foreignCount,
    formattedForeignCount: foreignCount !== null ? formatNumber(foreignCount) : '-',
    foreignRate: foreignRate ?? '-',
    intakeCount,
    formattedIntakeCount: intakeCount !== null ? formatNumber(intakeCount) : '-',
    intakePeriod,
    declineAvg: declineAvg ?? '0%',
    isFluctuationPositive,
    declinePeriod,
  };
}

/**
 * Generate teks subtitle dinamis untuk 4 KPI Card Mahasiswa
 * 
 * @param {Object} params
 * @param {number} [params.foreignCount]
 * @param {string} [params.intakePeriod]
 * @param {string} [params.declinePeriod]
 * @returns {Object}
 */
export function getStudentKpiSubtitles({ foreignCount, intakePeriod, declinePeriod } = {}) {
  return {
    activeSubtitle: 'Total Student Body status aktif',
    foreignSubtitle: foreignCount !== undefined && foreignCount !== null 
      ? `${formatNumber(foreignCount)} Mahasiswa Non-WNI` 
      : 'Non-WNI status aktif',
    intakeSubtitle: intakePeriod 
      ? `Semester 1 (Periode ${intakePeriod})` 
      : 'Semester 1',
    declineSubtitle: declinePeriod 
      ? `Rata-rata 5 Tahun (${declinePeriod})` 
      : 'Rata-rata 5 Tahun',
  };
}

/**
 * Generate teks narasi deskripsi dinamis untuk modal detail mahasiswa aktif
 * @param {string} academicYear 
 * @param {string} totalActiveFormatted 
 * @returns {string}
 */
export function getStudentActiveDescription(academicYear, totalActiveFormatted) {
  return `Data mahasiswa aktif tahun ajaran ${academicYear} mencerminkan total ${totalActiveFormatted} mahasiswa yang tercatat aktif menempuh perkuliahan di lingkungan kampus Komet. Informasi distribusi mahasiswa aktif ini dikelompokkan dan disajikan ke dalam 3 tab utama, yaitu Per Fakultas, Per Program Studi, dan Per Jenjang untuk memudahkan pemantauan persebaran dan analisis data akademik di setiap tingkatan.`;
}

/**
 * Generate teks narasi deskripsi dan rumus untuk modal detail mahasiswa asing (Non-WNI)
 * @param {string} academicYear 
 * @param {string|number} foreignCountFormatted 
 * @param {string|number} totalActiveFormatted 
 * @param {string} foreignRateFormatted 
 * @returns {string}
 */
export function getStudentForeignDescription(academicYear, foreignCountFormatted, totalActiveFormatted, foreignRateFormatted) {
  return `Persentase mahasiswa asing (${foreignRateFormatted}) dihitung berdasarkan rasio total mahasiswa berkewarganegaraan Non-WNI yang berstatus aktif (${foreignCountFormatted} mahasiswa) terhadap keseluruhan total student body aktif (${totalActiveFormatted} mahasiswa) pada tahun ajaran ${academicYear}. Rumus perhitungan: (Jumlah Mahasiswa Non-WNI Aktif / Total Student Body Aktif) × 100%.`;
}

/**
 * Transformasi riwayat tren mahasiswa asing untuk tabel modal
 * @param {Array} trendList 
 * @param {number} [limit=5] 
 * @returns {Array}
 */
export function transformForeignTrend(trendList = [], limit = 0) {
  if (!Array.isArray(trendList)) return [];
  const items = limit > 0 ? trendList.slice(-limit) : trendList;
  
  const maxForeign = Math.max(...items.map((r) => Number(r.foreignActive ?? r.foreignCount ?? 0)), 1);

  return items.map((row) => {
    const rawForeign = Number(row.foreignActive ?? row.foreignCount ?? 0);
    const rawTotal = Number(row.totalActive ?? row.totalCount ?? 0);
    const rawRate = Number(row.rate ?? row.percentage ?? 0);
    const barWidth = Math.min(100, Math.max(0, (rawForeign / maxForeign) * 100));

    return {
      academicYear: row.academicYear || row.cohortLabel || '-',
      foreignCount: rawForeign,
      formattedForeignCount: `${formatNumber(rawForeign)} mhs`,
      totalCount: formatNumber(rawTotal),
      rawTotal,
      rawRate,
      percentage: `${rawRate.toFixed(1)}%`,
      barWidth,
    };
  });
}

/**
 * Transformasi riwayat intake mahasiswa baru untuk tabel modal
 * @param {Array} trendList 
 * @returns {Array}
 */
export function transformIntakeTrend(trendList = []) {
  if (!Array.isArray(trendList)) return [];
  return trendList.map((row) => ({
    tahun: row.tahun || '-',
    intakeCountFormatted: `${formatNumber(row.intakeCount || 0)} mhs`,
    growthFormatted: row.growth || '0.00%',
    isPositive: Number(row.rawGrowth || 0) >= 0,
  }));
}

/**
 * Transformasi riwayat penurunan mahasiswa baru 5 tahun untuk tabel modal
 * @param {Array} historyList 
 * @returns {Array}
 */
export function transformDeclineHistory(historyList = []) {
  if (!Array.isArray(historyList)) return [];
  return historyList.map((row) => ({
    label: row.label || '',
    academicYear: row.academicYear || '-',
    intakeCountFormatted: `${formatNumber(row.intakeCount || 0)} mhs`,
  }));
}

/**
 * Transformasi distribusi mahasiswa aktif per fakultas untuk horizontal bar chart
 * @param {Array} facultyList - List [{ name, count }] dari API /api/students/active-students
 * @param {number} [totalActive] - Total mahasiswa aktif untuk perhitungan persentase
 * @returns {Array} List [{ name, count, formattedCount, percentageFormatted, barWidth }]
 */
export function transformFacultyDistribution(facultyList = [], totalActive = 0) {
  if (!Array.isArray(facultyList) || facultyList.length === 0) return [];

  const maxCount = Math.max(...facultyList.map((f) => Number(f.count || 0)), 1);
  const total = totalActive > 0 
    ? totalActive 
    : facultyList.reduce((acc, f) => acc + Number(f.count || 0), 0);

  return facultyList.map((f) => {
    const count = Number(f.count || 0);
    const pct = total > 0 ? (count / total) * 100 : 0;
    const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;

    return {
      name: f.name || 'Fakultas Tidak Terdata',
      count,
      formattedCount: formatNumber(count),
      percentageFormatted: `${pct.toFixed(1)}%`,
      barWidth: Math.max(barWidth, 3), // Min 3% agar bar tetap tampak untuk nilai kecil
    };
  });
}

/**
 * Transformasi distribusi mahasiswa aktif per program studi
 * @param {Array} prodiList - List [{ name, count, percentage }] dari API
 * @param {number} [totalActive]
 * @returns {Array}
 */
export function transformProdiDistribution(prodiList = [], totalActive = 0) {
  if (!Array.isArray(prodiList) || prodiList.length === 0) return [];
  const maxCount = Math.max(...prodiList.map((p) => Number(p.count || 0)), 1);

  return prodiList.map((p) => {
    const count = Number(p.count || 0);
    const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;

    return {
      name: p.name || 'Program Studi',
      count,
      formattedCount: formatNumber(count),
      percentageFormatted: p.percentage || (totalActive > 0 ? `${((count / totalActive) * 100).toFixed(1)}%` : '0%'),
      barWidth: Math.max(barWidth, 3),
    };
  });
}

/**
 * Transformasi distribusi mahasiswa aktif per jenjang studi
 * @param {Array} jenjangList - List [{ name, count }] dari API
 * @param {number} [totalActive]
 * @returns {Array}
 */
export function transformJenjangDistribution(jenjangList = [], totalActive = 0) {
  if (!Array.isArray(jenjangList) || jenjangList.length === 0) return [];
  const maxCount = Math.max(...jenjangList.map((j) => Number(j.count || 0)), 1);
  const total = totalActive > 0 
    ? totalActive 
    : jenjangList.reduce((acc, j) => acc + Number(j.count || 0), 0);

  return jenjangList.map((j) => {
    const count = Number(j.count || 0);
    const pct = total > 0 ? (count / total) * 100 : 0;
    const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;

    return {
      name: j.name || 'Jenjang',
      count,
      formattedCount: formatNumber(count),
      percentageFormatted: `${pct.toFixed(1)}%`,
      barWidth: Math.max(barWidth, 3),
    };
  });
}

// ============================================================================
// 4. LOGIC MODULE: OVERVIEW, GRADUATES, & MBKM (NORMALIZER)
// ============================================================================

/**
 * Normalisasi metrik dashboard Overview
 * @param {Object} data 
 * @returns {Object}
 */
export function extractOverviewMetrics(data) {
  return {
    totalActiveStudents: formatNumber(data?.totalActiveStudents),
    totalGraduates: formatNumber(data?.totalGraduates),
    totalMbkmParticipants: formatNumber(data?.totalMbkmParticipants),
    averageGpa: formatGPA(data?.averageGpa),
  };
}

/**
 * Normalisasi metrik ringkasan Kelulusan (Graduates)
 * @param {Object} data 
 * @returns {Object}
 */
export function extractGraduatesSummary(data) {
  return {
    totalGraduates: formatNumber(data?.totalGraduates),
    averageGpa: formatGPA(data?.averageGpa),
    onTimeGraduationRate: formatPercent(data?.onTimeGraduationRate),
    studySuccessRate: formatPercent(data?.studySuccessRate),
  };
}

/**
 * Normalisasi metrik ringkasan MBKM
 * @param {Object} data 
 * @returns {Object}
 */
export function extractMbkmSummary(data) {
  return {
    totalParticipants: formatNumber(data?.totalParticipants),
    totalPartners: formatNumber(data?.totalPartners),
    eligibleStudentsCount: formatNumber(data?.eligibleStudentsCount),
    conversionRate: formatPercent(data?.conversionRate),
  };
}

// ============================================================================
// 5. DEFAULT EXPORT
// ============================================================================

export default {
  // Formatting & Utilities
  formatNumber,
  formatPercent,
  formatGPA,
  formatDateIndo,
  getCurrentAcademicYear,

  // Student Logic
  extractStudentKpis,
  getStudentKpiSubtitles,
  getStudentActiveDescription,
  transformForeignTrend,
  transformIntakeTrend,
  transformDeclineHistory,

  // Module Normalizers
  extractOverviewMetrics,
  extractGraduatesSummary,
  extractMbkmSummary,
};
