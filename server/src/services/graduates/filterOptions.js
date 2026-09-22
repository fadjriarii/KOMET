/**
 * filterOptions.js
 * 
 * Mengambil opsi yang tersedia untuk dropdown dan checkbox filter tab kelulusan dari DB.
 */

const prisma = require('../../config/prisma');

let graduatesFilterCache = null;
let graduatesFilterCacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 Menit

async function getGraduateFilterOptions(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && graduatesFilterCache && (now - graduatesFilterCacheTime < CACHE_TTL_MS)) {
        return graduatesFilterCache;
    }

    const [prodiRes, tahunRes, periodeWisudaRes, statusRes, fakultasRes, periodeMasukRes, jenjangRes] = await Promise.all([
        prisma.student.findMany({
            where: { graduate: { isNot: null } },
            select: { programStudi: true },
            distinct: ['programStudi']
        }),
        prisma.graduate.findMany({ select: { tahunLulus: true }, distinct: ['tahunLulus'] }),
        prisma.graduate.findMany({ select: { periodeWisuda: true }, distinct: ['periodeWisuda'] }),
        prisma.graduate.findMany({ select: { statusKelulusan: true }, distinct: ['statusKelulusan'] }),
        prisma.student.findMany({
            where: { graduate: { isNot: null } },
            select: { fakultas: true },
            distinct: ['fakultas']
        }),
        prisma.student.findMany({
            where: { graduate: { isNot: null } },
            select: { periodeMasuk: true },
            distinct: ['periodeMasuk']
        }),
        prisma.graduate.findMany({ select: { jenjang: true }, distinct: ['jenjang'] })
    ]);

    graduatesFilterCache = {
        programStudi: prodiRes.map(r => r.programStudi).filter(Boolean).sort(),
        tahunLulus: tahunRes.map(r => r.tahunLulus).filter(Boolean).sort().reverse(),
        periodeWisuda: periodeWisudaRes.map(r => r.periodeWisuda).filter(Boolean).sort().reverse(),
        statusKelulusan: statusRes.map(r => r.statusKelulusan).filter(v => v && v !== 'Aktif').sort(),
        fakultas: fakultasRes.map(r => r.fakultas).filter(Boolean).sort(),
        periodeMasuk: periodeMasukRes.map(r => r.periodeMasuk).filter(Boolean).sort().reverse(),
        jenjang: jenjangRes.map(r => r.jenjang).filter(v => v === 'S1' || v === 'S2').sort()
    };
    graduatesFilterCacheTime = now;

    return graduatesFilterCache;
}

module.exports = { getGraduateFilterOptions };
