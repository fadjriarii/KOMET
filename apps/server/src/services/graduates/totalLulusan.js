/**
 * totalLulusan.js
 *
 * Menghitung total mahasiswa lulus (S1 & S2) dalam rentang 5 tahun terakhir (dari tahun lalu).
 */

const prisma = require('../../config/prisma');
const { getYearRange } = require('../../utils/academicUtils');
const { includesJenjang } = require('./filterBuilder');

/**
 * Satu `groupBy(['jenjang'])` menggantikan dua `count()` dan memastikan kedua
 * angka berasal dari level yang benar — filter `jenjang` dari client tidak bisa
 * lagi membuat satu level dihitung dua kali.
 */
async function getTotalLulusan(whereFilter = {}) {
  const withoutJenjang = { ...whereFilter };
  delete withoutJenjang.jenjang; // `jenjang` menjadi kunci grouping, bukan filter
  const rows = await prisma.graduate.groupBy({
    by: ['jenjang'],
    where: { ...withoutJenjang, tahunLulus: { in: getYearRange() } },
    _count: true,
  });

  const countOf = (jenjang) => rows.find((row) => row.jenjang === jenjang)?._count ?? 0;

  return {
    s1: includesJenjang(whereFilter, 'S1') ? countOf('S1') : null,
    s2: includesJenjang(whereFilter, 'S2') ? countOf('S2') : null,
  };
}

async function getTotalLulusanByYear(whereFilter) {
  const yearRange = getYearRange();

  const results = await prisma.graduate.groupBy({
    by: ['tahunLulus', 'jenjang'],
    where: { ...whereFilter, tahunLulus: { in: yearRange } },
    _count: true,
    orderBy: { tahunLulus: 'asc' },
  });

  const s1 = yearRange.map((tahun) => {
    const found = results.find((r) => r.tahunLulus === tahun && r.jenjang === 'S1');
    return { tahun, count: found ? found._count : 0 };
  });
  const s2 = yearRange.map((tahun) => {
    const found = results.find((r) => r.tahunLulus === tahun && r.jenjang === 'S2');
    return { tahun, count: found ? found._count : 0 };
  });

  const byYear = yearRange.map((tahun, index) => ({
    tahun,
    s1Count: s1[index].count,
    s2Count: s2[index].count,
    total: s1[index].count + s2[index].count,
  }));

  return { s1, s2, byYear };
}

module.exports = { getTotalLulusan, getTotalLulusanByYear, getYearRange };
