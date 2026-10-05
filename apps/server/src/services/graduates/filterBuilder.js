/**
 * filterBuilder.js
 *
 * Mengkonversi query parameters dari HTTP request menjadi Prisma where clause
 * untuk tabel graduates (dan relasi student).
 */

const { getPaginationParams } = require('../../utils/paginationUtils');
const { addInFilter, addSearchFilter, hasFilters } = require('../shared/filterUtils');

function buildGraduateFilter(query) {
  const {
    programStudi,
    tahunLulus,
    periodeWisuda,
    statusKelulusan,
    fakultas,
    periodeMasuk,
    jenjang,
    search,
  } = query;

  const where = {};

  // Filter langsung di tabel graduates
  addInFilter(where, 'jenjang', jenjang);
  addInFilter(where, 'tahunLulus', tahunLulus);
  addInFilter(where, 'periodeWisuda', periodeWisuda);
  addInFilter(where, 'statusKelulusan', statusKelulusan);

  // Filter lewat relasi ke student
  const studentFilter = {};
  addInFilter(studentFilter, 'programStudi', programStudi);
  addInFilter(studentFilter, 'fakultas', fakultas);
  if (periodeMasuk) studentFilter.periodeMasuk = periodeMasuk;
  addSearchFilter(studentFilter, search);

  if (hasFilters(studentFilter)) {
    where.student = studentFilter;
  }

  return where;
}

module.exports = { buildGraduateFilter, getPaginationParams };
