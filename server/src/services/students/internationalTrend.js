/** Aggregates international-student trends directly in MySQL. */
const prisma = require('../../config/prisma');
const { toAcademicYear, get5YearRollingAcademicYears } = require('../../utils/academicUtils');
const { ensurePopulationFilter } = require('./filterBuilder');

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

function addGroupedCount(map, periodeMasuk, count, key = 'total') {
    const year = toAcademicYear(periodeMasuk);
    if (!year) return;
    const item = map.get(year) || { total: 0, wna: 0 };
    item[key] += count;
    map.set(year, item);
}

async function getInternationalStudentsTrend(baseFilter = {}) {
    const populationWhere = getPopulationWhere(baseFilter);
    const wnaWhere = getInternationalWhere(baseFilter);
    const [totalRows, wnaRows] = await Promise.all([
        prisma.student.groupBy({
            by: ['periodeMasuk'],
            where: populationWhere,
            _count: { periodeMasuk: true },
        }),
        prisma.student.groupBy({
            by: ['periodeMasuk', 'kewarganegaraan'],
            where: wnaWhere,
            _count: { periodeMasuk: true },
        }),
    ]);

    const byYear = new Map();
    totalRows.forEach((row) => addGroupedCount(byYear, row.periodeMasuk, row._count.periodeMasuk));
    const countryMap = new Map();
    let totalWna = 0;
    wnaRows.forEach((row) => {
        const count = row._count.periodeMasuk;
        addGroupedCount(byYear, row.periodeMasuk, count, 'wna');
        totalWna += count;
        const country = row.kewarganegaraan || 'WNA';
        countryMap.set(country, (countryMap.get(country) || 0) + count);
    });

    const rollingYears = get5YearRollingAcademicYears([...byYear.keys()]);
    const trendData = rollingYears.map((academicYear) => {
        const item = byYear.get(academicYear) || { total: 0, wna: 0 };
        const rate = item.total ? Number(((item.wna / item.total) * 100).toFixed(2)) : 0;
        return {
            academicYear,
            cohortLabel: academicYear,
            year: academicYear.split('/')[0],
            foreignActive: item.wna,
            foreignCount: item.wna,
            totalActive: item.total,
            totalCount: item.total,
            percentage: `${rate.toFixed(1)}%`,
            rate,
        };
    });
    const maxForeign = Math.max(...trendData.map((row) => row.foreignActive), 1);
    const formatter = new Intl.NumberFormat('id-ID');
    trendData.forEach((row) => {
        row.formattedForeignCount = `${formatter.format(row.foreignActive)} mhs`;
        row.rawTotal = row.totalActive;
        row.rawRate = row.rate;
        row.barWidth = Math.min(100, Math.max(0, (row.foreignActive / maxForeign) * 100));
    });

    return {
        total: totalWna,
        byCountry: [...countryMap.entries()].map(([kewarganegaraan, count]) => ({ kewarganegaraan, count })),
        trendData,
    };
}

async function getTotalInternationalStudents(baseFilter) {
    return prisma.student.count({ where: getInternationalWhere(baseFilter) });
}

module.exports = { getInternationalStudentsTrend, getTotalInternationalStudents, getInternationalWhere };
