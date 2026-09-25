/**
 * intakeTrend.js
 * 
 * Menghitung jumlah mahasiswa baru (intake) aktif per tahun akademik
 * beserta breakdown semester Ganjil vs Genap.
 */

const prisma = require('../../config/prisma');
const { toAcademicYear, get5YearRollingAcademicYears } = require('../../utils/academicUtils');

async function getIntakeTrend(baseFilter = {}) {
    // Pastikan perhitungan intake historis mencerminkan semua mahasiswa yang diterima (intake admissions)
    // tanpa terbatasi oleh status keaktifan saat ini jika bukan filter eksplisit
    const queryFilter = { ...baseFilter };
    delete queryFilter.statusKeaktifan;

    const students = await prisma.student.findMany({
        where: queryFilter,
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

        const normalizedPeriod = String(s.periodeMasuk ?? '').trim();
        const termDigit = normalizedPeriod.substring(4, 5);
        if (termDigit === '1') {
            counts.ganjil += 1;
        } else if (termDigit === '2') {
            counts.genap += 1;
        } else {
            counts.ganjil += 1;
        }
    }

    const availableYears = Array.from(yearlyMap.keys());
    const rollingYears = get5YearRollingAcademicYears(availableYears);

    const rawTrend = rollingYears.map(year => {
        const item = yearlyMap.get(year) || { total: 0, ganjil: 0, genap: 0 };
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
        let hasPrev = false;

        if (index > 0) {
            const prevCount = rawTrend[index - 1].intakeCount;
            if (prevCount > 0) {
                growth = (item.intakeCount - prevCount) / prevCount;
                const pct = (growth * 100).toFixed(2);
                growthLabel = `${growth >= 0 ? '+' : ''}${pct}%`;
                hasPrev = true;
            } else if (item.intakeCount > 0) {
                growth = 1.0;
                growthLabel = '+100.00%';
                hasPrev = true;
            }
        } else {
            // Untuk tahun pertama di jendela 5 tahun, periksa apakah ada data 1 tahun sebelumnya di database (yearlyMap)
            const currentYearStart = parseInt(item.tahun.split('/')[0]);
            const prevAcadYear = `${currentYearStart - 1}/${currentYearStart}`;
            if (yearlyMap.has(prevAcadYear)) {
                const prevCount = yearlyMap.get(prevAcadYear).total;
                if (prevCount > 0) {
                    growth = (item.intakeCount - prevCount) / prevCount;
                    const pct = (growth * 100).toFixed(2);
                    growthLabel = `${growth >= 0 ? '+' : ''}${pct}%`;
                    hasPrev = true;
                }
            }
        }

        return {
            tahun: item.tahun,
            intakeCount: item.intakeCount,
            intakeCountFormatted: `${new Intl.NumberFormat('id-ID').format(item.intakeCount)} mhs`,
            growth: growthLabel,
            growthFormatted: growthLabel,
            rawGrowth: growth,
            isPositive: growth >= 0
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

async function getIntakeForYear(yearStr, baseFilter = {}) {
    if (!yearStr) return 0;
    const startYear = parseInt(yearStr.split('/')[0]);
    if (isNaN(startYear)) return 0;

    const queryFilter = { ...baseFilter };
    delete queryFilter.statusKeaktifan;

    return prisma.student.count({
        where: {
            ...queryFilter,
            periodeMasuk: { startsWith: `${startYear}` }
        }
    });
}

module.exports = { getIntakeTrend, getIntakeForYear };
