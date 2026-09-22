const prisma = require('../../config/prisma');

/**
 * Mendapatkan analisis partisipasi MBKM vs Mahasiswa Eligible (Card 1 detail)
 *
 * @param {Object} whereFilter Filter Prisma untuk MbkmActivity
 * @param {string} selectedPeriode Periode yang dipilih
 * @param {Object} studentFilter Filter Prisma untuk Student
 */
async function getMbkmRate(whereFilter = {}, selectedPeriode, studentFilter = {}) {
    const baseMbkmWhere = {
        ...whereFilter,
        ...(selectedPeriode ? { periode: selectedPeriode } : {}),
        statusAktivitas: { in: ['Disetujui', 'Selesai'] },
        jenisAktivitas: { not: '' }
    };

    const [mbkmCount, disetujuiCount, selesaiCount, eligibleCount, facultyGroups] = await Promise.all([
        prisma.mbkmActivity.count({ where: baseMbkmWhere }),
        prisma.mbkmActivity.count({
            where: { ...baseMbkmWhere, statusAktivitas: 'Disetujui' }
        }),
        prisma.mbkmActivity.count({
            where: { ...baseMbkmWhere, statusAktivitas: 'Selesai' }
        }),
        prisma.student.count({
            where: {
                semester: 7,
                statusKeaktifan: 'Aktif',
                ...studentFilter
            }
        }),
        prisma.mbkmActivity.groupBy({
            by: ['fakultas'],
            _count: true,
            where: baseMbkmWhere,
            orderBy: [{ fakultas: 'asc' }]
        })
    ]);

    const numPercentage = eligibleCount > 0
        ? parseFloat(((mbkmCount / eligibleCount) * 100).toFixed(2))
        : 0;

    const TARGET_IKU2 = 20.0;
    const meetsTarget = numPercentage >= TARGET_IKU2;
    const badge = eligibleCount === 0
        ? 'Data Tidak Tersedia'
        : meetsTarget
            ? 'Target IKU-2 Tercapai'
            : 'Target IKU-2 Belum Tercapai';

    const sortedFaculty = facultyGroups.sort((a, b) => b._count - a._count);
    const facultyData = sortedFaculty.map(g => ({
        name: g.fakultas,
        count: g._count,
        percentage: mbkmCount > 0
            ? `${((g._count / mbkmCount) * 100).toFixed(1)}%`
            : '0.0%'
    }));

    return {
        participantStats: {
            count: mbkmCount,
            disetujuiCount,
            selesaiCount
        },
        eligibleCount,
        eligibleRate: {
            percentage: `${numPercentage.toFixed(1)}%`,
            numPercentage,
            meetsTarget,
            targetIku2: TARGET_IKU2,
            badge
        },
        facultyData
    };
}

module.exports = { getMbkmRate };
