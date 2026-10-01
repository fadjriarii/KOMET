/** Calculates new-student intake trends in the database, not application memory. */
const prisma = require('../../config/prisma');
const { toAcademicYear, get5YearRollingAcademicYears } = require('../../utils/academicUtils');
const { calculatePercentageChange } = require('../../utils/trendCalculation');
const { buildStatelessFilter } = require('./filterBuilder');

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

// Backward compatibility alias
function calculateGrowth(currentCount, previousCount, decimals = 2) {
    return calculatePercentageChange(currentCount, previousCount, decimals);
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
    const queryFilter = buildStatelessFilter(baseFilter);

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

        // Handle case where growth calculation returns null (invalid state)
        const growthLabel = (growth && growth.label !== null && growth.label !== undefined)
            ? growth.label
            : '0.00%';
        const chartGrowthLabel = (chartGrowth && chartGrowth.label !== null && chartGrowth.label !== undefined)
            ? chartGrowth.label
            : '0.00%';

        trend.push({
            tahun: item.tahun,
            intakeCount: item.intakeCount,
            intakeCountFormatted: `${formatter.format(item.intakeCount)} mhs`,
            growth: growthLabel,
            growthFormatted: growthLabel,
            rawGrowth: growth ? (growth.rawGrowth ?? 0) : 0,
            isPositive: (!isNaN(growth?.rawGrowth ?? 0) && growth?.rawGrowth >= 0),
        });
        rechartsData.push({
            tahun: item.tahun,
            intakeCount: item.intakeCount,
            value: Number(chartGrowthLabel),
            label: chartGrowthLabel,
            growth: chartGrowthLabel,
            ganjil: item.ganjil,
            ganjilPct: Math.round((item.ganjil / total) * 100),
            genap: item.genap,
            genapPct: Math.round((item.genap / total) * 100),
        });
    });
    return { trend, rechartsData };
}

function withIntakeYears(baseFilter, startYears) {
    const where = buildStatelessFilter(baseFilter);
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

module.exports = { getIntakeTrend, getIntakeForYear, getIntakeCountsForYears, calculateGrowth, calculatePercentageChange };