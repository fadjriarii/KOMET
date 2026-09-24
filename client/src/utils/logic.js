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
 * Format angka ringkas untuk sumbu chart (e.g., 1.2k).
 * @pure
 */
export function formatCompactNumber(value) {
  const number = Number(value || 0);
  if (number >= 1000) {
    const decimals = number % 1000 === 0 ? 0 : 1;
    return `${(number / 1000).toFixed(decimals)}k`;
  }
  return number;
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
 * Generate teks narasi deskripsi untuk modal detail intake mahasiswa baru
 * @param {string} intakePeriod 
 * @param {string|number} intakeCountFormatted 
 * @returns {string}
 */
export function getStudentIntakeDescription(intakePeriod, intakeCountFormatted) {
  return `Intake mahasiswa baru mencatat total ${intakeCountFormatted} mahasiswa yang berhasil diterima dan terdaftar aktif pada semester 1 untuk tahun ajaran ${intakePeriod || 'aktif'}. Data riwayat ini merekam fluktuasi jumlah penerimaan mahasiswa baru per angkatan beserta laju pertumbuhannya dari waktu ke waktu.`;
}

/**
 * Generate teks narasi deskripsi dan rumus untuk modal penurunan mahasiswa baru (5 tahun)
 * @param {string} selectedPeriod 
 * @param {string|number} declineAvgFormatted 
 * @returns {string}
 */
export function getStudentDeclineDescription(selectedPeriod, declineAvgFormatted) {
  return `Penurunan jumlah mahasiswa baru dihitung selama periode 5 tahun bergulir (periode aktif ${selectedPeriod || 'aktif'}). Formula perhitungan: % Penurunan MB = average [((B-A)/A) + ((C-B)/B) + ((D-C)/C) + ((E-D)/D)], dengan A = Jumlah mahasiswa semester 1 status aktif periode dipilih, serta B, C, D, dan E berturut-turut adalah periode sebelumnya (pilihan-1 hingga pilihan-4). Rata-rata fluktuasi saat ini adalah ${declineAvgFormatted}.`;
}

/**
 * Format nilai KPI untuk ditampilkan — return null jika '-' atau kosong
 * @param {any} value 
 * @returns {any}
 */
export function formatKpiDisplay(value) {
  if (value === '-' || value === null || value === undefined || value === '') return null;
  return value;
}

/**
 * Balik urutan array tren tanpa mengubah array asli
 * @param {Array} trendList 
 * @returns {Array}
 */
export function reverseTrendData(trendList = []) {
  if (!Array.isArray(trendList)) return [];
  return [...trendList].reverse();
}

/**
 * Ambil payload aktif dari object Recharts Tooltip.
 * @pure
 */
export function getTooltipPayloadItem(payload = []) {
  if (!Array.isArray(payload) || payload.length === 0) return null;
  return payload[0]?.payload || null;
}

/**
 * Hitung tinggi chart distribusi berdasarkan jumlah bar.
 * @pure
 */
export function getDistributionChartHeight(itemCount = 0, minHeight = 240, rowHeight = 38) {
  return Math.max(minHeight, Number(itemCount || 0) * rowHeight);
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
 * Ambil raw trend mahasiswa asing dari payload summary.
 * @pure
 */
export function getForeignTrendSource(data) {
  const trend = data?.summary?.internationalStudentsTrend?.trend;
  return Array.isArray(trend) ? trend : [];
}

/**
 * Transformasi riwayat intake mahasiswa baru untuk tabel modal
 * @param {Array} trendList 
 * @returns {Array}
 */
export function transformIntakeTrend(trendList = []) {
  if (!Array.isArray(trendList)) return [];
  return trendList.map((row) => {
    const count = Number(row.intakeCount || 0);
    const growth = row.growth || '0.00%';
    const rawGrowth = Number(row.rawGrowth || 0);
    return {
      tahun: row.tahun || '-',
      intakeCount: count,
      intakeCountFormatted: `${formatNumber(count)} mhs`,
      growthFormatted: growth,
      rawGrowth,
      isPositive: rawGrowth >= 0,
      ganjil: Number(row.ganjil || 0),
      genap: Number(row.genap || 0),
    };
  });
}

/**
 * Ambil raw trend intake dari endpoint detail atau fallback summary.
 * @pure
 */
export function getIntakeTrendSource(intakeData, summaryData) {
  const source =
    intakeData?.data ||
    intakeData?.intakeTrendData ||
    summaryData?.summary?.intakeTrend?.trend ||
    [];
  return Array.isArray(source) ? source : [];
}

/**
 * Transformasi riwayat penurunan mahasiswa baru 5 tahun untuk tabel modal
 * @param {Array} historyList 
 * @returns {Array}
 */
export function transformDeclineHistory(historyList = []) {
  if (!Array.isArray(historyList)) return [];
  return historyList.map((row) => {
    const count = Number(row.intakeCount ?? row.absolutCount ?? 0);
    return {
      label: row.label || '',
      academicYear: row.academicYear || row.year || '-',
      intakeCount: count,
      intakeCountFormatted: `${formatNumber(count)} mhs`,
      changeFromPrev: row.changeFromPrev ?? row.deltaFormatted ?? '-',
    };
  });
}

/**
 * Ambil raw history penurunan mahasiswa baru dari endpoint detail atau fallback summary.
 * @pure
 */
export function getDeclineHistorySource(declineData, summaryData) {
  const source =
    declineData?.data?.history ||
    declineData?.declineTrend?.history ||
    declineData?.chartData ||
    summaryData?.summary?.newStudentDecline?.history ||
    [];
  return Array.isArray(source) ? source : [];
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

/**
 * Normalisasi seluruh distribusi detail mahasiswa aktif.
 * @pure
 */
export function transformActiveStudentDetail(detailData, totalActive = 0) {
  const effectiveTotal = detailData?.totalActiveStudents || totalActive;
  return {
    facultyList: transformFacultyDistribution(detailData?.byFaculty, effectiveTotal),
    prodiList: transformProdiDistribution(detailData?.byProdi, effectiveTotal),
    jenjangList: transformJenjangDistribution(detailData?.byJenjang, effectiveTotal),
  };
}

/**
 * Mendapatkan daftar 5 tahun angkatan terakhir (rolling 5 years).
 * Jika tahun berganti, tahun terlama otomatis hilang agar selalu menampilkan 5 tahun terakhir.
 * 
 * @param {Array} [rawAngkatanList=[]] - List angkatan dari backend jika tersedia
 * @param {number} [currentYear] - Tahun referensi (default tahun berjalan)
 * @returns {Array<string>} Array 5 tahun (e.g., ['2026', '2025', '2024', '2023', '2022'])
 */
export function getRollingFiveYears(rawAngkatanList = [], currentYear = new Date().getFullYear()) {
  const extractedYears = new Set();
  if (Array.isArray(rawAngkatanList)) {
    rawAngkatanList.forEach((item) => {
      const match = String(item).match(/\b(20\d{2})\b/);
      if (match) {
        extractedYears.add(parseInt(match[1], 10));
      }
    });
  }

  const maxYear = extractedYears.size > 0 
    ? Math.max(...Array.from(extractedYears))
    : currentYear;

  const years = [];
  for (let i = 0; i < 5; i++) {
    years.push(String(maxYear - i));
  }
  return years;
}

/**
 * Ekstraksi opsi filter mahasiswa lengkap dari response API backend
 * @param {Object} data - Response payload dari /api/students/summary atau /api/students/active-students
 * @returns {Object} { fakultasOptions, prodiOptions, angkatanOptions, rollingYears, semesterOptions, kewarganegaraanOptions, statusKeaktifanOptions, periodeMasukOptions }
 */
export function extractStudentFilterOptions(data) {
  const filterOptions = data?.filterOptions || {};

  // 1. Fakultas
  const rawFakultas = filterOptions.fakultas || (data?.byFaculty ? data.byFaculty.map((f) => f.name) : []);
  const fakultasOptions = Array.isArray(rawFakultas)
    ? rawFakultas.filter(Boolean)
    : [];

  // 2. Program Studi
  const rawProdi = filterOptions.programStudi || (data?.byProdi ? data.byProdi.map((p) => p.name) : []);
  const prodiOptions = Array.isArray(rawProdi)
    ? rawProdi.filter(Boolean)
    : [];

  // 3. Jenjang Studi (Sarjana S1, Profesi, Magister S2)
  const rawJenjang = filterOptions.jenjang || (data?.byJenjang ? data.byJenjang.map((j) => j.name) : []);
  const jenjangOptions = Array.isArray(rawJenjang) && rawJenjang.length > 0
    ? rawJenjang.filter(Boolean)
    : ['Sarjana (S1)', 'Prof', 'Magister (S2)'];

  // 4. Angkatan & 5 Rolling Years
  const rawAngkatan = Array.isArray(filterOptions.angkatan) ? filterOptions.angkatan : [];
  const rollingYears = getRollingFiveYears(rawAngkatan);

  // 5. Semester
  const rawSemester = Array.isArray(filterOptions.semester)
    ? filterOptions.semester
    : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
  const semesterOptions = rawSemester.map((s) => ({
    value: String(s),
    label: `Semester ${s}`,
  }));

  // 6. Kewarganegaraan
  const rawKewarganegaraan = Array.isArray(filterOptions.kewarganegaraan)
    ? filterOptions.kewarganegaraan
    : ['WNA', 'WNI'];
  const kewarganegaraanOptions = rawKewarganegaraan.map((k) => ({
    value: k,
    label: k === 'WNA' ? 'WNA (Asing)' : k === 'WNI' ? 'WNI (Indonesia)' : k,
  }));

  // 7. Status Keaktifan
  const rawStatus = Array.isArray(filterOptions.statusKeaktifan)
    ? filterOptions.statusKeaktifan
    : ['Aktif', 'Lulus', 'Drop Out / Dikeluarkan', 'Mengundurkan Diri / Keluar', 'Mutasi', 'Transfer', 'Lainnya'];
  const statusKeaktifanOptions = rawStatus.filter(Boolean);

  // 8. Periode Masuk (Ganjil / Genap - mengikuti tahun angkatan)
  const periodeMasukOptions = [
    { value: 'Ganjil', label: 'Ganjil' },
    { value: 'Genap', label: 'Genap' },
  ];

  return {
    fakultasOptions,
    prodiOptions,
    jenjangOptions,
    angkatanOptions: rawAngkatan,
    rollingYears,
    semesterOptions,
    kewarganegaraanOptions,
    statusKeaktifanOptions,
    periodeMasukOptions,
  };
}

/**
 * Petakan pilihan tahun angkatan (mis. ['2025']) ke nilai angkatan penuh
 * dari backend (mis. ['2025 Genap', '2025 Ganjil']).
 * @pure — siap dipindahkan ke backend service.
 */
export function mapAngkatanYearsToOptions(selectedYears = [], angkatanOptions = []) {
  if (!Array.isArray(selectedYears) || selectedYears.length === 0) return [];
  return angkatanOptions.filter((opt) =>
    selectedYears.some((year) => String(opt).startsWith(String(year)))
  );
}

/**
 * Susun query params untuk endpoint GET /api/students/students.
 * Hanya filter yang didukung backend yang dikirim (jenjang & periode
 * Ganjil/Genap tidak tersedia pada endpoint list).
 * @pure — siap dipindahkan ke backend service.
 */
export function buildStudentListQuery(
  {
    search = '',
    faculty = '',
    prodi = '',
    selectedYears = [],
    semester = '',
    nationality = '',
    status = '',
  } = {},
  angkatanOptions = [],
  { page = 1, limit = 10 } = {}
) {
  const angkatanValues = mapAngkatanYearsToOptions(selectedYears, angkatanOptions);

  const params = new URLSearchParams();
  const append = (key, value) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      params.append(key, String(value).trim());
    }
  };

  append('search', search);
  append('fakultas', faculty);
  append('programStudi', prodi);
  angkatanValues.forEach((a) => append('angkatan', a));
  append('semester', semester);
  append('kewarganegaraan', nationality);
  append('statusKeaktifan', status);
  params.set('page', String(page));
  params.set('limit', String(limit));

  return params;
}

/**
 * Buat key stabil untuk filter list tanpa page/limit.
 * @pure
 */
export function buildStudentListFilterKey(queryParams) {
  const withoutPage = new URLSearchParams(queryParams?.toString?.() || '');
  withoutPage.delete('page');
  withoutPage.delete('limit');
  return withoutPage.toString();
}

/**
 * Susun ulang query list dengan pagination terkini.
 * @pure
 */
export function rebuildStudentListParams(filterKey, page, limit) {
  const params = new URLSearchParams(filterKey);
  params.set('page', String(page));
  params.set('limit', String(limit));
  return params;
}

/**
 * Hitung jumlah filter mahasiswa aktif pada UI.
 * @pure
 */
export function getStudentActiveFilterCount(filters = {}) {
  const values = [
    Boolean(filters.search),
    Boolean(filters.faculty),
    Boolean(filters.prodi),
    Boolean(filters.jenjang),
    Array.isArray(filters.selectedYears) && filters.selectedYears.length > 0,
    Boolean(filters.semester),
    Boolean(filters.nationality),
    filters.status !== 'Aktif',
    Boolean(filters.periode),
  ];
  return values.filter(Boolean).length;
}

/**
 * Toggle pilihan tahun angkatan pada multi-select.
 * @pure
 */
export function toggleAngkatanYear(selectedYears = [], year) {
  const yearStr = String(year);
  if (selectedYears.includes(yearStr)) {
    return selectedYears.filter((selectedYear) => selectedYear !== yearStr);
  }
  return [...selectedYears, yearStr];
}

/**
 * Label trigger filter angkatan.
 * @pure
 */
export function getAngkatanDisplayText(selectedYears = [], placeholder = 'Pilih Tahun') {
  if (!Array.isArray(selectedYears) || selectedYears.length === 0) return placeholder;
  if (selectedYears.length === 1) return `Angkatan ${selectedYears[0]}`;
  if (selectedYears.length <= 2) return selectedYears.join(', ');
  return `${selectedYears.length} Tahun Terpilih`;
}

/**
 * Ambil posisi card pembuka modal dari event React.
 * @pure terhadap data event DOM yang diberikan.
 */
export function getModalOriginRectFromEvent(event) {
  const cardEl =
    event?.currentTarget?.closest?.('.stat-card') ||
    event?.currentTarget?.closest?.('div.bg-white') ||
    event?.currentTarget;
  if (!cardEl?.getBoundingClientRect) return null;
  const rect = cardEl.getBoundingClientRect();
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
}

/**
 * Pilih konten tab berdasarkan key aktif tanpa branching berulang di JSX.
 * @pure
 */
export function getActiveTabContent(activeTab, contentByKey = {}) {
  return contentByKey?.[activeTab] ?? null;
}

/**
 * Tentukan varian Badge untuk kolom Status Keaktifan tabel mahasiswa.
 * @pure
 */
export function getStatusBadgeVariant(status) {
  const value = String(status || '');
  if (value === 'Aktif') return 'success';
  if (value === 'Lulus' || value === 'Selesai Pendidikan Non Gelar') return 'primary';
  if (value.includes('Drop Out') || value.includes('Mengundurkan Diri')) return 'danger';
  return 'default';
}

/**
 * Normalisasi baris daftar mahasiswa untuk DataTable (key baris = NIM).
 * @pure — siap dipindahkan ke backend service.
 */
export function transformStudentListRows(rows = []) {
  return rows.map((row) => ({ ...row, id: row.nim }));
}

/**
 * Hitung nomor baris global pada tabel berpaginasi.
 * @pure
 */
export function getRowNumber(rowIndex, page = 1, limit = 10) {
  return (Math.max(1, Number(page) || 1) - 1) * (Number(limit) || 10) + rowIndex + 1;
}

/**
 * Hitung metadata pagination untuk table footer.
 * @pure
 */
export function getPaginationMeta({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  currentCount = 0,
} = {}) {
  const safePage = Math.max(1, Number(currentPage) || 1);
  const safeTotalPages = Math.max(1, Number(totalPages) || 1);
  const safePageSize = Math.max(1, Number(pageSize) || 10);
  const safeTotalItems = Math.max(0, Number(totalItems) || 0);
  const safeCurrentCount = Math.max(0, Number(currentCount) || 0);

  const startItem = safeTotalItems === 0 ? 0 : (safePage - 1) * safePageSize + 1;
  const endItem = safeTotalItems === 0
    ? 0
    : Math.min(startItem + safeCurrentCount - 1, safeTotalItems);

  return {
    currentPage: safePage,
    totalPages: safeTotalPages,
    totalItems: safeTotalItems,
    startItem,
    endItem,
    isFirstPage: safePage <= 1,
    isLastPage: safePage >= safeTotalPages,
    rangeLabel: `${formatNumber(startItem)}-${formatNumber(endItem)}`,
    totalLabel: formatNumber(safeTotalItems),
  };
}

/**
 * Buat daftar token pagination ringkas:
 * contoh current=34 total=124 => [1, 'ellipsis-left', 33, 34, 35, 'ellipsis-right', 124]
 * @pure
 */
export function getPaginationItems(currentPage = 1, totalPages = 1, siblingCount = 1) {
  const safeCurrent = Math.max(1, Number(currentPage) || 1);
  const safeTotal = Math.max(1, Number(totalPages) || 1);
  const safeSiblingCount = Math.max(0, Number(siblingCount) || 0);

  if (safeTotal <= 7) {
    return Array.from({ length: safeTotal }, (_, index) => index + 1);
  }

  const leftSibling = Math.max(2, safeCurrent - safeSiblingCount);
  const rightSibling = Math.min(safeTotal - 1, safeCurrent + safeSiblingCount);
  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < safeTotal - 1;
  const items = [1];

  if (showLeftEllipsis) {
    items.push('ellipsis-left');
  } else {
    for (let page = 2; page < leftSibling; page += 1) {
      items.push(page);
    }
  }

  for (let page = leftSibling; page <= rightSibling; page += 1) {
    items.push(page);
  }

  if (showRightEllipsis) {
    items.push('ellipsis-right');
  } else {
    for (let page = rightSibling + 1; page < safeTotal; page += 1) {
      items.push(page);
    }
  }

  items.push(safeTotal);
  return items;
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
  formatCompactNumber,
  formatPercent,
  formatGPA,
  formatDateIndo,
  getCurrentAcademicYear,

  // Student Logic
  extractStudentKpis,
  getStudentKpiSubtitles,
  getStudentActiveDescription,
  getStudentForeignDescription,
  getStudentIntakeDescription,
  getStudentDeclineDescription,
  formatKpiDisplay,
  reverseTrendData,
  getTooltipPayloadItem,
  getDistributionChartHeight,
  transformForeignTrend,
  getForeignTrendSource,
  transformIntakeTrend,
  getIntakeTrendSource,
  transformDeclineHistory,
  getDeclineHistorySource,
  transformFacultyDistribution,
  transformProdiDistribution,
  transformJenjangDistribution,
  transformActiveStudentDetail,
  getRollingFiveYears,
  extractStudentFilterOptions,
  mapAngkatanYearsToOptions,
  buildStudentListQuery,
  buildStudentListFilterKey,
  rebuildStudentListParams,
  getStudentActiveFilterCount,
  toggleAngkatanYear,
  getAngkatanDisplayText,
  getModalOriginRectFromEvent,
  getActiveTabContent,
  getStatusBadgeVariant,
  transformStudentListRows,
  getRowNumber,
  getPaginationMeta,
  getPaginationItems,

  // Module Normalizers
  extractOverviewMetrics,
  extractGraduatesSummary,
  extractMbkmSummary,
};
