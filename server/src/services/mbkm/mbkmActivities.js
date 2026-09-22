const prisma = require('../../config/prisma');

/**
 * Tab A: Distribusi peserta berdasarkan jenis aktivitas BKP Kampus Merdeka
 */
async function getActivityDistribution(whereFilter = {}, selectedPeriode) {
    const baseWhere = {
        ...whereFilter,
        ...(selectedPeriode ? { periode: selectedPeriode } : {}),
        statusAktivitas: { in: ['Disetujui', 'Selesai'] },
        jenisAktivitas: { not: '' }
    };

    const activityGroups = await prisma.mbkmActivity.groupBy({
        by: ['jenisAktivitas'],
        _count: true,
        where: baseWhere,
        orderBy: [{ jenisAktivitas: 'asc' }]
    });

    const sorted = activityGroups.sort((a, b) => b._count - a._count);
    const total = sorted.reduce((sum, g) => sum + g._count, 0);

    const items = sorted.map(g => ({
        name: g.jenisAktivitas,
        count: g._count,
        percentage: total > 0 ? `${((g._count / total) * 100).toFixed(1)}%` : '0.0%'
    }));

    return { total, items };
}

/**
 * Tab B: Sebaran partisipasi MBKM per program studi
 */
async function getProdiDistribution(whereFilter = {}, selectedPeriode) {
    const baseWhere = {
        ...whereFilter,
        ...(selectedPeriode ? { periode: selectedPeriode } : {}),
        statusAktivitas: { in: ['Disetujui', 'Selesai'] },
        jenisAktivitas: { not: '' }
    };

    const prodiGroups = await prisma.mbkmActivity.groupBy({
        by: ['programStudi'],
        _count: true,
        where: baseWhere,
        orderBy: [{ programStudi: 'asc' }]
    });

    const sorted = prodiGroups.sort((a, b) => b._count - a._count);
    const total = sorted.reduce((sum, g) => sum + g._count, 0);

    const items = sorted.map(g => ({
        name: g.programStudi,
        count: g._count,
        percentage: total > 0 ? `${((g._count / total) * 100).toFixed(1)}%` : '0.0%'
    }));

    return { total, items };
}

/**
 * Tab C: Distribusi status aktivitas MBKM (semua status untuk Pie Chart)
 */
async function getStatusDistribution(whereFilter = {}, selectedPeriode) {
    const baseWhere = {
        ...whereFilter,
        ...(selectedPeriode ? { periode: selectedPeriode } : {}),
        jenisAktivitas: { not: '' }
    };

    const statusGroups = await prisma.mbkmActivity.groupBy({
        by: ['statusAktivitas'],
        _count: true,
        where: baseWhere,
        orderBy: [{ statusAktivitas: 'asc' }]
    });

    const sorted = statusGroups.sort((a, b) => b._count - a._count);
    const total = sorted.reduce((sum, g) => sum + g._count, 0);

    const items = sorted.map(g => ({
        name: g.statusAktivitas,
        count: g._count,
        percentage: total > 0 ? `${((g._count / total) * 100).toFixed(1)}%` : '0.0%'
    }));

    return { total, items };
}

module.exports = { getActivityDistribution, getProdiDistribution, getStatusDistribution };
