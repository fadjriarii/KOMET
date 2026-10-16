const { getAcademicYear } = require('./filterBuilder');
const { toArray } = require('@komet/shared/filterUtils');
const {
  isTerminalInAcademicYear,
  parseStatusSelection,
  DEFAULT_STATUS,
} = require('./snapshotConditions');

function getRequestedAcademicYear(query = {}) {
  const tahunAjaran = typeof query.tahunAjaran === 'string' ? query.tahunAjaran : null;
  const selectedPeriode = typeof query.selectedPeriode === 'string' ? query.selectedPeriode : null;
  return getAcademicYear(tahunAjaran || (selectedPeriode?.includes('/') ? selectedPeriode : null));
}

/**
 * A Student row stores the latest SEVIMA status. For historical snapshots the
 * table must instead show the status at the selected year boundary. A future
 * graduation/exit is therefore rendered as Aktif in an earlier snapshot.
 */
function getSnapshotStatus(student, academicYear, statusValues) {
  if (!academicYear) return student.statusKeaktifan;
  const { isAll, statuses } = parseStatusSelection(statusValues);
  const hasExplicitTerminalFilter = !isAll && !statuses.includes(DEFAULT_STATUS);
  if (hasExplicitTerminalFilter) return student.statusKeaktifan;

  const hasReachedFinalStatus =
    isTerminalInAcademicYear(student, academicYear) && student.statusKeaktifan !== DEFAULT_STATUS;
  return hasReachedFinalStatus ? student.statusKeaktifan : DEFAULT_STATUS;
}

function projectSnapshotStudent(student, academicYear, statusValues) {
  if (!academicYear) return student;
  return {
    ...student,
    statusKeaktifan: getSnapshotStatus(student, academicYear, statusValues),
    semester: snapshotSemester(student, academicYear),
  };
}

/**
 * Nomor semester yang dicapai sampai akhir tahun akademik terpilih (atau saat
 * keluar bila lebih dulu), dihitung dari awal studi (awal rantai transfer bila
 * ada — sama seperti angka tersimpan untuk tahun berjalan). Tanpa tahun
 * terpilih atau awal tak valid, pakai semester tersimpan.
 */
function snapshotSemester(student, academicYear) {
  if (!academicYear) return student.semester;
  const year = typeof academicYear === 'object' ? academicYear.startYear : academicYear;
  const y = Number(year);
  const startCode = (student.periodeMasukAwal || student.periodeMasuk || '').trim();
  const start = /^(\d{4})([12])$/.exec(startCode);
  if (!Number.isInteger(y) || !start) return student.semester;
  const endCode = `${y}2`;
  const exit = (student.periodeTerakhir || '').trim();
  const ref = /^(\d{4})([12])$/.exec(exit && exit <= endCode ? exit : endCode);
  if (!ref) return student.semester;
  return Math.max(
    1,
    (Number(ref[1]) - Number(start[1])) * 2 + (Number(ref[2]) - Number(start[2])) + 1,
  );
}

/** Nilai semester filter yang valid: '9+' atau bilangan bulat positif (sampah diabaikan). */
function validSemesterValues(semesterValues) {
  const values = Array.isArray(semesterValues) ? semesterValues : [semesterValues];
  return values.filter((v) => v === '9+' || (Number.isInteger(Number(v)) && Number(v) > 0));
}

/**
 * Filter semester di dalam snapshot tahun akademik, eksak terhadap nilai yang
 * tampil: cocokkan tiap baris populasi snapshot dengan semester proyeksinya.
 * SQL tidak bisa menghitung rumusnya, jadi populasi diambil dulu (kolom
 * sempit, tanpa limit — populasi snapshot paling banyak ratusan baris),
 * disaring di memori, lalu hasilnya dipakai sebagai `nim IN (...)`.
 * Tanpa kombinasi tahun+semester (atau tanpa nilai valid), filter dikembalikan
 * apa adanya — tidak ada query tambahan.
 */
async function resolveSnapshotSemesterWhere(db, whereFilter, query) {
  const academicYear = getRequestedAcademicYear(query);
  const semesterValues = validSemesterValues(toArray(query.semester));
  if (!academicYear || !semesterValues.length || !whereFilter?.semester) return whereFilter;
  const rest = { ...whereFilter };
  delete rest.semester;
  // Ratakan ke satu AND tingkat atas (bukan AND bersarang) supaya
  // `isAcademicSnapshot` di ensurePopulationFilter tetap mengenali batas
  // snapshot dan tidak menimpa status proyeksi menjadi 'Aktif' berjalan.
  const restAnd = Array.isArray(rest.AND) ? rest.AND : [];
  delete rest.AND;
  const candidates = await db.student.findMany({
    where: rest,
    select: { nim: true, periodeMasuk: true, periodeMasukAwal: true, periodeTerakhir: true },
  });
  const keep = candidates
    .filter((row) => {
      const sem = snapshotSemester(row, academicYear);
      return semesterValues.some((v) => (v === '9+' ? sem >= 9 : Number(v) === sem));
    })
    .map((row) => row.nim);
  return { ...rest, AND: [...restAnd, { nim: { in: keep } }] };
}

module.exports = {
  getRequestedAcademicYear,
  getSnapshotStatus,
  projectSnapshotStudent,
  snapshotSemester,
  resolveSnapshotSemesterWhere,
};
