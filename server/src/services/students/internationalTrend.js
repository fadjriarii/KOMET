/**
 * internationalTrend.js
 * 
 * Menghitung tren mahasiswa asing (WNA) aktif per tahun akademik beserta persentasenya
 * dan sebaran negara.
 */

const prisma = require('../../config/prisma');
const { toAcademicYear, get5YearRollingAcademicYears } = require('../../utils/academicUtils');

/**
 * Hitung tren mahasiswa WNA aktif per tahun akademik (longitudinal trend) & breakdown per negara.
 */
async function getInternationalStudentsTrend(baseFilter) {
    const students = await prisma.student.findMany({
        where: {
            ...baseFilter,
            ...(baseFilter.statusKeaktifan ? {} : { statusKeaktifan: 'Aktif' })
        },
        select: { periodeMasuk: true, kewarganegaraan: true }
    });

    const byYear = {};
    const countryMap = {};
    let totalWna = 0;

    students.forEach(s => {
        const year = toAcademicYear(s.periodeMasuk);
        const isWna = s.kewarganegaraan && s.kewarganegaraan !== 'Indonesia';

        if (year) {
            if (!byYear[year]) byYear[year] = { total: 0, wna: 0 };
            byYear[year].total++;
            if (isWna) {
                byYear[year].wna++;
            }
        }

        if (isWna) {
            totalWna++;
            const country = s.kewarganegaraan || 'WNA';
            countryMap[country] = (countryMap[country] || 0) + 1;
        }
    });

    const availableYears = Object.keys(byYear);
    const rollingYears = get5YearRollingAcademicYears(availableYears);

    const trendData = rollingYears.map((academicYear) => {
        const data = byYear[academicYear] || { total: 0, wna: 0 };
        const yr = academicYear.split('/')[0];
        const pct = data.total > 0
            ? parseFloat(((data.wna / data.total) * 100).toFixed(2))
            : 0;
        return {
            academicYear,
            cohortLabel: academicYear,
            year: yr,
            foreignActive: data.wna,
            foreignCount: data.wna,
            totalActive: data.total,
            totalCount: data.total,
            percentage: `${pct.toFixed(1)}%`,
            rate: pct
        };
    });

    const maxForeign = Math.max(...trendData.map(row => row.foreignActive), 1);
    trendData.forEach(row => {
        row.formattedForeignCount = `${new Intl.NumberFormat('id-ID').format(row.foreignActive)} mhs`;
        row.rawTotal = row.totalActive;
        row.rawRate = row.rate;
        row.barWidth = Math.min(100, Math.max(0, (row.foreignActive / maxForeign) * 100));
    });

    const byCountry = Object.entries(countryMap).map(([kewarganegaraan, count]) => ({
        kewarganegaraan,
        count
    }));

    return {
        total: totalWna,
        byCountry,
        trendData
    };
}

async function getTotalInternationalStudents(baseFilter) {
    return prisma.student.count({
        where: {
            ...baseFilter,
            ...(baseFilter.statusKeaktifan ? {} : { statusKeaktifan: 'Aktif' }),
            NOT: {
                kewarganegaraan: 'Indonesia'
            }
        }
    });
}

module.exports = { getInternationalStudentsTrend, getTotalInternationalStudents };
