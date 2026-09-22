/**
 * ipkTrend.js
 * 
 * Menghitung rata-rata IPK lulusan (S1 & S2) serta breakdown per tahun, prodi, fakultas, dan gpaBands.
 */

const prisma = require('../../config/prisma');
const { getYearRange } = require('../../utils/academicUtils');

async function getAvgIpk(whereFilter) {
    const yearRange = getYearRange();
    const baseWhere = { ...whereFilter, tahunLulus: { in: yearRange } };

    const [s1Agg, s2Agg] = await Promise.all([
        prisma.graduate.aggregate({
            where: { ...baseWhere, jenjang: 'S1' },
            _avg: { ipk: true },
            _count: true
        }),
        prisma.graduate.aggregate({
            where: { ...baseWhere, jenjang: 'S2' },
            _avg: { ipk: true },
            _count: true
        })
    ]);

    const s1Average = s1Agg._avg.ipk !== null ? parseFloat(s1Agg._avg.ipk.toFixed(2)) : 0;
    const s2Average = s2Agg._avg.ipk !== null ? parseFloat(s2Agg._avg.ipk.toFixed(2)) : 0;

    const s1 = { average: s1Average, count: s1Agg._count };
    const s2 = { average: s2Average, count: s2Agg._count };

    if (whereFilter.jenjang === 'S1') return { s1, s2: { average: 0, count: 0 } };
    if (whereFilter.jenjang === 'S2') return { s1: { average: 0, count: 0 }, s2 };
    return { s1, s2 };
}

async function getIpkByYear(whereFilter) {
    const yearRange = getYearRange();
    const results = await prisma.graduate.groupBy({
        by: ['tahunLulus', 'jenjang'],
        where: { ...whereFilter, tahunLulus: { in: yearRange } },
        _avg: { ipk: true },
        _count: true,
        orderBy: { tahunLulus: 'asc' }
    });

    const byYearS1 = yearRange.map(tahun => {
        const found = results.find(r => r.tahunLulus === tahun && r.jenjang === 'S1');
        return {
            tahun,
            avgIpk: found && found._avg.ipk !== null ? parseFloat(found._avg.ipk.toFixed(2)) : null,
            count: found ? found._count : 0
        };
    });
    const byYearS2 = yearRange.map(tahun => {
        const found = results.find(r => r.tahunLulus === tahun && r.jenjang === 'S2');
        return {
            tahun,
            avgIpk: found && found._avg.ipk !== null ? parseFloat(found._avg.ipk.toFixed(2)) : null,
            count: found ? found._count : 0
        };
    });

    return { byYearS1, byYearS2 };
}

/**
 * Mendapatkan breakdown IPK untuk GpaOverviewView.jsx:
 * - prodiGpaData: [{ name, gpaValue }]
 * - facultyGpaData: [{ name, gpaValue }]
 * - gpaBandsData: [{ range: "3.51 - 3.75", count }]
 */
async function getIpkOverview(whereFilter) {
    const yearRange = getYearRange();
    
    const results = await prisma.graduate.findMany({
        where: { ...whereFilter, tahunLulus: { in: yearRange } },
        select: {
            ipk: true,
            student: { select: { programStudi: true, fakultas: true } }
        }
    });

    const prodiMap = {};
    const facultyMap = {};
    const bandsMap = {
        "< 2.75": 0,
        "2.75 - 3.00": 0,
        "3.01 - 3.50": 0,
        "3.51 - 3.75": 0,
        "3.76 - 4.00": 0
    };

    results.forEach(g => {
        const prodi = g.student?.programStudi || 'Unknown';
        const faculty = g.student?.fakultas || 'Unknown';
        const ipk = g.ipk;

        // Prodi Map
        if (!prodiMap[prodi]) prodiMap[prodi] = { total: 0, sum: 0 };
        prodiMap[prodi].total++;
        prodiMap[prodi].sum += ipk;

        // Faculty Map
        if (!facultyMap[faculty]) facultyMap[faculty] = { total: 0, sum: 0 };
        facultyMap[faculty].total++;
        facultyMap[faculty].sum += ipk;

        // GPA Bands
        if (ipk < 2.75) bandsMap["< 2.75"]++;
        else if (ipk <= 3.00) bandsMap["2.75 - 3.00"]++;
        else if (ipk <= 3.50) bandsMap["3.01 - 3.50"]++;
        else if (ipk <= 3.75) bandsMap["3.51 - 3.75"]++;
        else bandsMap["3.76 - 4.00"]++;
    });

    const prodiGpaData = Object.entries(prodiMap).map(([name, { total, sum }]) => ({
        name,
        gpaValue: parseFloat((sum / total).toFixed(2)),
        count: total
    })).sort((a, b) => b.gpaValue - a.gpaValue);

    const facultyGpaData = Object.entries(facultyMap).map(([name, { total, sum }]) => ({
        name,
        gpaValue: parseFloat((sum / total).toFixed(2)),
        count: total
    })).sort((a, b) => b.gpaValue - a.gpaValue);

    const gpaBandsData = Object.entries(bandsMap).map(([range, count]) => ({
        range,
        count
    }));

    return { prodiGpaData, facultyGpaData, gpaBandsData };
}

module.exports = { getAvgIpk, getIpkByYear, getIpkOverview };
