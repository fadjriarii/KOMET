const prisma = require('../../../config/prisma');
const { roundedRate } = require('../../../utils/percentageUtils');
const { ensurePopulationFilter } = require('../filterBuilder');

function appendNot(where, condition) {
  const { NOT: existingNot, AND: existingAnd, ...rest } = where;
  return {
    ...rest,
    AND: [
      ...(existingAnd || []),
      ...(existingNot ? [{ NOT: existingNot }] : []),
      { NOT: condition },
    ],
  };
}

function getInternationalWhere(baseFilter = {}) {
  const where = appendNot(ensurePopulationFilter(baseFilter), {
    kewarganegaraan: 'Indonesia',
  });
  // Preserve the pre-groupBy business rule: a missing nationality is
  // unknown, not an international student.
  return {
    ...where,
    AND: [...(where.AND || []), { kewarganegaraan: { not: '' } }],
  };
}

const WNI_NATIONALITY = 'indonesia';

/**
 * Satu agregat `groupBy` menghasilkan pembilang dan penyebut sekaligus, jadi
 * tren per tahun butuh 1 query, bukan 2 `count`. Perbandingan nama negara
 * di-normalisasi seperti collation MySQL (case-insensitive).
 */
function sumNationalityRows(rows) {
  let total = 0;
  let foreign = 0;
  for (const row of rows) {
    const count = row._count.kewarganegaraan;
    total += count;
    const nationality = String(row.kewarganegaraan || '')
      .trim()
      .toLowerCase();
    // Kewarganegaraan kosong = tidak diketahui, bukan mahasiswa internasional.
    if (nationality && nationality !== WNI_NATIONALITY) foreign += count;
  }
  return { total, foreign };
}

function countByNationality(where) {
  return prisma.student.groupBy({
    by: ['kewarganegaraan'],
    where,
    _count: { kewarganegaraan: true },
  });
}

/**
 * Satu nama untuk satu nilai. Dahulu baris ini mengirim `foreignActive`/
 * `foreignCount`, `totalActive`/`totalCount`/`rawTotal`, dan `percentage`/`rate`/
 * `rawRate` sekaligus — hanya supaya tebakan alias di client selalu cocok. Bentuk
 * itu membuat kontrak tidak bisa diverifikasi: client tidak pernah tahu mana yang
 * berubah, dan server tidak pernah bisa menghapus salah satunya.
 */
function toTrendRow(academicYear, { total, foreign }) {
  return {
    academicYear,
    foreignCount: foreign,
    totalCount: total,
    percentage: roundedRate(foreign, total),
  };
}

module.exports = { getInternationalWhere, sumNationalityRows, countByNationality, toTrendRow };
