/**
 * Mem-build Prisma where clause untuk query mbkm_activities
 * berdasarkan query parameters dari request.
 */

const prisma = require('../../config/prisma');
const { getPaginationParams } = require('../../utils/paginationUtils');
const { addInFilter, addSearchFilter, hasFilters } = require('../shared/filterUtils');

function buildMbkmFilter(query) {
  const { search, fakultas, programStudi, angkatan, statusAktivitas, jenjang, periode } = query;

  const where = {};

  // Filter langsung di tabel mbkm_activities
  if (periode) where.periode = periode;

  addInFilter(where, 'statusAktivitas', statusAktivitas);
  addInFilter(where, 'jenjang', jenjang);
  addInFilter(where, 'fakultas', fakultas);
  addInFilter(where, 'programStudi', programStudi);

  // Filter via relasi ke student
  const studentFilter = {};

  addInFilter(studentFilter, 'angkatan', angkatan);
  addSearchFilter(studentFilter, search);

  if (hasFilters(studentFilter)) {
    where.student = studentFilter;
  }

  return where;
}

// Helper untuk mendapatkan periode terbaru dari database
async function getDefaultPeriode() {
  const latest = await prisma.mbkmActivity.findFirst({
    orderBy: { periode: 'desc' },
    select: { periode: true },
  });
  return latest?.periode || null;
}

// Helper untuk menghitung periode sebelumnya
function getPreviousPeriode(currentPeriode) {
  if (typeof currentPeriode !== 'string' || currentPeriode.length < 5) return null;
  const year = parseInt(currentPeriode.substring(0, 4));
  const sem = parseInt(currentPeriode.substring(4));
  return sem === 1 ? `${year - 1}2` : `${year}1`;
}

/**
 * Build student where clause dari query params MBKM
 * (untuk endpoint yang query ke tabel students, seperti eligible students dan rate)
 */
function buildStudentFilterFromMbkmQuery(query) {
  const studentFilter = {};
  addInFilter(studentFilter, 'angkatan', query.angkatan);
  addInFilter(studentFilter, 'fakultas', query.fakultas);
  addInFilter(studentFilter, 'programStudi', query.programStudi);
  addInFilter(studentFilter, 'jenjang', query.jenjang);
  return studentFilter;
}

module.exports = {
  buildMbkmFilter,
  getPaginationParams,
  getDefaultPeriode,
  getPreviousPeriode,
  buildStudentFilterFromMbkmQuery,
};
