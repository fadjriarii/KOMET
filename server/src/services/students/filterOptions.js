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
        statusKeaktifan: statusRes.map(r => r.statusKeaktifan).filter(Boolean).sort(),
        jenjang: await getDistinctJenjang(),
        rollingYears: getRollingYears(angkatanRes.map(r => r.angkatan)),
        nationalityOptions: [
            { value: 'WNI', label: 'WNI' },
            { value: 'WNA', label: 'WNA' }
        ],
        periodeOptions: [
            { value: 'Ganjil', label: 'Ganjil' },
            { value: 'Genap', label: 'Genap' }
        ],
        semesterOptions: semesterRes
            .map(r => r.semester)
            .filter(value => value !== null && value !== undefined)
            .sort((a, b) => a - b)
            .map(value => ({ value: String(value), label: `Semester ${value}` }))
    };
    studentsFilterCacheTime = now;

    return studentsFilterCache;
}

async function getDistinctJenjang() {
    const rows = await prisma.student.findMany({ select: { jenjang: true }, distinct: ['jenjang'] });
    return rows.map(r => r.jenjang).filter(Boolean).sort();
}

function getRollingYears(values) {
    const years = values.map(value => String(value).match(/\b(20\d{2})\b/)?.[1]).filter(Boolean).map(Number);
    const latest = years.length ? Math.max(...years) : new Date().getFullYear();
    return Array.from({ length: 5 }, (_, index) => String(latest - index));
}

function clearFilterCache() {
    studentsFilterCache = null;
    studentsFilterCacheTime = 0;
}

module.exports = { getFilterOptions, clearFilterCache };
