const prisma = require('../../config/prisma');

async function getMbkmFilterOptions() {
    const [periodeRes, fakultasRes, prodiRes, angkatanRes, statusAktivitasRes, jenjangRes] = await Promise.all([
        prisma.mbkmActivity.findMany({
            select: { periode: true },
            distinct: ['periode'],
            orderBy: { periode: 'desc' }
        }),
        prisma.mbkmActivity.findMany({
            select: { fakultas: true },
            distinct: ['fakultas']
        }),
        prisma.mbkmActivity.findMany({
            select: { programStudi: true },
            distinct: ['programStudi']
        }),
        // Ambil angkatan dari relasi student
        prisma.student.findMany({
            where: { mbkmActivities: { some: {} } },
            select: { angkatan: true },
            distinct: ['angkatan'],
            orderBy: { angkatan: 'desc' }
        }),
        prisma.mbkmActivity.findMany({
            select: { statusAktivitas: true },
            distinct: ['statusAktivitas']
        }),
        prisma.mbkmActivity.findMany({
            select: { jenjang: true },
            distinct: ['jenjang']
        })
    ]);

    return {
        periode: periodeRes.map(r => r.periode).filter(Boolean),
        fakultas: fakultasRes.map(r => r.fakultas).filter(Boolean).sort(),
        programStudi: prodiRes.map(r => r.programStudi).filter(Boolean).sort(),
        angkatan: angkatanRes.map(r => r.angkatan).filter(Boolean),
        statusAktivitas: statusAktivitasRes.map(r => r.statusAktivitas).filter(Boolean).sort(),
        jenjang: jenjangRes.map(r => r.jenjang).filter(v => v === 'S1' || v === 'S2').sort()
    };
}

module.exports = { getMbkmFilterOptions };
