/**
 * keberhasilanStudi.js
 * 
 * Menghitung persentase & data komposit cohort keberhasilan studi (StudySuccessView.jsx).
 */

const prisma = require('../../config/prisma');
const { getReferenceYear } = require('../../utils/academicUtils');

const BATAS_STUDI = { S1: 7, S2: 4 };

function getAngkatanEvaluasi(jenjang) {
    const refYear = getReferenceYear();
    return String(refYear - BATAS_STUDI[jenjang]);
}

async function getKeberhasilanStudi(whereFilter) {
    const angkatanS1 = getAngkatanEvaluasi('S1');
    const angkatanS2 = getAngkatanEvaluasi('S2');

    const studentWhere = whereFilter.student || {};

    const calcPct = async (angkatan, jenjang) => {
        const [total, lulus] = await Promise.all([
            prisma.student.count({
                where: { ...studentWhere, jenjang, periodeMasuk: { startsWith: angkatan } }
            }),
            prisma.student.count({
                where: { ...studentWhere, jenjang, periodeMasuk: { startsWith: angkatan }, statusKeaktifan: 'Lulus' }
            })
        ]);
        if (total === 0) return null;
        return {
            lulus, total,
            percentage: parseFloat(((lulus / total) * 100).toFixed(2))
        };
    };

    const [s1Data, s2Data] = await Promise.all([
        whereFilter.jenjang === 'S2' ? null : calcPct(angkatanS1, 'S1'),
        whereFilter.jenjang === 'S1' ? null : calcPct(angkatanS2, 'S2')
    ]);

    return {
        s1: s1Data ? s1Data.percentage : null,
        s2: s2Data ? s2Data.percentage : null,
        angkatanS1,
        angkatanS2
    };
}

async function getKeberhasilanStudiByAngkatan(whereFilter) {
    const studentWhere = whereFilter.student || {};

    const calcSeries = async (jenjang) => {
        const evalAngkatan = parseInt(getAngkatanEvaluasi(jenjang));
        const angkatanList = Array.from({ length: 5 }, (_, i) => String(evalAngkatan - 4 + i));

        return Promise.all(angkatanList.map(async (angkatanStr) => {
            const cohortNum = parseInt(angkatanStr) || angkatanStr;
            const [total, lulus] = await Promise.all([
                prisma.student.count({
                    where: { ...studentWhere, jenjang, periodeMasuk: { startsWith: angkatanStr } }
                }),
                prisma.student.count({
                    where: { ...studentWhere, jenjang, periodeMasuk: { startsWith: angkatanStr }, statusKeaktifan: 'Lulus' }
                })
            ]);

            const rate = total > 0 ? (lulus / total) * 100 : 0;
            return {
                angkatan: angkatanStr,
                cohort: cohortNum,
                cohortLabel: `Angkatan ${angkatanStr}`,
                isIncomplete: false,
                rateFormatted: `${rate.toFixed(1)}%`,
                successCount: lulus,
                lulus,
                total,
                intake: total,
                percentage: total > 0 ? parseFloat(rate.toFixed(2)) : null
            };
        }));
    };

    const targetJenjang = whereFilter.jenjang || 'S1';
    const byCohort = await calcSeries(targetJenjang === 'S2' ? 'S2' : 'S1');

    const [s1, s2] = await Promise.all([calcSeries('S1'), calcSeries('S2')]);
    return {
        byCohort,
        s1,
        s2,
        batasStudiS1: BATAS_STUDI.S1,
        batasStudiS2: BATAS_STUDI.S2,
        angkatanEvaluasiS1: getAngkatanEvaluasi('S1'),
        angkatanEvaluasiS2: getAngkatanEvaluasi('S2')
    };
}

module.exports = { getKeberhasilanStudi, getKeberhasilanStudiByAngkatan };
