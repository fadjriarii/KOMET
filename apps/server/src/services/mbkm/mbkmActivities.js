const prisma = require('../../config/prisma');
const { buildActivityWhere, MBKM_ACTIVE_STATUSES } = require('./filterBuilder');
const { rate } = require('../../utils/percentageUtils');

/**
 * Satu implementasi distribusi untuk semua dimensi aggregation MBKM.
 * Urutan dan persentase diselesaikan di database + satu kali jalan, tanpa
 * `orderBy` SQL yang kemudian diurutkan ulang di JavaScript.
 *
 * @param {string} field kolom group by: jenisAktivitas | programStudi | fakultas | statusAktivitas
 * @param {string|null} allowedStatuses scope status; null = semua status
 */
async function distributionBy(
  field,
  whereFilter = {},
  selectedPeriode,
  allowedStatuses = MBKM_ACTIVE_STATUSES,
) {
  const where = buildActivityWhere(whereFilter, selectedPeriode, allowedStatuses);

  const groups = await prisma.mbkmActivity.groupBy({
    by: [field],
    _count: { [field]: true },
    where,
    orderBy: [{ _count: { [field]: 'desc' } }, { [field]: 'asc' }],
  });

  const counts = groups.map((group) => ({ name: group[field], count: group._count[field] }));
  const total = counts.reduce((sum, item) => sum + item.count, 0);

  return {
    total,
    // Populasi tiap tab sengaja bisa berbeda (status verifikasi menampilkan
    // juga aktivitas yang tidak dihitung sebagai partisipan). Dikirim agar
    // client dapat melabeli penyebut, bukan membandingkan angka antar tab.
    population: allowedStatuses ? 'active_participants' : 'all_statuses',
    items: counts.map((item) => ({
      ...item,
      percentage: rate(item.count, total),
    })),
  };
}

/** Tab A: Distribusi peserta berdasarkan jenis aktivitas BKP Kampus Merdeka. */
const getActivityDistribution = (whereFilter, selectedPeriode) =>
  distributionBy('jenisAktivitas', whereFilter, selectedPeriode);

/** Tab B: Sebaran partisipasi MBKM per program studi. */
const getProdiDistribution = (whereFilter, selectedPeriode) =>
  distributionBy('programStudi', whereFilter, selectedPeriode);

/** Tab C: Distribusi status aktivitas (semua status, untuk Pie Chart). */
const getStatusDistribution = (whereFilter, selectedPeriode) =>
  distributionBy('statusAktivitas', whereFilter, selectedPeriode, null);

module.exports = {
  distributionBy,
  getActivityDistribution,
  getProdiDistribution,
  getStatusDistribution,
};
