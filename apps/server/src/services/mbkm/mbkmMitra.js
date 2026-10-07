const prisma = require('../../config/prisma');
const { rate } = require('../../utils/percentageUtils');

const DEFAULT_MITRA_TOP_N = 10;

/**
 * Mendapatkan distribusi penempatan mitra industri & riset (Card 4 detail).
 *
 * Persentase selalu dihitung atas seluruh penempatan; mitra di luar `topN`
 * digabung ke satu baris "Lainnya" supaya daftar yang ditampilkan tetap
 * menjumlah 100%.
 *
 * ponytail: `mitra` bertipe TEXT, jadi `GROUP BY` tetap pemindaian penuh — indeks
 * prefix (100 karakter) terbukti tidak dipakai optimizer untuk grouping. Jalur
 * upgrade: kolom VARCHAR(191) turunan yang berindeks, diisi oleh sync.
 *
 * @param {string} selectedPeriode Periode yang dipilih
 * @param {number} topN Jumlah top mitra yang diambil (default: 10)
 */
async function getMitraDistribution(selectedPeriode, topN = DEFAULT_MITRA_TOP_N) {
  const where = {
    ...(selectedPeriode ? { periode: selectedPeriode } : {}),
    mitra: { not: '' },
  };

  const mitraGroups = await prisma.mbkmActivity.groupBy({
    by: ['mitra'],
    _count: { mitra: true },
    where,
    orderBy: [{ _count: { mitra: 'desc' } }, { mitra: 'asc' }],
  });

  const counts = mitraGroups.map((group) => ({ name: group.mitra, count: group._count.mitra }));
  const totalPartners = counts.length;
  const totalPlacements = counts.reduce((sum, item) => sum + item.count, 0);

  const limited = counts.slice(0, topN);
  const omitted = counts.slice(topN);
  if (omitted.length) {
    limited.push({
      name: 'Lainnya',
      count: omitted.reduce((sum, item) => sum + item.count, 0),
      partners: omitted.length,
    });
  }

  return {
    totalPartners,
    totalPlacements,
    topN,
    mitraData: limited.map((item) => ({
      ...item,
      percentage: rate(item.count, totalPlacements),
    })),
  };
}

module.exports = { getMitraDistribution, DEFAULT_MITRA_TOP_N };
