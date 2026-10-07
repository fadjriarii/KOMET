/**
 * graduateDistribution.js
 *
 * Menghitung tren lulusan per tahun (byYear) dan distribusi predikat kelulusan (byPredikat).
 *
 * ponytail: `select` tiga kolom dalam jendela `getYearRange()`, agregasi di Node.
 * `groupBy(['tahunLulus'])` selesai untuk byYear, tetapi predikat adalah kelas IPK
 * (`countByPredikat`) yang hanya boleh hidup satu kali — menghitungnya di SQL
 * menyimpan aturan itu dua kali. Batasnya O(lulusan dalam jendela 5 tahun).
 * Upgrade path: kolom turunan `predikat` berindeks di `graduates` (diisi saat ETL),
 * lalu kedua distribusi menjadi satu `GROUP BY`.
 */

const prisma = require('../../config/prisma');
const { getYearRange } = require('../../utils/academicUtils');
const { countByPredikat } = require('../../utils/graduateUtils');
const { rate } = require('../../utils/percentageUtils');

async function getGraduateDistribution(whereFilter) {
  const yearRange = getYearRange();

  const graduates = await prisma.graduate.findMany({
    where: { ...whereFilter, tahunLulus: { in: yearRange } },
    select: { tahunLulus: true, ipk: true, jenjang: true },
  });

  const yearMap = {};
  graduates.forEach((g) => {
    yearMap[g.tahunLulus] = (yearMap[g.tahunLulus] || 0) + 1;
  });

  const byYear = yearRange.map((year) => ({
    year,
    tahun: year,
    count: yearMap[year] || 0,
  }));

  const totalGraduates = graduates.length;
  const predikatCounts = countByPredikat(graduates);
  const byPredikat = Object.entries(predikatCounts).map(([name, count]) => ({
    name,
    count,
    percentage: rate(count, totalGraduates),
  }));

  return { total: totalGraduates, byYear, byPredikat };
}

module.exports = { getGraduateDistribution };
