/**
 * totalLulusan.js
 *
 * Total = `prisma.student.count where statusKeaktifan Lulus` — SATU sumber
 * dengan `/mahasiswa?statusKeaktifan=Lulus` (1132), by construction tak bisa
 * selisih. Field kelulusan (tahunLulus) dibaca dari relasi `graduate`.
 */

const prisma = require('../../config/prisma');
const { getRequestedJenjang } = require('./filterBuilder');
const {
  valuesByYearAndJenjang,
  resolveTahunScope,
  describeTahunScope,
  withTahunScope,
} = require('./yearJenjangSeries');

/**
 * Kartu KPI = populasi tabel student Lulus. Filter `tahunLulus` dari user
 * selalu menang; tanpa pilihan = seluruh populasi.
 */
async function getTotalLulusan(whereFilter = {}) {
  const { scope, isDefault } = await resolveTahunScope(whereFilter);
  const where = withTahunScope({ ...whereFilter, statusKeaktifan: 'Lulus' }, scope);

  const rows = await prisma.student.groupBy({
    by: ['jenjang'],
    where,
    _count: true,
  });

  const requested = getRequestedJenjang(whereFilter);
  const countOf = (jenjang) => rows.find((row) => row.jenjang === jenjang)?._count ?? 0;
  const pick = (jenjang) => (!requested || requested.includes(jenjang) ? countOf(jenjang) : null);

  const counts = {};
  for (const row of rows) counts[row.jenjang] = row._count;
  const known = requested || Object.keys(counts).sort();

  const result = { tahunScope: describeTahunScope(scope, isDefault) };
  for (const jenjang of known) result[jenjang.toLowerCase()] = pick(jenjang);
  // Kunci lama untuk kompatibilitas kartu S1/S2 yang sudah ada.
  result.s1 = result.s1 ?? null;
  result.s2 = result.s2 ?? null;
  return result;
}

async function getTotalLulusanByYear(whereFilter) {
  const series = await valuesByYearAndJenjang(whereFilter, {
    valueOf: ({ items }) => items.length,
    missing: 0,
  });

  return {
    byYear: series.map(({ tahun, ...counts }) => {
      const entry = { tahun };
      let total = 0;
      for (const [key, value] of Object.entries(counts)) {
        entry[`${key}Count`] = value ?? 0;
        total += value ?? 0;
      }
      entry.total = total;
      return entry;
    }),
  };
}

module.exports = { getTotalLulusan, getTotalLulusanByYear };
