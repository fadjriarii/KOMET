const prisma = require('../../config/prisma');

/**
 * Mendapatkan data mahasiswa eligible semester 7 dan sebarannya per prodi (Card 3 detail)
 *
 * @param {Object} studentFilter Filter Prisma untuk Student
 */
async function getEligibleStudents(studentFilter = {}) {
    const baseWhere = {
        semester: 7,
        statusKeaktifan: 'Aktif',
        ...studentFilter
    };

    const [eligibleCount, prodiGroups] = await Promise.all([
        prisma.student.count({ where: baseWhere }),
        prisma.student.groupBy({
            by: ['programStudi'],
            _count: true,
            where: baseWhere,
            orderBy: [{ programStudi: 'asc' }]
        })
    ]);

    const sorted = prodiGroups.sort((a, b) => b._count - a._count);
    const prodiData = sorted.map(g => ({
        name: g.programStudi,
        count: g._count,
        percentage: eligibleCount > 0 ? `${((g._count / eligibleCount) * 100).toFixed(1)}%` : '0.0%'
    }));

    return { eligibleCount, prodiData };
}

module.exports = { getEligibleStudents };
