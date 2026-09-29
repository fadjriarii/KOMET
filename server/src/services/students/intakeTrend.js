/** Calculates new-student intake trends in the database, not application memory. */
const prisma = require('../../config/prisma');
const { toAcademicYear, get5YearRollingAcademicYears } = require('../../utils/academicUtils');

function withoutAcademicSnapshot(where = {}) {
    const result = { ...where };
    if (Array.isArray(where.AND)) {
        result.AND = where.AND.filter((condition) => {
            if (condition?.periodeMasuk?.lte) return false;
            if (condition?.OR?.some((item) => item?.periodeTerakhir !== undefined)) return false;
            return true;
        });
        if (!result.AND.length) delete result.AND;
    }
    return result;
}

function calculateGrowth(currentCount, previousCount, decimals = 2) {
    if (previousCount > 0) {
        const rawGrowth = (currentCount - previousCount) / previousCount;
        return {
            rawGrowth,
            label: `${rawGrowth >= 0 ? '+' : ''}${(rawGrowth * 100).toFixed(decimals)}%`,
        };
    }
    if (currentCount > 0) return { rawGrowth: 1, label: `+${(100).toFixed(decimals)}%` };
    return { rawGrowth: 0, label: `${(0).toFixed(decimals)}%` };
}

function addGroupCount(yearlyMap, periodeMasuk, count) {
    const academicYear = toAcademicYear(periodeMasuk);
    if (!academicYear) return;
    const current = yearlyMap.get(academicYear) || { total: 0, ganjil: 0, genap: 0 };
    current.total += count;
    const term = String(periodeMasuk || '').trim().substring(4, 5);
    if (term === '2') current.genap += count;
    else current.ganjil += count;
    yearlyMap.set(academicYear, current);
}

async function getIntakeTrend(baseFilter = {}) {
    const queryFilter = withoutAcademicSnapshot(baseFilter);
    delete queryFilter.statusKeaktifan;

    const groupedRows = await prisma.student.groupBy({
        by: ['periodeMasuk'],
        where: queryFilter,
        _count: { periodeMasuk: true },
    });
    const yearlyMap = new Map();
    groupedRows.forEach((row) => addGroupCount(yearlyMap, row.periodeMasuk, row._count.periodeMasuk));

    const rollingYears = get5YearRollingAcademicYears([...yearlyMap.keys()]);
    const rawTrend = rollingYears.map((tahun) => {
        const item = yearlyMap.get(tahun) || { total: 0, ganjil: 0, genap: 0 };
        return { tahun, intakeCount: item.total, ganjil: item.ganjil, genap: item.genap };
    });

    const formatter = new Intl.NumberFormat('id-ID');
    const trend = [];
    const rechartsData = [];
    rawTrend.forEach((item, index) => {
        const previousCount = index > 0
            ? rawTrend[index - 1].intakeCount
            : yearlyMap.get(`${Number(item.tahun.slice(0, 4)) - 1}/${item.tahun.slice(0, 4)}`)?.total;
        const growth = calculateGrowth(item.intakeCount, previousCount, 2);
        const chartGrowth = calculateGrowth(item.intakeCount, index > 0 ? previousCount : undefined, 1);
        const total = item.intakeCount || 1;

        trend.push({
            tahun: item.tahun,
            intakeCount: item.intakeCount,
            intakeCountFormatted: `${formatter.format(item.intakeCount)} mhs`,
            growth: growth.label,
            growthFormatted: growth.label,
            rawGrowth: growth.rawGrowth,
            isPositive: growth.rawGrowth >= 0,
        });
        rechartsData.push({
            tahun: item.tahun,
            intakeCount: item.intakeCount,
            value: Number(chartGrowth.rawGrowth.toFixed(4)),
            label: chartGrowth.label,
            growth: chartGrowth.label,
            ganjil: item.ganjil,
            ganjilPct: Math.round((item.ganjil / total) * 100),
            genap: item.genap,
            genapPct: Math.round((item.genap / total) * 100),
        });
    });
    return { trend, rechartsData };
}

function withIntakeYears(baseFilter, startYears) {
    const where = withoutAcademicSnapshot(baseFilter);
    delete where.statusKeaktifan;
    return {
        ...where,
        AND: [
            ...(where.AND || []),
            { OR: startYears.map((year) => ({ periodeMasuk: { startsWith: String(year) } })) },
        ],
    };
}

async function getIntakeCountsForYears(yearStrings, baseFilter = {}) {
    const startYears = [...new Set(yearStrings
        .map((year) => Number.parseInt(String(year).split('/')[0], 10))
        .filter(Number.isInteger))];
    if (!startYears.length) return new Map();

    const rows = await prisma.student.groupBy({
        by: ['periodeMasuk'],
        where: withIntakeYears(baseFilter, startYears),
        _count: { periodeMasuk: true },
    });
    const counts = new Map(yearStrings.map((year) => [year, 0]));
    rows.forEach((row) => {
        const academicYear = toAcademicYear(row.periodeMasuk);
        if (counts.has(academicYear)) counts.set(academicYear, counts.get(academicYear) + row._count.periodeMasuk);
    });
    return counts;
}

async function getIntakeForYear(yearStr, baseFilter = {}) {
    if (!yearStr) return 0;
    const counts = await getIntakeCountsForYears([yearStr], baseFilter);
    return counts.get(yearStr) || 0;
}

module.exports = { getIntakeTrend, getIntakeForYear, getIntakeCountsForYears, calculateGrowth };
