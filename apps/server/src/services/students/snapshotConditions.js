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
const { toArray } = require('../shared/filterUtils');
const { STUDENT_STATUS } = require('@komet/shared/constants');

/**
 * Satu encoding untuk "semua status": sentinel ALL dari klien. Nilai kosong
 * atau tidak dikirim berarti populasi default dashboard (DEFAULT_STATUS).
 */
const ALL_STATUSES = 'ALL';
const DEFAULT_STATUS = STUDENT_STATUS.AKTIF;

/** @returns {{isAll: boolean, statuses: string[]}} pemilihan status ternormalisasi. */
function parseStatusSelection(statusValues) {
  const values = (toArray(statusValues) || []).filter(Boolean);
  if (values.includes(ALL_STATUSES)) return { isAll: true, statuses: [] };
  return { isAll: false, statuses: values.length ? values : [DEFAULT_STATUS] };
}

/** Batas periode kode (`YYYY1`/`YYYY2`) untuk satu tahun akademik. */
function getAcademicPeriodBounds(academicYear) {
  const startYear =
    typeof academicYear === 'object' && academicYear ? academicYear.startYear : academicYear;
  return { start: `${startYear}1`, end: `${startYear}2` };
}

function buildTerminalPeriodCondition(academicStart, academicEnd) {
  return {
    OR: [
      { periodeTerakhir: { not: '', lt: academicStart } },
      { periodeTerakhir: academicStart },
      { AND: [{ periodeTerakhir: academicEnd }, { periodeMasuk: { endsWith: '1' } }] },
    ],
  };
}

function buildActiveSnapshotCondition(academicStart, academicEnd) {
  return {
    OR: [
      { statusKeaktifan: DEFAULT_STATUS },
      { periodeTerakhir: '' },
      { periodeTerakhir: { gt: academicEnd } },
      { AND: [{ periodeTerakhir: academicEnd }, { periodeMasuk: { endsWith: '2' } }] },
    ],
  };
}

/**
 * Penilai kondisi Prisma skala kecil untuk SATU baris mahasiswa. Operator yang
 * belum dikenali melempar error — diam-diam mengembalikan `true`/`false` akan
 * membuat kondisi baru terlihat cocok padahal tidak.
 */
function matchesFieldValue(value, rule) {
  const actual = String(value ?? '');
  if (rule === null || typeof rule === 'string' || typeof rule === 'number') {
    return actual === String(rule);
  }
  return Object.entries(rule).every(([operator, operand]) => {
    switch (operator) {
      case 'equals':
        return actual === String(operand);
      // Perbandingan string murni seperti MySQL; nilai kosong sengaja TIDAK
      // dikecualikan di sini — kondisi yang butuh "harus terisi" menyatakan
      // `{ not: '' }` sendiri, sama seperti di SQL.
      case 'lt':
        return actual < String(operand);
      case 'lte':
        return actual <= String(operand);
      case 'gt':
        return actual > String(operand);
      case 'gte':
        return actual >= String(operand);
      case 'not':
        return actual !== String(operand);
      case 'in':
        return operand.map(String).includes(actual);
      case 'endsWith':
        return actual.endsWith(String(operand));
      case 'startsWith':
        return actual.startsWith(String(operand));
      default:
        throw new Error(`matchesFieldValue: operator "${operator}" belum didukung`);
    }
  });
}

function matchesStudentCondition(row = {}, condition = {}) {
  return Object.entries(condition).every(([key, rule]) => {
    if (key === 'AND') return rule.every((nested) => matchesStudentCondition(row, nested));
    if (key === 'OR') return rule.some((nested) => matchesStudentCondition(row, nested));
    if (key === 'NOT') return !matchesStudentCondition(row, rule);
    return matchesFieldValue(row[key], rule);
  });
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
    branches.push(buildActiveSnapshotCondition(academicStart, academicEnd));
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
