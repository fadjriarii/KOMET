/**
 * Kondisi snapshot tahun akademik.
 *
 * `statusKeaktifan` adalah status terbaru dari SEVIMA, sedangkan `periodeTerakhir`
 * adalah periode di mana mahasiswa non-aktif keluar/ganti status. Menerapkan
 * `statusKeaktifan = 'Aktif'` langsung karena itu kehilangan mahasiswa yang lulus
 * di tahun berikutnya; menerapkan `Lulus` langsung karena itu membocorkan
 * kelulusan tahun depan ke snapshot tahun lama.
 *
 * Untuk tahun akademik T:
 * - Aktif: record Aktif saat ini, record tanpa periode keluar, atau record yang
 *   periode keluarnya jatuh pada atau setelah T. Mereka masih aktif di T.
 * - Status lain: status terakhirnya dihitung mulai tahun akademik SETELAH periode
 *   keluarnya. Satu record tidak pernah Aktif dan terminal di tahun yang sama.
 * - Semua status: setiap mahasiswa yang masuk s.d. T ikut; status tampilan tiap
 *   baris diproyeksikan terpisah oleh `studentList`.
 *
 * Aturan yang sama dipakai dua cara: sebagai predikat Prisma di sini, dan sebagai
 * penilai JavaScript (`matchesStudentCondition`) untuk memproyeksi baris tabel —
 * jadi proyeksi tidak pernah menjadi implementasi paralel dari kondisi SQL.
 */
const { toArray } = require('@komet/shared/filterUtils');
const { ALL_STATUSES, DEFAULT_STATUS } = require('./snapshot/status');
const {
  getAcademicPeriodBounds,
  buildTerminalPeriodCondition,
  buildActiveSnapshotCondition,
} = require('./snapshot/bounds');
const { matchesStudentCondition } = require('./snapshot/match');

/** @returns {{isAll: boolean, statuses: string[]}} pemilihan status ternormalisasi. */
function parseStatusSelection(statusValues) {
  const values = (toArray(statusValues) || []).filter(Boolean);
  if (values.includes(ALL_STATUSES)) return { isAll: true, statuses: [] };
  return { isAll: false, statuses: values.length ? values : [DEFAULT_STATUS] };
}

/**
 * Status akhir mana yang sudah tercapai pada tahun akademik `academicYear`.
 * Satu sumber kebenaran dengan `buildTerminalPeriodCondition` — kondisi yang
 * sama dievaluasi di sini, tidak diulang sebagai cabang `if` tersendiri.
 */
function isTerminalInAcademicYear(student, academicYear) {
  const { start, end } = getAcademicPeriodBounds(academicYear);
  return matchesStudentCondition(student, buildTerminalPeriodCondition(start, end));
}

function buildSnapshotStatusCondition(academicStart, academicEnd, statusValues) {
  const { isAll, statuses } = parseStatusSelection(statusValues);
  if (isAll) return null;

  const branches = [];
  if (statuses.includes(DEFAULT_STATUS)) {
    branches.push(buildActiveSnapshotCondition(academicEnd));
  }

  const terminalStatuses = statuses.filter((status) => status !== DEFAULT_STATUS);
  if (terminalStatuses.length) {
    branches.push({
      AND: [
        {
          statusKeaktifan:
            terminalStatuses.length === 1 ? terminalStatuses[0] : { in: terminalStatuses },
        },
        buildTerminalPeriodCondition(academicStart, academicEnd),
      ],
    });
  }

  return branches.length ? { OR: branches } : null;
}

/** Snapshot predicates for one academic year. */
function buildAcademicYearFilter(academicYear, statusValues) {
  if (!academicYear) return [];
  const { start, end } = getAcademicPeriodBounds(academicYear);
  const conditions = [{ periodeMasuk: { lte: end } }];
  const snapshotStatusCondition = buildSnapshotStatusCondition(start, end, statusValues);
  if (snapshotStatusCondition) conditions.push(snapshotStatusCondition);
  return conditions;
}

module.exports = {
  ALL_STATUSES,
  DEFAULT_STATUS,
  parseStatusSelection,
  getAcademicPeriodBounds,
  buildTerminalPeriodCondition,
  matchesStudentCondition,
  isTerminalInAcademicYear,
  buildAcademicYearFilter,
};
