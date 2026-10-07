const prisma = require('../../config/prisma');
const { TARGET_IKU2_PERCENT } = require('@komet/shared/constants');
const { roundedRate } = require('../../utils/percentageUtils');
const {
  buildActivityWhere,
  buildEligibleStudentWhere,
  MBKM_ACTIVE_STATUSES,
  MBKM_EVALUATION_STATUSES,
  MBKM_STATUS,
} = require('./filterBuilder');
const { distributionBy } = require('./mbkmActivities');

/**
 * Mendapatkan analisis partisipasi MBKM vs Mahasiswa Eligible (Card 1 detail).
 *
 * Satu `groupBy` status menggantikan tiga `count()` terpisah di atas where yang
 * sama, dan memberi angka evaluasi yang nyata (bukan konstanta 0).
 *
 * @param {Object} whereFilter Filter Prisma untuk MbkmActivity
 * @param {string} selectedPeriode Periode yang dipilih
 * @param {Object} studentFilter Filter Prisma untuk Student
 */
async function getMbkmRate(whereFilter = {}, selectedPeriode, studentFilter = {}) {
  const [statusGroups, eligibleCount, facultyData] = await Promise.all([
    prisma.mbkmActivity.groupBy({
      by: ['statusAktivitas'],
      _count: { statusAktivitas: true },
      where: buildActivityWhere(whereFilter, selectedPeriode, null),
    }),
    prisma.student.count({ where: buildEligibleStudentWhere(studentFilter) }),
    distributionBy('fakultas', whereFilter, selectedPeriode).then((result) => result.items),
  ]);

  const byStatus = Object.fromEntries(
    statusGroups.map((group) => [group.statusAktivitas, group._count.statusAktivitas]),
  );
  const countOf = (statuses) => statuses.reduce((sum, status) => sum + (byStatus[status] || 0), 0);

  const disetujuiCount = byStatus[MBKM_STATUS.DISSETUJUI] || 0;
  const selesaiCount = byStatus[MBKM_STATUS.SELESAI] || 0;
  const evaluasiCount = countOf(MBKM_EVALUATION_STATUSES);
  const mbkmCount = countOf(MBKM_ACTIVE_STATUSES);

  const numPercentage = roundedRate(mbkmCount, eligibleCount);
  const meetsTarget = numPercentage >= TARGET_IKU2_PERCENT;

  return {
    participantStats: {
      count: mbkmCount,
      disetujuiCount,
      selesaiCount,
      evaluasiCount,
    },
    eligibleCount,
    // Label "Tercapai/Belum" milik presentasi; yang dikirim hanya boolean dan
    // `eligibleCount` (0 = tidak ada data, bukan 0% tercapai).
    eligibleRate: {
      numPercentage,
      meetsTarget,
      targetIku2: TARGET_IKU2_PERCENT,
    },
    facultyData,
  };
}

module.exports = { getMbkmRate };
