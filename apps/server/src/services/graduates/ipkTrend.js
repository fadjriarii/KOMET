/**
 * ipkTrend.js
 *
 * Menghitung rata-rata IPK lulusan per jenjang (dinamis — S1/S2/`Prof`, bukan
 * daftar statis) serta breakdown per tahun, prodi, fakultas, dan gpaBands.
 */

const prisma = require('../../config/prisma');
const { rate } = require('../../utils/percentageUtils');
const { getScopeJenjangs } = require('./filterBuilder');
const {
  valuesByYearAndJenjang,
  resolveTahunScope,
  describeTahunScope,
  withTahunScope,
} = require('./yearJenjangSeries');

const avgOf = (items) => {
  const values = items
    .map((s) => Number(s.graduate?.ipk))
    .filter((v) => Number.isFinite(v) && v > 0);
  if (!values.length) return { average: null, count: 0 };
  const average = values.reduce((acc, v) => acc + v, 0) / values.length;
  return { average: parseFloat(average.toFixed(2)), count: values.length };
};

/**
 * Rata-rata IPK per jenjang dalam scope kartu (default seluruh populasi).
 * Tidak ada data → `average: null` (bukan 0.00); IPK 0 bukan "tidak ada data".
 */
async function getAvgIpk(whereFilter) {
  const { scope, isDefault } = await resolveTahunScope(whereFilter);
  const jenjangs = await getScopeJenjangs(whereFilter);
  const students = await prisma.student.findMany({
    where: withTahunScope(whereFilter, scope),
    select: { jenjang: true, graduate: { select: { ipk: true } } },
  });

  const result = { tahunScope: describeTahunScope(scope, isDefault) };
  for (const jenjang of jenjangs) {
    result[jenjang.toLowerCase()] = avgOf(students.filter((s) => s.jenjang === jenjang));
  }
  // Kunci lama untuk kompatibilitas kartu S1/S2 yang sudah ada.
  result.s1 = result.s1 ?? { average: null, count: 0 };
  result.s2 = result.s2 ?? { average: null, count: 0 };
  return result;
}

/**
 * Rata-rata IPK per tahun untuk semua jenjang dalam satu deret terurut naik —
 * bentuk yang sama seperti `byYear` pada `totalLulusan.js`, sehingga halaman
 * tinggal membacanya tanpa menggabungkan dua daftar.
 */
async function getIpkByYear(whereFilter) {
  const series = await valuesByYearAndJenjang(whereFilter, {
    valueOf: ({ items }) => avgOf(items).average,
    missing: null,
  });
  return series.map(({ tahun, ...avgs }) => {
    const entry = { tahun };
    for (const [key, value] of Object.entries(avgs)) entry[`${key}AvgIpk`] = value;
    return entry;
  });
}

/**
 * Breakdown IPK untuk GpaOverviewModal.jsx:
 * - prodiGpaData: [{ name, gpaValue }]
 * - facultyGpaData: [{ name, gpaValue }]
 * - gpaBandsData: [{ range: "3.51 - 3.75", count }]
 *
 * ponytail: agregasi prodi/fakultas/band dikerjakan di Node atas baris dalam
 * scope kartu, bukan `GROUP BY` SQL. `groupBy` Prisma tidak bisa mengelompokkan
 * berdasar kolom campuran student+relasi, dan band IPK adalah aturan kelas
 * yang hanya boleh hidup satu kali. Batasnya O(lulusan dalam scope).
 * Upgrade path: denormalisasi prodi/fakultas ke `graduates` sebagai kolom turunan
 * berindeks, lalu agregasi pindah ke database.
 */
async function getIpkOverview(whereFilter) {
  const { scope } = await resolveTahunScope(whereFilter);

  const results = await prisma.student.findMany({
    where: withTahunScope(whereFilter, scope),
    select: {
      programStudi: true,
      fakultas: true,
      graduate: { select: { ipk: true } },
    },
  });

  // IPK kosong bukan angka 0: baris tanpa IPK dikeluarkan dari rata-rata dan
  // band, supaya tidak menyeret rata-rata prodi/fakultas ke bawah.
  const withIpk = results.filter(
    (s) => Number.isFinite(Number(s.graduate?.ipk)) && Number(s.graduate?.ipk) > 0,
  );

  const prodiMap = {};
  const facultyMap = {};
  const bandsMap = {
    '< 2.75': 0,
    '2.75 - 3.00': 0,
    '3.01 - 3.50': 0,
    '3.51 - 3.75': 0,
    '3.76 - 4.00': 0,
  };

  withIpk.forEach((s) => {
    const prodi = s.programStudi || 'Unknown';
    const faculty = s.fakultas || 'Unknown';
    const ipk = Number(s.graduate.ipk);

    // Prodi Map
    if (!prodiMap[prodi]) prodiMap[prodi] = { total: 0, sum: 0 };
    prodiMap[prodi].total++;
    prodiMap[prodi].sum += ipk;

    // Faculty Map
    if (!facultyMap[faculty]) facultyMap[faculty] = { total: 0, sum: 0 };
    facultyMap[faculty].total++;
    facultyMap[faculty].sum += ipk;

    // GPA Bands
    if (ipk < 2.75) bandsMap['< 2.75']++;
    else if (ipk <= 3.0) bandsMap['2.75 - 3.00']++;
    else if (ipk <= 3.5) bandsMap['3.01 - 3.50']++;
    else if (ipk <= 3.75) bandsMap['3.51 - 3.75']++;
    else bandsMap['3.76 - 4.00']++;
  });

  const prodiGpaData = Object.entries(prodiMap)
    .map(([name, { total, sum }]) => ({
      name,
      gpaValue: parseFloat((sum / total).toFixed(2)),
      count: total,
    }))
    .sort((a, b) => b.gpaValue - a.gpaValue);

  const facultyGpaData = Object.entries(facultyMap)
    .map(([name, { total, sum }]) => ({
      name,
      gpaValue: parseFloat((sum / total).toFixed(2)),
      count: total,
    }))
    .sort((a, b) => b.gpaValue - a.gpaValue);

  const totalGraduates = withIpk.length;
  const gpaBandsData = Object.entries(bandsMap).map(([range, count]) => ({
    range,
    count,
    percentage: rate(count, totalGraduates),
  }));

  return {
    prodiGpaData,
    facultyGpaData,
    gpaBandsData,
    unknownIpkCount: results.length - withIpk.length,
  };
}

module.exports = { getAvgIpk, getIpkByYear, getIpkOverview };
