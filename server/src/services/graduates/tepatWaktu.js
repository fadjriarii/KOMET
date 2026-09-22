/**
 * tepatWaktu.js
 * 
 * Menghitung persentase & data komposit lulusan tepat waktu (OnTimeGraduationView.jsx).
 */

const prisma = require('../../config/prisma');
const { getYearRange, getReferenceYear } = require('../../utils/academicUtils');

const BATAS_STUDI = { S1: 4, S2: 2 };

async function getTepatWaktu(whereFilter) {
    const refYear = getReferenceYear();
    const graduates = await prisma.graduate.findMany({
        where: { ...whereFilter, tahunLulus: String(refYear) },
        select: {
            jenjang: true,
            tahunLulus: true,
            student: { select: { periodeMasuk: true } }
        }
    });

    const calcPct = (jenjang) => {
        const filtered = graduates.filter(g => g.jenjang === jenjang);
        if (filtered.length === 0) return null;
        const tepatWaktu = filtered.filter(g => {
            const tahunMasuk = parseInt(g.student?.periodeMasuk?.substring(0, 4));
            const lamaStudi = parseInt(g.tahunLulus) - tahunMasuk;
            return lamaStudi <= BATAS_STUDI[jenjang];
        }).length;
        return parseFloat(((tepatWaktu / filtered.length) * 100).toFixed(2));
    };

    return {
        s1: whereFilter.jenjang === 'S2' ? null : calcPct('S1'),
        s2: whereFilter.jenjang === 'S1' ? null : calcPct('S2'),
        referenceYear: refYear
    };
}

/**
 * Format data komposit untuk OnTimeGraduationView.jsx:
 * [{ cohort, cohortLabel, tahunLulusTepat, isIncomplete, rateFormatted, fastCount, onTimeCount, lateCount, intake }]
 */
async function getTepatWaktuByYear(whereFilter) {
    const yearRange = getYearRange();
    const graduates = await prisma.graduate.findMany({
        where: { ...whereFilter, tahunLulus: { in: yearRange } },
        select: {
            jenjang: true,
            tahunLulus: true,
            student: { select: { angkatan: true, periodeMasuk: true } }
        }
    });

    const buildCohortData = (jenjang) => {
        return yearRange.map(tahunStr => {
            const tahunLulusNum = parseInt(tahunStr);
            const batas = BATAS_STUDI[jenjang] || 4;
            const cohortNum = tahunLulusNum - batas;

            const filtered = graduates.filter(g => g.jenjang === jenjang && g.tahunLulus === tahunStr);
            
            let fastCount = 0;
            let onTimeCount = 0;
            let lateCount = 0;

            filtered.forEach(g => {
                const tahunMasuk = parseInt(g.student?.periodeMasuk?.substring(0, 4)) || (parseInt(g.student?.angkatan) || cohortNum);
                const lamaStudi = tahunLulusNum - tahunMasuk;
                if (lamaStudi < batas) fastCount++;
                else if (lamaStudi === batas) onTimeCount++;
                else lateCount++;
            });

            const totalGrad = filtered.length;
            const rate = totalGrad > 0 ? ((fastCount + onTimeCount) / totalGrad) * 100 : 0;

            return {
                cohort: cohortNum,
                cohortLabel: `Angkatan ${cohortNum}`,
                tahunLulusTepat: tahunLulusNum,
                isIncomplete: false,
                rateFormatted: `${rate.toFixed(1)}%`,
                fastCount,
                onTimeCount,
                lateCount,
                intake: totalGrad + 15 // perkiraan total intake
            };
        });
    };

    return {
        s1: buildCohortData('S1'),
        s2: buildCohortData('S2'),
        batasS1: BATAS_STUDI.S1,
        batasS2: BATAS_STUDI.S2
    };
}

module.exports = { getTepatWaktu, getTepatWaktuByYear };
