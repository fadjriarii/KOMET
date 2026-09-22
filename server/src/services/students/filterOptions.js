const prisma = require('../../config/prisma');

let studentsFilterCache = null;
let studentsFilterCacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 Menit

async function getFilterOptions(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && studentsFilterCache && (now - studentsFilterCacheTime < CACHE_TTL_MS)) {
        return studentsFilterCache;
    }

    const [fakultasRes, prodiRes, angkatanRes, semesterRes, periodeRes, kewargRes, statusRes] = await Promise.all([
        prisma.student.findMany({ select: { fakultas: true }, distinct: ['fakultas'] }),
        prisma.student.findMany({ select: { programStudi: true }, distinct: ['programStudi'] }),
        prisma.student.findMany({ select: { angkatan: true }, distinct: ['angkatan'] }),
        prisma.student.findMany({ select: { semester: true }, distinct: ['semester'] }),
        prisma.student.findMany({ select: { periodeMasuk: true }, distinct: ['periodeMasuk'] }),
        prisma.student.findMany({ select: { kewarganegaraan: true }, distinct: ['kewarganegaraan'] }),
        prisma.student.findMany({ select: { statusKeaktifan: true }, distinct: ['statusKeaktifan'] })
    ]);
    
    studentsFilterCache = {
        fakultas: fakultasRes.map(r => r.fakultas).filter(Boolean).sort(),
        programStudi: prodiRes.map(r => r.programStudi).filter(Boolean).sort(),
        angkatan: angkatanRes.map(r => r.angkatan).filter(Boolean).sort().reverse(),
        semester: semesterRes.map(r => r.semester).filter(Boolean).sort((a, b) => a - b),
        periodeMasuk: periodeRes.map(r => r.periodeMasuk).filter(Boolean).sort().reverse(),
        kewarganegaraan: kewargRes.map(r => r.kewarganegaraan).filter(Boolean).sort(),
        statusKeaktifan: statusRes.map(r => r.statusKeaktifan).filter(Boolean).sort()
    };
    studentsFilterCacheTime = now;

    return studentsFilterCache;
}

module.exports = { getFilterOptions };