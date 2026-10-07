/** Calculates new-student intake trends in the database, not application memory. */
const prisma = require('../../config/prisma');
const {
  parsePeriode,
  getAcademicYearStart,
  get5YearRollingAcademicYears,
} = require('../../utils/academicUtils');
const { calculatePercentageChange } = require('../../utils/trendCalculation');
const { buildStudentFilter, FILTER_SCOPES } = require('./filterBuilder');

/**
 * Jumlah mahasiswa yang masuk per tahun akademik dari satu `groupBy` atas
 * seluruh periode masuk — termasuk tahun di luar jendela tren. Deret tren,
 * pembanding penurunan, dan kartu terpilih dibaca dari peta yang sama, jadi
 * tidak ada query tambahan per tahun.
 *
 * Status tidak membatasi intake (SCOPE COHORT): yang dihitung adalah semua
 * mahasiswa yang masuk pada tahun tersebut.
 *
 * @param {object} query Query parameter tervalidasi
 * @returns {Promise<Map<string, {total: number, ganjil: number, genap: number}>>}
 */
async function getIntakeYearCounts(query = {}) {
  const rows = await prisma.student.groupBy({
    by: ['periodeMasuk'],
    where: buildStudentFilter(query, { scope: FILTER_SCOPES.COHORT }),
    _count: { periodeMasuk: true },
  });

  const yearCounts = new Map();
  rows.forEach(({ periodeMasuk, _count }) => {
    const periode = parsePeriode(periodeMasuk);
    if (!periode) return;
    const count = _count.periodeMasuk;
    const current = yearCounts.get(periode.academicYear) || { total: 0, ganjil: 0, genap: 0 };
    current.total += count;
    current[periode.isGanjil ? 'ganjil' : 'genap'] += count;
    yearCounts.set(periode.academicYear, current);
  });
  return yearCounts;
}

/**
 * Satu deret, satu aturan: pertumbuhan dihitung hanya bila tahun akademik
 * sebelumnya ada di data — termasuk tahun tepat di luar jendela 5 tahun.
 * Baris tahun terpilih di kartu dibangun dengan fungsi yang sama, jadi angka
 * kartu dan angka chart tidak bisa berbeda.
 */
function buildIntakeRow(tahun, yearCounts) {
  const item = yearCounts.get(tahun) || { total: 0, ganjil: 0, genap: 0 };
  const previousStart = getAcademicYearStart(tahun) - 1;
  const previous = yearCounts.get(`${previousStart}/${previousStart + 1}`);
  const growth = calculatePercentageChange(item.total, previous?.total);

  return {
    tahun,
    intakeCount: item.total,
    ganjil: item.ganjil,
    genap: item.genap,
    growthPercentage: growth ? growth.rawGrowth * 100 : null,
    isPositive: !growth || growth.rawGrowth >= 0,
  };
}

function buildIntakeTrend(yearCounts) {
  return get5YearRollingAcademicYears([...yearCounts.keys()]).map((tahun) =>
    buildIntakeRow(tahun, yearCounts),
  );
}

async function getIntakeTrend(query = {}) {
  return { trend: buildIntakeTrend(await getIntakeYearCounts(query)) };
}

module.exports = {
  getIntakeTrend,
  getIntakeYearCounts,
  buildIntakeRow,
  buildIntakeTrend,
};
