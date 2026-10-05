/** Aggregates international-student trends directly in MySQL. */
const prisma = require('../../config/prisma');
const { toAcademicYear, get5YearRollingAcademicYears } = require('../../utils/academicUtils');
const {
  ensurePopulationFilter,
  getAcademicYear,
  buildAcademicYearFilter,
} = require('./filterBuilder');

function getPopulationWhere(baseFilter = {}) {
  return ensurePopulationFilter(baseFilter);
}

function appendNot(where, condition) {
  const { NOT: existingNot, AND: existingAnd, ...rest } = where;
  return {
    ...rest,
    AND: [
      ...(existingAnd || []),
      ...(existingNot ? [{ NOT: existingNot }] : []),
      { NOT: condition },
    ],
  };
}

function getInternationalWhere(baseFilter = {}) {
  const where = appendNot(getPopulationWhere(baseFilter), { kewarganegaraan: 'Indonesia' });
  // Preserve the pre-groupBy business rule: a missing nationality is
  // unknown, not an international student.
  return {
    ...where,
    AND: [...(where.AND || []), { kewarganegaraan: { not: '' } }],
  };
}

function stripAcademicYearConditions(filter = {}) {
  const { AND, ...rest } = filter;
  if (!Array.isArray(AND)) return filter;
  const cleanAnd = AND.filter((cond) => {
    const str = JSON.stringify(cond);
    return !str.includes('periodeMasuk') && !str.includes('periodeTerakhir');
  });
  return cleanAnd.length ? { ...rest, AND: cleanAnd } : rest;
}

function getStatusValuesFromFilter(baseFilter = {}) {
  if (Array.isArray(baseFilter.AND)) {
    for (const cond of baseFilter.AND) {
      if (cond.statusKeaktifan) return cond.statusKeaktifan;
    }
  }
  if (baseFilter.statusKeaktifan) return baseFilter.statusKeaktifan;
  return ['Aktif'];
}

async function getInternationalStudentsTrend(baseFilter = {}) {
  const distinctPeriods = await prisma.student.findMany({
    select: { periodeMasuk: true },
    distinct: ['periodeMasuk'],
  });
  const availableAcademicYears = distinctPeriods
    .map((p) => toAcademicYear(p.periodeMasuk))
    .filter(Boolean);
  const rollingYears = get5YearRollingAcademicYears(availableAcademicYears);

  const cleanFilter = stripAcademicYearConditions(baseFilter);
  const statusValues = getStatusValuesFromFilter(baseFilter);

  const trendData = await Promise.all(
    rollingYears.map(async (academicYear) => {
      const ayObj = getAcademicYear(academicYear);
      if (!ayObj) {
        return {
          academicYear,
          cohortLabel: academicYear,
          year: academicYear.split('/')[0],
          foreignActive: 0,
          foreignCount: 0,
          totalActive: 0,
          totalCount: 0,
          rawTotal: 0,
          percentage: 0,
          rate: 0,
          rawRate: 0,
        };
      }

      const academicConditions = buildAcademicYearFilter(ayObj, statusValues);
      const yearBaseFilter = {
        ...cleanFilter,
        AND: [...(cleanFilter.AND || []), ...academicConditions],
      };
      const yearWnaFilter = getInternationalWhere(yearBaseFilter);

      const [totalActive, foreignActive] = await Promise.all([
        prisma.student.count({ where: yearBaseFilter }),
        prisma.student.count({ where: yearWnaFilter }),
      ]);

      const rate = totalActive > 0 ? Number(((foreignActive / totalActive) * 100).toFixed(2)) : 0;

      return {
        academicYear,
        cohortLabel: academicYear,
        year: academicYear.split('/')[0],
        foreignActive,
        foreignCount: foreignActive,
        totalActive,
        totalCount: totalActive,
        rawTotal: totalActive,
        percentage: rate,
        rate,
        rawRate: rate,
      };
    }),
  );

  const currentWnaWhere = getInternationalWhere(baseFilter);
  const [totalWna, wnaCountryRows] = await Promise.all([
    prisma.student.count({ where: currentWnaWhere }),
    prisma.student.groupBy({
      by: ['kewarganegaraan'],
      where: currentWnaWhere,
      _count: { kewarganegaraan: true },
    }),
  ]);

  const countryMap = wnaCountryRows.map((row) => ({
    kewarganegaraan: row.kewarganegaraan || 'WNA',
    count: row._count.kewarganegaraan,
  }));

  const maxForeign = Math.max(...trendData.map((row) => row.foreignActive), 1);
  trendData.forEach((row) => {
    row.barWidth = Math.min(100, Math.max(0, (row.foreignActive / maxForeign) * 100));
  });

  return {
    total: totalWna,
    byCountry: countryMap,
    trendData,
  };
}

async function getTotalInternationalStudents(baseFilter) {
  return prisma.student.count({ where: getInternationalWhere(baseFilter) });
}

module.exports = {
  getInternationalStudentsTrend,
  getTotalInternationalStudents,
  getInternationalWhere,
};
