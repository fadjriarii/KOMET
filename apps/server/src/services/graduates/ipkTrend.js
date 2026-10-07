/**
 * ipkTrend.js
 *
 * Menghitung rata-rata IPK lulusan (S1 & S2) serta breakdown per tahun, prodi, fakultas, dan gpaBands.
 */

const prisma = require('../../config/prisma');
const { getYearRange } = require('../../utils/academicUtils');
const { rate } = require('../../utils/percentageUtils');
const { includesJenjang } = require('./filterBuilder');
const { JENJANGS } = require('@komet/shared/constants');

/**
 * Rata-rata IPK per jenjang dalam jendela 5 tahun.
 * Tidak ada data → `average: null` (bukan 0.00), sama seperti `getIpkByYear`;
 * IPK rata-rata 0 bukan "tidak ada data", melainkan nilai terendah yang mungkin.
 */
async function getAvgIpk(whereFilter) {
  const yearRange = getYearRange();
  const baseWhere = { ...whereFilter, tahunLulus: { in: yearRange } };

  const averages = await Promise.all(
    JENJANGS.map(async (jenjang) => {
      if (!includesJenjang(whereFilter, jenjang)) {
        return { average: null, count: 0 };
      }
      const agg = await prisma.graduate.aggregate({
        where: { ...baseWhere, jenjang },
        _avg: { ipk: true },
        _count: true,
      });
      return {
        average: agg._avg.ipk === null ? null : parseFloat(agg._avg.ipk.toFixed(2)),
        count: agg._count,
      };
    }),
  );

  return { s1: averages[0], s2: averages[1] };
}

async function getIpkByYear(whereFilter) {
  const yearRange = getYearRange();
  const results = await prisma.graduate.groupBy({
    by: ['tahunLulus', 'jenjang'],
    where: { ...whereFilter, tahunLulus: { in: yearRange } },
    _avg: { ipk: true },
    _count: true,
    orderBy: { tahunLulus: 'asc' },
  });

  const byYearS1 = yearRange.map((tahun) => {
    const found = results.find((r) => r.tahunLulus === tahun && r.jenjang === 'S1');
    return {
      tahun,
      avgIpk: found && found._avg.ipk !== null ? parseFloat(found._avg.ipk.toFixed(2)) : null,
      count: found ? found._count : 0,
    };
  });
  const byYearS2 = yearRange.map((tahun) => {
    const found = results.find((r) => r.tahunLulus === tahun && r.jenjang === 'S2');
    return {
      tahun,
      avgIpk: found && found._avg.ipk !== null ? parseFloat(found._avg.ipk.toFixed(2)) : null,
      count: found ? found._count : 0,
    };
  });

  return { byYearS1, byYearS2 };
}

/**
 * Mendapatkan breakdown IPK untuk GpaOverviewModal.jsx:
 * - prodiGpaData: [{ name, gpaValue }]
 * - facultyGpaData: [{ name, gpaValue }]
 * - gpaBandsData: [{ range: "3.51 - 3.75", count }]
 *
 * ponytail: agregasi prodi/fakultas/band dikerjakan di Node atas baris dalam
 * jendela 5 tahun, bukan `GROUP BY` SQL. `groupBy` Prisma tidak bisa mengelompokkan
 * berdasar kolom relasi (prodi/fakultas ada di tabel mahasiswa) dan band IPK adalah
 * aturan kelas yang hanya boleh hidup satu kali. Batasnya O(lulusan dalam jendela).
 * Upgrade path: denormalisasi prodi/fakultas ke `graduates` sebagai kolom turunan
 * berindeks, lalu agregasi pindah ke database.
 */
async function getIpkOverview(whereFilter) {
  const yearRange = getYearRange();

  const results = await prisma.graduate.findMany({
    where: { ...whereFilter, tahunLulus: { in: yearRange } },
    select: {
      ipk: true,
      student: { select: { programStudi: true, fakultas: true } },
    },
  });

  // IPK kosong bukan angka 0: baris tanpa IPK dikeluarkan dari rata-rata dan
  // band, supaya tidak menyeret rata-rata prodi/fakultas ke bawah.
  const withIpk = results.filter((g) => Number.isFinite(Number(g.ipk)) && Number(g.ipk) > 0);

  const prodiMap = {};
  const facultyMap = {};
  const bandsMap = {
    '< 2.75': 0,
    '2.75 - 3.00': 0,
    '3.01 - 3.50': 0,
    '3.51 - 3.75': 0,
    '3.76 - 4.00': 0,
  };

  withIpk.forEach((g) => {
    const prodi = g.student?.programStudi || 'Unknown';
    const faculty = g.student?.fakultas || 'Unknown';
    const ipk = Number(g.ipk);

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
