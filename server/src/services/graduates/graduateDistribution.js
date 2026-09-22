/**
 * graduateDistribution.js
 * 
 * Menghitung tren lulusan per tahun (byYear) dan distribusi predikat kelulusan (byPredikat).
 */

const prisma = require('../../config/prisma');
const { getYearRange } = require('../../utils/academicUtils');
const { calculatePredikat } = require('../../utils/graduateUtils');

async function getGraduateDistribution(whereFilter) {
    const yearRange = getYearRange();
    
    const graduates = await prisma.graduate.findMany({
        where: { ...whereFilter, tahunLulus: { in: yearRange } },
        select: { tahunLulus: true, ipk: true, jenjang: true }
    });

    const yearMap = {};
    const predikatMap = {
        "Dengan Pujian (Cum Laude)": 0,
        "Sangat Memuaskan": 0,
        "Memuaskan": 0
    };

    graduates.forEach(g => {
        const yr = g.tahunLulus;
        yearMap[yr] = (yearMap[yr] || 0) + 1;

        const pred = calculatePredikat(g.ipk);
        predikatMap[pred] = (predikatMap[pred] || 0) + 1;
    });

    const byYear = yearRange.map(year => ({
        year,
        tahun: year,
        count: yearMap[year] || 0
    }));

    const totalGraduates = graduates.length;
    const byPredikat = Object.entries(predikatMap).map(([name, count]) => ({
        name,
        count,
        percentage: totalGraduates > 0 ? `${((count / totalGraduates) * 100).toFixed(1)}%` : "0%"
    }));

    return { total: totalGraduates, byYear, byPredikat };
}

module.exports = { getGraduateDistribution };
