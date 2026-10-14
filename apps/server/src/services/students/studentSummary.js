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
const prisma = require('../../config/prisma');
const { buildStudentFilter, getSelectedAcademicYear, FILTER_SCOPES } = require('./filterBuilder');
const { parseStatusSelection, DEFAULT_STATUS } = require('./snapshotConditions');
const { getTotalActiveStudents } = require('./activeStudents');
const { getInternationalStudentsTrend } = require('./internationalTrend');
const { getIntakeYearCounts, buildIntakeRow, buildIntakeTrend } = require('./intakeTrend');
const { getNewStudentDecline } = require('./declineTrend');
const { parsePeriode } = require('../../utils/academicUtils');
const { rate } = require('../../utils/percentageUtils');
const { toArray } = require('../shared/filterUtils');

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
/** COHORT: intake menghitung semua yang masuk, status keaktifan tidak membatasi. Semester dan angkatan memfilter intake. */
const INTAKE_SCOPE = tanpa('statusKeaktifan');
/** Tren penurunan kebal terhadap filter semester dan status keaktifan. */
const DECLINE_SCOPE = tanpa('statusKeaktifan', 'semester');
/** kewarganegaraan tidak memfilter WNA; tahunAjaran tetap memfilter populasi card. */
const FOREIGN_SCOPE = tanpa('kewarganegaraan');

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
  const selectedCohortYears = (toArray(query.angkatanTahun) || []).filter(
    (y) => typeof y === 'string' && /^\d{4}\/\d{4}$/.test(y),
  );
  const selectedSemesters = (toArray(query.semester) || [])
    .map((s) => (s === '9+' ? 9 : Number(s)))
    .filter((s) => Number.isInteger(s) && s > 0);

  const [activeStudentsCount, internationalTrend, yearCounts] = await Promise.all([
    getTotalActiveStudents(buildStudentFilter(query)),
    // Total WNA dipakai langsung dari agregat tren, tidak query ulang.
    getInternationalStudentsTrend(query),
    // Satu `groupBy` untuk semua tahun: kartu intake, deret tren, dan pembanding
    // penurunan semuanya dibaca dari peta ini — tidak ada query susulan.
    getIntakeYearCounts(query),
  ]);

  const intakeTrend = buildIntakeTrend(yearCounts, selectedAcademicYear);
  const newStudentDecline = getNewStudentDecline(
    selectedAcademicYear,
    yearCounts,
    selectedCohortYears,
  );

  // Kartu intake mengikuti angkatan terpilih bila ada; bila tidak, mengikuti
  // tahun ajaran yang dipilih atau tahun terakhir pada rolling trend.
  // Jika ada filter semester, query langsung dari data mahasiswa di semester
  // tersebut — bukan menebak dengan rumus matematika.
  let latestIntake;
  let intakeCohortCount;
  let intakePeriod;
  let intakeSemesterTerm = null;

  if (selectedSemesters.length > 0) {
    // Identifikasi periodeMasuk mahasiswa aktif pada semester terpilih, lalu
    // hitung TOTAL mahasiswa baru (seluruh status, scope COHORT) yang masuk
    // pada periodeMasuk tersebut — bukan hanya yang saat ini aktif.
    const activeFilter = buildStudentFilter(query);
    const activeGroups = await prisma.student.groupBy({
      by: ['semester', 'periodeMasuk'],
      where: activeFilter,
      _count: { nim: true },
    });

    // periodeMasuk dominan per semester yang dipilih.
    const targetPeriods = new Set();
    const periodStats = [];
    selectedSemesters.forEach((sem) => {
      const forSem = activeGroups.filter((g) => g.semester === Number(sem));
      if (forSem.length > 0) {
        forSem.sort((a, b) => b._count.nim - a._count.nim);
        targetPeriods.add(forSem[0].periodeMasuk);
        periodStats.push(forSem[0].periodeMasuk);
      }
    });

    if (targetPeriods.size > 0) {
      // Hitung total intake pada periodeMasuk tersebut (scope COHORT: seluruh status).
      const cohortFilter = buildStudentFilter(query, { scope: FILTER_SCOPES.COHORT });
      delete cohortFilter.semester; // jangan filter semester pada populasi intake

      const intakeRows = await prisma.student.groupBy({
        by: ['periodeMasuk'],
        where: { ...cohortFilter, periodeMasuk: { in: [...targetPeriods] } },
        _count: { nim: true },
      });

      intakeCohortCount = intakeRows.reduce((sum, r) => sum + r._count.nim, 0);

      if (selectedSemesters.length === 1) {
        const parsed = parsePeriode(periodStats[0]);
        intakePeriod = parsed?.academicYear || null;
        intakeSemesterTerm = parsed ? (parsed.isGanjil ? 'Ganjil' : 'Genap') : null;
      } else {
        intakePeriod = 'terpilih';
      }
    } else {
      intakeCohortCount = 0;
      intakePeriod = selectedSemesters.length === 1 ? null : 'terpilih';
    }
  } else if (selectedCohortYears.length === 1) {
    latestIntake = buildIntakeRow(selectedCohortYears[0], yearCounts);
    intakeCohortCount = latestIntake.intakeCount;
    intakePeriod = selectedCohortYears[0];
  } else if (selectedCohortYears.length > 1) {
    intakeCohortCount = selectedCohortYears.reduce(
      (sum, yr) => sum + (yearCounts.get(yr)?.total ?? 0),
      0,
    );
    intakePeriod = 'terpilih';
  } else {
    latestIntake = selectedAcademicYear
      ? buildIntakeRow(selectedAcademicYear, yearCounts)
      : intakeTrend[intakeTrend.length - 1];
    intakeCohortCount = latestIntake?.intakeCount ?? 0;
    intakePeriod = latestIntake?.tahun || null;
  }

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
      intakeCohortCount,
      declinePercentage: hasEnoughDeclineData ? declinePercentage : null,
      isFluctuationPositive: hasEnoughDeclineData && declinePercentage >= 0,
      intakePeriod,
      intakeSemesterTerm,
      declinePeriod: newStudentDecline?.selectedPeriod || null,
      declineYearsCount: newStudentDecline?.yearsCount ?? 5,
      hasEnoughDeclineData,
    },
    kpiFilterScope: {
      active: POPULATION_PARAMS,
      foreign: FOREIGN_SCOPE,
      intake: INTAKE_SCOPE,
      decline: DECLINE_SCOPE,
    },
  };
}

module.exports = { getStudentSummary };
