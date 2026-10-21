/**
 * totalLulusan.js
 *
 * Total = baris mahasiswa yang punya catatan kelulusan (graduate-base, asal
 * endpoint `/kelulusan`) — kartu dan tabel memakai populasi yang sama sehingga
 * tak bisa selisih. Field kelulusan (tahunLulus) dibaca dari relasi `graduate`.
 */

const prisma = require('../../config/prisma');
const { getRequestedJenjang } = require('./filterBuilder');
const {
  valuesByYearAndJenjang,
  windowGraduateTrend,
  resolveTahunAjaranScope,
} = require('./yearJenjangSeries');

/**
 * Kartu KPI = populasi baris graduate (asal `/kelulusan`). Filter `tahunLulus`
 * dari user — termasuk default UI tahun terbaru — selalu menang; tanpa
 * pilihan = seluruh populasi. Jangkar `tahunAjaran` (Opsi A, meta dari
 * filterBuilder — bukan where Prisma) hanya berlaku tanpa `tahunLulus` dan
 * membuat scope kumulatif `lte` sampai label jangkar.
 */
async function getTotalLulusan(whereFilter = {}) {
  const { cleanFilter, where, tahunScope } = await resolveTahunAjaranScope(whereFilter);

  const rows = await prisma.student.groupBy({
    by: ['jenjang'],
    where,
    _count: true,
  });

  const requested = getRequestedJenjang(cleanFilter);
  const countOf = (jenjang) => rows.find((row) => row.jenjang === jenjang)?._count ?? 0;
  const pick = (jenjang) => (!requested || requested.includes(jenjang) ? countOf(jenjang) : null);

  const counts = {};
  for (const row of rows) counts[row.jenjang] = row._count;
  const known = requested || Object.keys(counts).sort();

  const result = { tahunScope };
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

  // Chart tren = 5 tahun terbaru dari data; jangkar tahun ajaran sudah
  // memotong deretnya, pilihan tahun lulus eksplisit tetap menang apa adanya.
  return {
    byYear: windowGraduateTrend(series, whereFilter).map(({ tahun, ...counts }) => {
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
