const prisma = require('../../config/prisma');
const { buildStudentFilter, FILTER_SCOPES } = require('./filterBuilder');
const { parsePeriode } = require('../../utils/academicUtils');
const { toArray } = require('@komet/shared/filterUtils');
const { buildIntakeRow } = require('./intakeTrend');

/**
 * Kartu intake mengikuti angkatan terpilih bila ada; bila tidak, mengikuti
 * tahun ajaran yang dipilih atau tahun terakhir pada rolling trend.
 * Jika ada filter semester, query langsung dari data mahasiswa di semester
 * tersebut — bukan menebak dengan rumus matematika.
 */
async function resolveIntakeCard(
  query,
  selectedAcademicYear,
  selectedCohortYears,
  selectedSemesters,
  yearCounts,
  intakeTrend,
) {
  // Identifikasi periodeMasuk mahasiswa aktif pada semester terpilih, lalu
  // hitung TOTAL mahasiswa baru (seluruh status, scope COHORT) yang masuk
  // pada periodeMasuk tersebut — bukan hanya yang saat ini aktif.
  if (selectedSemesters.length > 0) {
    return resolveSemesterIntake(query, selectedSemesters);
  }
  if (selectedCohortYears.length === 1) {
    const latestIntake = buildIntakeRow(selectedCohortYears[0], yearCounts);
    return {
      latestIntake,
      intakeCohortCount: latestIntake.intakeCount,
      intakePeriod: selectedCohortYears[0],
      intakeSemesterTerm: null,
    };
  }
  if (selectedCohortYears.length > 1) {
    return {
      latestIntake: undefined,
      intakeCohortCount: selectedCohortYears.reduce(
        (sum, yr) => sum + (yearCounts.get(yr)?.total ?? 0),
        0,
      ),
      intakePeriod: 'terpilih',
      intakeSemesterTerm: null,
    };
  }
  const latestIntake = selectedAcademicYear
    ? buildIntakeRow(selectedAcademicYear, yearCounts)
    : intakeTrend[intakeTrend.length - 1];
  return {
    latestIntake,
    intakeCohortCount: latestIntake?.intakeCount ?? 0,
    intakePeriod: latestIntake?.tahun || null,
    intakeSemesterTerm: null,
  };
}

async function resolveSemesterIntake(query, selectedSemesters) {
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

  if (targetPeriods.size === 0) {
    return {
      latestIntake: undefined,
      intakeCohortCount: 0,
      intakePeriod: selectedSemesters.length === 1 ? null : 'terpilih',
      intakeSemesterTerm: null,
    };
  }

  // Hitung total intake pada periodeMasuk tersebut (scope COHORT: seluruh status).
  const cohortFilter = buildStudentFilter(query, { scope: FILTER_SCOPES.COHORT });
  delete cohortFilter.semester; // jangan filter semester pada populasi intake

  const intakeRows = await prisma.student.groupBy({
    by: ['periodeMasuk'],
    where: { ...cohortFilter, periodeMasuk: { in: [...targetPeriods] } },
    _count: { nim: true },
  });

  if (selectedSemesters.length === 1) {
    const parsed = parsePeriode(periodStats[0]);
    return {
      latestIntake: undefined,
      intakeCohortCount: intakeRows.reduce((sum, r) => sum + r._count.nim, 0),
      intakePeriod: parsed?.academicYear || null,
      intakeSemesterTerm: parsed ? (parsed.isGanjil ? 'Ganjil' : 'Genap') : null,
    };
  }
  return {
    latestIntake: undefined,
    intakeCohortCount: intakeRows.reduce((sum, r) => sum + r._count.nim, 0),
    intakePeriod: 'terpilih',
    intakeSemesterTerm: null,
  };
}

function parseSelectedCohortYears(query) {
  return (toArray(query.angkatanTahun) || []).filter(
    (y) => typeof y === 'string' && /^\d{4}\/\d{4}$/.test(y),
  );
}

function parseSelectedSemesters(query) {
  return (toArray(query.semester) || [])
    .map((s) => (s === '9+' ? 9 : Number(s)))
    .filter((s) => Number.isInteger(s) && s > 0);
}

module.exports = { resolveIntakeCard, parseSelectedCohortYears, parseSelectedSemesters };
