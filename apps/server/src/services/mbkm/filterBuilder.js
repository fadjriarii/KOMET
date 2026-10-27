/**
 * Periode terpilih dan filter mahasiswa untuk query MBKM. Filter aktivitas
 * (jenis, status, pencarian) dirakit di `population.js`, satu-satunya pemakai.
 */

const prisma = require('../../config/prisma');
const { getAcademicYearStart, toAcademicYear } = require('../../utils/academicUtils');
const { addInFilter } = require('@komet/shared/filterUtils');

// Helper untuk mendapatkan periode terbaru dari database
async function getDefaultPeriode() {
  // Hanya Ganjil/Genap: kode lain (mis. `YYYY3`) tidak boleh menjadi default.
  const latest = await prisma.mbkmActivity.findFirst({
    where: { OR: [{ periode: { endsWith: '1' } }, { periode: { endsWith: '2' } }] },
    orderBy: { periode: 'desc' },
    select: { periode: true },
  });
  return latest?.periode || null;
}

/**
 * Satu tahun ajaran selalu berisi dua periode: `YYYY1` (Ganjil) dan `YYYY2`
 * (Genap). Tabel dan kartu menampilkan total keduanya saat user hanya memilih
 * tahun ajaran; filter periode eksplisit tetap memenangkan salah satunya.
 */
function getAcademicYearPeriods(tahunAjaran) {
  const start = getAcademicYearStart(tahunAjaran);
  return start === null ? [] : [`${start}1`, `${start}2`];
}

/** Daftar periode efektif: periode eksplisit > dua periode tahun ajaran > tahun terbaru. */
async function resolvePeriods(query = {}) {
  if (query.periode) return [query.periode];

  const yearPeriods = getAcademicYearPeriods(query.tahunAjaran);
  if (yearPeriods.length) return yearPeriods;

  // Default data-driven: kedua periode tahun ajaran terbaru di data MBKM (ADR 0005).
  const latest = await getDefaultPeriode();
  return latest ? getAcademicYearPeriods(toAcademicYear(latest)) : [];
}

/** Filter populasi mahasiswa (kolom Student) untuk eligible dan aktivitas. */
function buildStudentFilterFromMbkmQuery(query) {
  const studentFilter = {};
  addInFilter(studentFilter, 'angkatan', query.angkatan);
  addInFilter(studentFilter, 'fakultas', query.fakultas);
  addInFilter(studentFilter, 'programStudi', query.programStudi);
  addInFilter(studentFilter, 'jenjang', query.jenjang);
  return studentFilter;
}

module.exports = {
  getDefaultPeriode,
  getAcademicYearPeriods,
  resolvePeriods,
  buildStudentFilterFromMbkmQuery,
};
