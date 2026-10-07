const prisma = require('../../config/prisma');
const { buildEligibleStudentWhere } = require('./filterBuilder');
const { rate } = require('../../utils/percentageUtils');

/**
 * Mendapatkan data mahasiswa eligible semester 7 dan sebarannya per prodi (Card 3 detail).
 * Populasi eligible diambil dari `buildEligibleStudentWhere`, definisi yang sama
 * dengan `eligibleCount` pada Card 1.
 *
 * @param {Object} studentFilter Filter Prisma untuk Student
 */
async function getEligibleStudents(studentFilter = {}) {
  const where = buildEligibleStudentWhere(studentFilter);

  const [eligibleCount, prodiGroups] = await Promise.all([
    prisma.student.count({ where }),
    prisma.student.groupBy({
      by: ['programStudi'],
      _count: { programStudi: true },
      where,
      orderBy: [{ _count: { programStudi: 'desc' } }, { programStudi: 'asc' }],
    }),
  ]);

  const prodiData = prodiGroups.map((group) => ({
    name: group.programStudi,
    count: group._count.programStudi,
    percentage: rate(group._count.programStudi, eligibleCount),
  }));

  return { eligibleCount, prodiData };
}

module.exports = { getEligibleStudents };
