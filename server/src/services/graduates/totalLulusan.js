/**
 * totalLulusan.js
 * 
 * Menghitung total mahasiswa lulus (S1 & S2) dalam rentang 5 tahun terakhir (dari tahun lalu).
 */

const prisma = require('../../config/prisma');
const { getYearRange } = require('../../utils/academicUtils');

async function getTotalLulusan(whereFilter) {
    const yearRange = getYearRange();
    const baseWhere = { ...whereFilter, tahunLulus: { in: yearRange } };

    const [s1, s2] = await Promise.all([
        prisma.graduate.count({ where: { ...baseWhere, jenjang: whereFilter.jenjang || 'S1' } }),
        prisma.graduate.count({ where: { ...baseWhere, jenjang: whereFilter.jenjang || 'S2' } })
    ]);

    if (whereFilter.jenjang === 'S1') return { s1, s2: null };
    if (whereFilter.jenjang === 'S2') return { s1: null, s2 };
    return { s1, s2 };
}

async function getTotalLulusanByYear(whereFilter) {
    const yearRange = getYearRange();

    const results = await prisma.graduate.groupBy({
        by: ['tahunLulus', 'jenjang'],
        where: { ...whereFilter, tahunLulus: { in: yearRange } },
        _count: true,
        orderBy: { tahunLulus: 'asc' }
    });

    const s1 = yearRange.map(tahun => {
        const found = results.find(r => r.tahunLulus === tahun && r.jenjang === 'S1');
        return { tahun, count: found ? found._count : 0 };
    });
    const s2 = yearRange.map(tahun => {
        const found = results.find(r => r.tahunLulus === tahun && r.jenjang === 'S2');
        return { tahun, count: found ? found._count : 0 };
    });

    return { s1, s2 };
}

module.exports = { getTotalLulusan, getTotalLulusanByYear, getYearRange };
