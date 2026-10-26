/**
 * graduateDistribution.js
 *
 * Menghitung distribusi lulusan per predikat, program studi, dan fakultas. Tren lulusan per tahun dihitung
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

/** Jumlah per nilai kolom (prodi/fakultas), terbanyak dulu, dengan persentase. */
function countBy(rows, field, total) {
  const counts = new Map();
  for (const row of rows) {
    const name = row[field] || 'Lainnya';
    counts.set(name, (counts.get(name) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, count]) => ({ name, count, percentage: roundedRate(count, total, null) }));
}

async function getGraduateDistribution(whereFilter) {
  const { where } = await resolveTahunAjaranScope(whereFilter);
  const students = await prisma.student.findMany({
    where,
    select: {
      programStudi: true,
      fakultas: true,
      graduate: { select: { ipk: true, predikatLulus: true } },
    },
  });
  const withGraduate = students.filter((s) => s.graduate);
  const graduates = withGraduate.map((s) => s.graduate);

  const totalGraduates = graduates.length;
  const predikatCounts = countByPredikat(graduates);
  // Kategori bernilai 0 tidak dikirim: jumlah item = jumlah kategori berdata,
  // dasar aturan "tab satu kategori disembunyikan" di client.
  const byPredikat = Object.entries(predikatCounts)
    .filter(([, count]) => count > 0)
    .map(([name, count]) => ({
      name,
      count,
      percentage: roundedRate(count, totalGraduates, null),
    }));

  return {
    total: totalGraduates,
    byPredikat,
    byProdi: countBy(withGraduate, 'programStudi', totalGraduates),
    byFaculty: countBy(withGraduate, 'fakultas', totalGraduates),
  };
}

module.exports = { getGraduateDistribution };
