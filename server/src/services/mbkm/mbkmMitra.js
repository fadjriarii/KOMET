const prisma = require('../../config/prisma');

/**
 * Mendapatkan distribusi penempatan mitra industri & riset (Card 4 detail)
 *
 * @param {string} selectedPeriode Periode yang dipilih
 * @param {number} topN Jumlah top mitra yang diambil (default: 10)
 */
async function getMitraDistribution(selectedPeriode, topN = 10) {
    const baseWhere = {
        ...(selectedPeriode ? { periode: selectedPeriode } : {}),
        AND: [
            { mitra: { not: '' } },
            { mitra: { not: '-' } }
        ]
    };

    const mitraGroups = await prisma.mbkmActivity.groupBy({
        by: ['mitra'],
        _count: true,
        where: baseWhere,
        orderBy: [{ mitra: 'asc' }]
    });

    const totalPartners = mitraGroups.length;
    const totalPlacements = mitraGroups.reduce((sum, g) => sum + g._count, 0);

    const topMitra = mitraGroups
        .sort((a, b) => b._count - a._count)
        .slice(0, topN)
        .map(g => ({
            name: g.mitra,
            count: g._count,
            percentage: totalPlacements > 0
                ? `${((g._count / totalPlacements) * 100).toFixed(1)}%`
                : '0.0%'
        }));

    return { totalPartners, totalPlacements, mitraData: topMitra };
}

module.exports = { getMitraDistribution };
