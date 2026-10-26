const prisma = require('../../../config/prisma');
const { roundedRate } = require('../../../utils/percentageUtils');
const { ensurePopulationFilter } = require('../filterBuilder');
const { foreignCondition } = require('../filterBuilder/statusScope');

function getInternationalWhere(baseFilter = {}) {
  const where = ensurePopulationFilter(baseFilter);
  // Aturan asing satu sumber (lihat foreignCondition): kunci kode negara,
  // nama hanya untuk baris tanpa kode. Baris tanpa kewarganegaraan tetap
  // bukan mahasiswa internasional.
  return {
    ...where,
    AND: [...(where.AND || []), foreignCondition()],
  };
}

const WNI_NATIONALITY = 'indonesia';

/**
 * Satu agregat `groupBy` menghasilkan pembilang dan penyebut sekaligus, jadi
 * tren per tahun butuh 1 query, bukan 2 `count`. Asing ditentukan per kode
 * negara (`idNegara` terisi dan bukan IDN); baris tanpa kode jatuh ke nama.
 */
function isForeignStudent(row) {
  const code = String(row.idNegara || '')
    .trim()
    .toUpperCase();
  if (code) return code !== 'IDN';
  const nationality = String(row.kewarganegaraan || '')
    .trim()
    .toLowerCase();
  // Kewarganegaraan kosong = tidak diketahui, bukan mahasiswa internasional.
  return Boolean(nationality) && nationality !== WNI_NATIONALITY;
}

function sumNationalityRows(rows) {
  let total = 0;
  let foreign = 0;
  for (const row of rows) {
    const count = row._count.kewarganegaraan;
    total += count;
    if (isForeignStudent(row)) foreign += count;
  }
  return { total, foreign };
}

function countByNationality(where) {
  return prisma.student.groupBy({
    by: ['idNegara', 'kewarganegaraan'],
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
    percentage: roundedRate(foreign, total, null),
  };
}

module.exports = {
  getInternationalWhere,
  isForeignStudent,
  sumNationalityRows,
  countByNationality,
  toTrendRow,
};
