/**
 * graduateDistribution.js
 *
 * Menghitung distribusi predikat kelulusan (byPredikat). Tren lulusan per tahun dihitung
 * di `totalLulusan.js`, yang sudah memecahnya per jenjang — menyajikannya lagi di sini
 * hanya menuliskan satu angka dengan dua nama kunci.
 *
 * ponytail: pemetaan predikat (`countByPredikat`) hanya boleh hidup satu kali, jadi
 * agregasinya tetap di Node. Batasnya O(lulusan dalam scope kartu).
 * Upgrade path: `GROUP BY predikatLulus` — kolomnya sudah diisi saat ETL dan label
 * resmi kampus sudah tersimpan di sana, tinggal butuh indeks.
 */

const prisma = require('../../config/prisma');
const { countByPredikat } = require('../../utils/graduateUtils');
const { roundedRate } = require('../../utils/percentageUtils');
const { resolveTahunAjaranScope } = require('./yearJenjangSeries');

async function getGraduateDistribution(whereFilter) {
  const { where } = await resolveTahunAjaranScope(whereFilter);
  const students = await prisma.student.findMany({
    where,
    select: { graduate: { select: { ipk: true, predikatLulus: true } } },
  });
  const graduates = students.map((s) => s.graduate).filter(Boolean);

  const totalGraduates = graduates.length;
  const predikatCounts = countByPredikat(graduates);
  const byPredikat = Object.entries(predikatCounts).map(([name, count]) => ({
    name,
    count,
    percentage: roundedRate(count, totalGraduates, null),
  }));

  return { total: totalGraduates, byPredikat };
}

module.exports = { getGraduateDistribution };
