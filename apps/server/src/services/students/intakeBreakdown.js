/**
 * intakeBreakdown.js
 *
 * Rincian modal Intake & Penurunan: intake per program studi, status saat ini
 * tiap angkatan masuk (retensi), dan penurunan per program studi. Satu
 * `groupBy` (periode masuk × prodi × status) dengan scope COHORT, sama
 * seperti kartu intake — status tidak membatasi siapa yang dihitung masuk.
 */
const prisma = require('../../config/prisma');
const { parsePeriode, getBounded5YearRollingAcademicYears } = require('../../utils/academicUtils');
const { buildStudentFilter, FILTER_SCOPES, getSelectedAcademicYear } = require('./filterBuilder');
const { getNewStudentDecline } = require('./declineTrend');
const { parseSelectedCohortYears } = require('./intakeCard');
const { rate } = require('../../utils/percentageUtils');

const byCountDesc = ([, a], [, b]) => b - a;

/**
 * @param {Array<{periodeMasuk, programStudi, statusKeaktifan, _count}>} rows
 * @param {string|null} selectedAcademicYear
 * @param {string[]} selectedCohortYears
 */
function buildIntakeBreakdown(rows, selectedAcademicYear = null, selectedCohortYears = []) {
  const prodiYears = new Map(); // prodi → Map(tahun → {total, ganjil, genap})
  const statusYears = new Map(); // tahun → Map(status → count)
  for (const { periodeMasuk, programStudi, statusKeaktifan, _count } of rows) {
    const periode = parsePeriode(periodeMasuk);
    if (!periode) continue;
    const count = _count.periodeMasuk;
    const prodi = programStudi || 'Lainnya';
    const status = statusKeaktifan || 'Lainnya';

    const years = prodiYears.get(prodi) || new Map();
    const year = years.get(periode.academicYear) || { total: 0, ganjil: 0, genap: 0 };
    year.total += count;
    year[periode.isGanjil ? 'ganjil' : 'genap'] += count;
    years.set(periode.academicYear, year);
    prodiYears.set(prodi, years);

    const statuses = statusYears.get(periode.academicYear) || new Map();
    statuses.set(status, (statuses.get(status) || 0) + count);
    statusYears.set(periode.academicYear, statuses);
  }

  // Jendela 5 tahun yang sama dengan tren intake (buildIntakeTrend).
  const window = getBounded5YearRollingAcademicYears(
    selectedAcademicYear ? [selectedAcademicYear] : [...statusYears.keys()],
  );
  const anchorYear = window[window.length - 1] || null;

  const byProdi = [...prodiYears.entries()]
    .map(([name, years]) => {
      const decline = getNewStudentDecline(anchorYear, years, selectedCohortYears);
      return {
        name,
        count: years.get(anchorYear)?.total || 0,
        years: Object.fromEntries(window.map((tahun) => [tahun, years.get(tahun)?.total || 0])),
        declinePercentage: Number.isFinite(decline?.declinePercentage)
          ? decline.declinePercentage
          : null,
        declineHistory: decline?.history || [],
      };
    })
    .filter((item) => Object.values(item.years).some((count) => count > 0))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  const anchorTotal = byProdi.reduce((sum, item) => sum + item.count, 0);
  for (const item of byProdi) item.percentage = rate(item.count, anchorTotal);

  const statusTotals = new Map();
  const statusByYear = window.map((tahun) => {
    const counts = statusYears.get(tahun) || new Map();
    for (const [status, count] of counts) {
      statusTotals.set(status, (statusTotals.get(status) || 0) + count);
    }
    return {
      tahun,
      total: [...counts.values()].reduce((sum, count) => sum + count, 0),
      byStatus: Object.fromEntries(counts),
    };
  });

  return {
    anchorYear,
    years: window,
    byProdi,
    statusByYear,
    statuses: [...statusTotals.entries()].sort(byCountDesc).map(([status]) => status),
  };
}

async function getIntakeBreakdown(query = {}) {
  const rows = await prisma.student.groupBy({
    by: ['periodeMasuk', 'programStudi', 'statusKeaktifan'],
    where: buildStudentFilter(query, { scope: FILTER_SCOPES.COHORT }),
    _count: { periodeMasuk: true },
  });
  return buildIntakeBreakdown(
    rows,
    getSelectedAcademicYear(query),
    parseSelectedCohortYears(query),
  );
}

module.exports = { getIntakeBreakdown, buildIntakeBreakdown };
