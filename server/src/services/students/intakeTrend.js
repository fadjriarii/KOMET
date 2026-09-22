/**
 * intakeTrend.js
 * 
 * Menghitung jumlah mahasiswa baru (intake) aktif per tahun akademik
 * beserta breakdown semester Ganjil vs Genap.
 */

const prisma = require('../../config/prisma');
const { toAcademicYear } = require('../../utils/academicUtils');

async function getIntakeTrend(baseFilter) {
    const students = await prisma.student.findMany({
        where: {
            ...baseFilter
        },
        select: { periodeMasuk: true }
    });

    const yearlyMap = new Map();

    for (const s of students) {
        const acadYear = toAcademicYear(s.periodeMasuk);
        if (!acadYear) continue;

        if (!yearlyMap.has(acadYear)) {
            yearlyMap.set(acadYear, { total: 0, ganjil: 0, genap: 0 });
        }
        const counts = yearlyMap.get(acadYear);
        counts.total += 1;

        const termDigit = s.periodeMasuk ? s.periodeMasuk.substring(4, 5) : '';
        if (termDigit === '2') {
            counts.ganjil += 1;
        } else if (termDigit === '1') {
            counts.genap += 1;
        } else {
            counts.ganjil += 1;
        }
    }

    const sortedYears = Array.from(yearlyMap.keys()).sort();

    const rawTrend = sortedYears.map(year => {
        const item = yearlyMap.get(year);
        return {
            tahun: year,
            intakeCount: item.total,
            ganjil: item.ganjil,
            genap: item.genap
        };
    });

    const trend = rawTrend.map((item, index) => {
        let growth = 0;
        let growthLabel = '0.00%';

        if (index > 0) {
            const prevCount = rawTrend[index - 1].intakeCount;
            if (prevCount > 0) {
                growth = (item.intakeCount - prevCount) / prevCount;
                const pct = (growth * 100).toFixed(2);
                growthLabel = `${growth >= 0 ? '+' : ''}${pct}%`;
            } else if (item.intakeCount > 0) {
                growth = 1.0;
                growthLabel = '+100.00%';
            }
        }

        return {
            tahun: item.tahun,
            intakeCount: item.intakeCount,
            growth: growthLabel,
            rawGrowth: growth
        };
    });

    const rechartsData = rawTrend.map((item, index) => {
        let growth = 0;
        let growthLabel = '0.0%';

        if (index > 0) {
            const prevCount = rawTrend[index - 1].intakeCount;
            if (prevCount > 0) {
                growth = (item.intakeCount - prevCount) / prevCount;
                const pct = (growth * 100).toFixed(1);
                growthLabel = `${growth >= 0 ? '+' : ''}${pct}%`;
            } else if (item.intakeCount > 0) {
                growth = 1.0;
                growthLabel = '+100.0%';
            }
        }

        const total = item.intakeCount || 1;
        const ganjilPct = Math.round((item.ganjil / total) * 100);
        const genapPct = Math.round((item.genap / total) * 100);

        return {
            tahun: item.tahun,
            intakeCount: item.intakeCount,
            value: parseFloat(growth.toFixed(4)),
            label: growthLabel,
            growth: growthLabel,
            ganjil: item.ganjil,
            ganjilPct,
            genap: item.genap,
            genapPct
        };
    });

    return { trend, rechartsData };
}

async function getIntakeForYear(yearStr, baseFilter) {
    if (!yearStr) return 0;
    const startYear = parseInt(yearStr.split('/')[0]);
    if (isNaN(startYear)) return 0;

    return prisma.student.count({
        where: {
            ...baseFilter,
            periodeMasuk: { startsWith: `${startYear}` }
        }
    });
}

module.exports = { getIntakeTrend, getIntakeForYear };