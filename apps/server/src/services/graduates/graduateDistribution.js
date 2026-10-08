/**
 * graduateDistribution.js
 *
 * Menghitung distribusi predikat kelulusan (byPredikat). Tren lulusan per tahun dihitung
 * di `totalLulusan.js`, yang sudah memecahnya per jenjang — menyajikannya lagi di sini
 * hanya menuliskan satu angka dengan dua nama kunci.
 *
 * ponytail: pemetaan predikat (`countByPredikat`) hanya boleh hidup satu kali, jadi
 * agregasinya tetap di Node. Batasnya O(lulusan dalam jendela 5 tahun).
 * Upgrade path: `GROUP BY predikatLulus` — kolomnya sudah diisi saat ETL dan label
 * resmi kampus sudah tersimpan di sana, tinggal butuh indeks.
 */

const prisma = require('../../config/prisma');
const { getYearRange } = require('../../utils/academicUtils');
const { countByPredikat } = require('../../utils/graduateUtils');
const { rate } = require('../../utils/percentageUtils');

async function getGraduateDistribution(whereFilter) {
  const graduates = await prisma.graduate.findMany({
    where: { ...whereFilter, tahunLulus: { in: getYearRange() } },
    select: { ipk: true, predikatLulus: true },
  });

  const totalGraduates = graduates.length;
  const predikatCounts = countByPredikat(graduates);
  const byPredikat = Object.entries(predikatCounts).map(([name, count]) => ({
    name,
    count,
    percentage: rate(count, totalGraduates),
  }));

  return { total: totalGraduates, byPredikat };
}

module.exports = { getGraduateDistribution };
