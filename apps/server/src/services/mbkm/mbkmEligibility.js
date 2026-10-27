const prisma = require('../../config/prisma');
const { parsePeriode } = require('../../utils/academicUtils');
const { STUDENT_STATUS } = require('@komet/shared/constants');

/** Semester yang dihitung eligible untuk IKU MBKM. */
const MBKM_ELIGIBLE_SEMESTER = 7;

function normalizePeriode(value) {
  return String(value ?? '').trim();
}

/** Awal studi yang valid: awal rantai transfer bila ada, lalu periode masuk. */
function getStartPeriode(student = {}) {
  for (const value of [student.periodeMasukAwal, student.periodeMasuk]) {
    const periode = normalizePeriode(value);
    if (parsePeriode(periode)) return periode;
  }
  return null;
}

/**
 * Semester yang dicapai pada kode periode `YYYYT`. Selisih Ganjil/Genap
 * dihitung dua langkah per tahun, jadi 20221 -> 20251 = semester 7.
 */
function semesterAtPeriode(startPeriode, selectedPeriode) {
  const start = parsePeriode(startPeriode);
  const selected = parsePeriode(selectedPeriode);
  if (!start || !selected) return null;
  return (selected.year - start.year) * 2 + (Number(selected.term) - Number(start.term)) + 1;
}

/**
 * Aktif pada periode P = sudah masuk, belum keluar, dan bukan cuti yang sudah
 * berjalan pada P. Cuti baru berlaku sejak `periodeTerakhir`-nya, jadi periode
 * sebelum cuti tetap dihitung aktif. Status keluar tanpa periode akhir tidak
 * diketahui kapan keluarnya, jadi tidak dihitung aktif (dilaporkan di panel
 * kualitas data), bukan aktif selamanya.
 */
function isActiveAtPeriode(student = {}, selectedPeriode) {
  const start = getStartPeriode(student);
  const selected = normalizePeriode(selectedPeriode);
  if (!start || !parsePeriode(selected) || start > selected) return false;

  const exit = normalizePeriode(student.periodeTerakhir);

  if (student.statusKeaktifan === STUDENT_STATUS.CUTI) {
    return Boolean(parsePeriode(exit)) && exit > selected;
  }

  if (!parsePeriode(exit)) return student.statusKeaktifan === STUDENT_STATUS.AKTIF;
  return exit >= selected;
}

const ELIGIBILITY_SELECT = {
  nim: true,
  nama: true,
  angkatan: true,
  jenjang: true,
  periodeMasuk: true,
  periodeMasukAwal: true,
  periodeTerakhir: true,
  statusKeaktifan: true,
  programStudi: true,
  fakultas: true,
};

const isEligibleAt = (student, periode) =>
  isActiveAtPeriode(student, periode) &&
  semesterAtPeriode(getStartPeriode(student), periode) === MBKM_ELIGIBLE_SEMESTER;

/**
 * Populasi eligible MBKM: mahasiswa aktif pada periode P dan tepat semester 7.
 * API SEVIMA tidak punya field `semester`, jadi nilainya diproyeksikan dari
 * periode masuk dan periode keluar — bukan dari `Student.semester` hari ini.
 */
async function getEligibleStudentsAtPeriode(studentFilter = {}, selectedPeriode, db = prisma) {
  return getEligibleStudentsAtPeriodes(studentFilter, [selectedPeriode], db);
}

/**
 * Eligible untuk satu tahun ajaran = gabungan kohort semester 7 di Ganjil dan
 * Genap, dideduplikasi per NIM. Satu mahasiswa hanya mencapai semester 7 sekali,
 * jadi gabungan ini aman dipakai sebagai penyebut tanpa double-count. Mahasiswa
 * dimuat sekali untuk semua periode.
 */
async function getEligibleStudentsAtPeriodes(studentFilter = {}, selectedPeriods, db = prisma) {
  const periods = (Array.isArray(selectedPeriods) ? selectedPeriods : [selectedPeriods]).filter(
    (periode) => parsePeriode(periode),
  );
  if (!periods.length) return [];

  const students = await db.student.findMany({ where: studentFilter, select: ELIGIBILITY_SELECT });
  return students.filter((student) => periods.some((periode) => isEligibleAt(student, periode)));
}

module.exports = {
  MBKM_ELIGIBLE_SEMESTER,
  getStartPeriode,
  semesterAtPeriode,
  isActiveAtPeriode,
  getEligibleStudentsAtPeriode,
  getEligibleStudentsAtPeriodes,
};
