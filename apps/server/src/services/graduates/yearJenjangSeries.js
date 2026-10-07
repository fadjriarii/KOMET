/**
 * yearJenjangSeries.js
 *
 * Deret lulusan per tahun × jenjang dipakai dua jalur — jumlah lulusan
 * (`totalLulusan.js`) dan rata-rata IPK (`ipkTrend.js`) — dengan bentuk kueri yang
 * sama persis. Yang berbeda hanya angka yang diambil dari tiap baris.
 */

const prisma = require('../../config/prisma');
const { getYearRange } = require('../../utils/academicUtils');

/**
 * @param {object} whereFilter                       Filter siswa/lulusan aktif
 * @param {object} options.aggregate                 agregasi groupBy, mis. { _count: true }
 * @param {function(object): number|null} options.valueOf pembaca satu baris hasil groupBy
 * @param {number|null} options.missing              nilai tahun/jenjang tanpa baris
 * @returns {Promise<Array<{tahun: string, s1: number|null, s2: number|null}>>} terurut naik
 */
async function valuesByYearAndJenjang(whereFilter, { aggregate, valueOf, missing }) {
  const years = getYearRange();
  const rows = await prisma.graduate.groupBy({
    by: ['tahunLulus', 'jenjang'],
    where: { ...whereFilter, tahunLulus: { in: years } },
    ...aggregate,
  });

  const valueAt = (tahun, jenjang) => {
    const row = rows.find((r) => r.tahunLulus === tahun && r.jenjang === jenjang);
    return row ? valueOf(row) : missing;
  };

  return years.map((tahun) => ({ tahun, s1: valueAt(tahun, 'S1'), s2: valueAt(tahun, 'S2') }));
}

module.exports = { valuesByYearAndJenjang };
