/**
 * studentSummary.js
 *
 * Menyusun seluruh isi `GET /api/students/summary` — empat kartu KPI dan sumber
 * data chart detail. Controller tidak lagi menghitung apa pun: rasio, resolusi
 * tahun terpilih, dan bentuk respons hidup di sini.
 *
 * Kontrak filter tiap kartu dinyatakan lewat `FILTER_SCOPES` di dalam service
 * yang bersangkutan:
 * - kartu mahasiswa aktif + tabel : populasi (status + snapshot tahun terpilih)
 * - kartu WNA + chart tren asing  : populasi, jendela tahun dibangun sendiri
 * - kartu intake + penurunan      : COHORT (status tidak membatasi)
 */
const {
  buildStudentFilter,
  getSelectedAcademicYear,
  parseStatusSelection,
  DEFAULT_STATUS,
} = require('./filterBuilder');
const { getTotalActiveStudents } = require('./activeStudents');
const { getInternationalStudentsTrend } = require('./internationalTrend');
const { getIntakeYearCounts, buildIntakeRow, buildIntakeTrend } = require('./intakeTrend');
const { getNewStudentDecline } = require('./declineTrend');
const { rate } = require('../../utils/percentageUtils');

/**
 * Param query yang dibaca tiap kartu — dasar badge "Terfilter" di client, supaya
 * halaman tidak lagi mengklaim semua kartu ikut mempersempit angka.
 * `tanpa()` menyatakan selisih antar `FILTER_SCOPES` dalam satu tempat.
 */
const POPULATION_PARAMS = [
  'search',
  'fakultas',
  'programStudi',
  'jenjang',
  'angkatan',
  'angkatanTahun',
  'semester',
  'kewarganegaraan',
  'statusKeaktifan',
  'periodeMasuk',
  'tahunAjaran',
];
const tanpa = (...keys) => POPULATION_PARAMS.filter((key) => !keys.includes(key));
/** COHORT: intake menghitung semua yang masuk, status tidak membatasi. */
const TANPA_STATUS = tanpa('statusKeaktifan');
/** ALL_YEARS: tren membangun jendela tahunnya sendiri. */
const TANPA_TAHUN_AJARAN = tanpa('tahunAjaran');

/**
 * Fakta seleksi status untuk kartu mahasiswa aktif. `isCumulative` adalah aturan
 * proyeksi snapshot — status terminal terhitung "sampai" tahun akademik, Aktif
 * "pada" tahun akademik — yang dulu hidup di UI sebagai `status !== 'Aktif'`.
 */
function describeStatusSelection(statusValues) {
  const { isAll, statuses } = parseStatusSelection(statusValues);
  return {
    isAll,
    statuses,
    // "Semua status" juga kumulatif: parseStatusSelection mengirimkannya sebagai
    // statuses kosong, jadi isAll tidak bisa disimpulkan dari daftar itu.
    isCumulative: isAll || statuses.some((status) => status !== DEFAULT_STATUS),
  };
}

async function getStudentSummary(query = {}) {
  const selectedAcademicYear = getSelectedAcademicYear(query);

  const [activeStudentsCount, internationalTrend, yearCounts] = await Promise.all([
    getTotalActiveStudents(buildStudentFilter(query)),
    // Total WNA dipakai langsung dari agregat tren, tidak query ulang.
    getInternationalStudentsTrend(query),
    // Satu `groupBy` untuk semua tahun: kartu intake, deret tren, dan pembanding
    // penurunan semuanya dibaca dari peta ini — tidak ada query susulan.
    getIntakeYearCounts(query),
  ]);

  const intakeTrend = buildIntakeTrend(yearCounts);
  const newStudentDecline = getNewStudentDecline(selectedAcademicYear, yearCounts);

  // Kartu intake mengikuti tahun ajaran yang dipilih, bukan selalu tahun
  // terakhir pada rolling trend.
  const latestIntake = selectedAcademicYear
    ? buildIntakeRow(selectedAcademicYear, yearCounts)
    : intakeTrend[intakeTrend.length - 1];

  const foreignStudentsCount = internationalTrend.total;
  const declinePercentage = newStudentDecline?.declinePercentage;
  // A missing comparison baseline is materially different from a 0%
  // fluctuation. Keep that distinction in the API so the UI can explain
  // that the historical data is insufficient instead of implying a flat trend.
  const hasEnoughDeclineData = Number.isFinite(declinePercentage);
  const internationalTrendRows = internationalTrend.trendData;

  return {
    // `summary` hanya berisi sumber data chart detail; angka kartu tunggal
    // dikirim satu kali lewat `kpis`.
    summary: {
      intakeTrend: {
        latest: latestIntake || null,
        trend: intakeTrend,
      },
      newStudentDecline,
      internationalStudentsTrend: {
        // Sama persis dengan payload /students/international-detail (plus `latest`),
        // supaya jalur reuse-summary dan jalur lazy-fetch di klien membaca satu
        // struktur dan tidak perlu menamai ulang field di tengah perjalanan.
        ...internationalTrend,
        latest: internationalTrendRows[internationalTrendRows.length - 1] || null,
      },
    },
    // Flat kpis object persis sesuai harapan StudentsPage.jsx:
    kpis: {
      activeStudentsCount,
      activeStudentStatus: describeStatusSelection(query.statusKeaktifan),
      foreignRate: rate(foreignStudentsCount, activeStudentsCount),
      foreignStudentsCount,
      intakeCohortCount: latestIntake?.intakeCount ?? 0,
      declinePercentage: hasEnoughDeclineData ? declinePercentage : null,
      isFluctuationPositive: hasEnoughDeclineData && declinePercentage >= 0,
      intakePeriod: latestIntake?.tahun || null,
      declinePeriod: newStudentDecline?.selectedPeriod || null,
      hasEnoughDeclineData,
    },
    kpiFilterScope: {
      active: POPULATION_PARAMS,
      // Tren WNA membangun jendela tahunnya sendiri: tahun akademik terpilih
      // tidak memotong angkanya.
      foreign: TANPA_TAHUN_AJARAN,
      // Intake dan penurunan menghitung kohort yang masuk — status diabaikan.
      intake: TANPA_STATUS,
      decline: TANPA_STATUS,
    },
  };
}

module.exports = { getStudentSummary };
