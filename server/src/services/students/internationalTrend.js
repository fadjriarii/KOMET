/**
 * internationalTrend.js
 * 
 * Menghitung tren mahasiswa asing (WNA) aktif per tahun akademik beserta persentasenya
 * dan sebaran negara.
 */

const prisma = require('../../config/prisma');
const { toAcademicYear } = require('../../utils/academicUtils');

/**
 * Hitung tren mahasiswa WNA aktif per tahun akademik (longitudinal trend) & breakdown per negara.
 */
async function getInternationalStudentsTrend(baseFilter) {
    const students = await prisma.student.findMany({
        where: {
            ...baseFilter,
            statusKeaktifan: 'Aktif'
        },
        select: { periodeMasuk: true, kewarganegaraan: true }
    });

    const byYear = {};
    const countryMap = {};
    let totalWna = 0;

    students.forEach(s => {
        const year = toAcademicYear(s.periodeMasuk);
        if (year) {
            if (!byYear[year]) byYear[year] = { total: 0, wna: 0 };
            byYear[year].total++;
            if (s.kewarganegaraan === 'WNA') {
                byYear[year].wna++;
            }
        }

        if (s.kewarganegaraan === 'WNA') {
            totalWna++;
            const country = 'WNA';
            countryMap[country] = (countryMap[country] || 0) + 1;
        }
    });

    const trendData = Object.entries(byYear)
        .map(([academicYear, data]) => {
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
                percentage: pct,
                rate: pct
            };
        })
        .sort((a, b) => a.academicYear.localeCompare(b.academicYear));

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
            statusKeaktifan: 'Aktif',
            kewarganegaraan: 'WNA'
        }
    });
}

module.exports = { getInternationalStudentsTrend, getTotalInternationalStudents };