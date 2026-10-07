/**
 * totalLulusan.js
 *
 * Menghitung total mahasiswa lulus (S1 & S2) dalam rentang 5 tahun terakhir (dari tahun lalu).
 */

const prisma = require('../../config/prisma');
const { getYearRange } = require('../../utils/academicUtils');
const { includesJenjang } = require('./filterBuilder');
const { valuesByYearAndJenjang } = require('./yearJenjangSeries');

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
  const series = await valuesByYearAndJenjang(whereFilter, {
    aggregate: { _count: true },
    valueOf: (row) => row._count,
    missing: 0,
  });

  return {
    byYear: series.map(({ tahun, s1, s2 }) => ({
      tahun,
      s1Count: s1,
      s2Count: s2,
      total: s1 + s2,
    })),
  };
}

module.exports = { getTotalLulusan, getTotalLulusanByYear, getYearRange };
