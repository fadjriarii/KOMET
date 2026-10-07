const prisma = require('../../config/prisma');
const { TABLE_LIMIT } = require('@komet/shared/constants');
const { getAcademicYear } = require('./filterBuilder');
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
  return { ...student, statusKeaktifan: getSnapshotStatus(student, academicYear, statusValues) };
}

/**
 * Daftar mahasiswa. `whereFilter` (termasuk status) sepenuhnya dimiliki
 * buildStudentFilter(); fungsi ini hanya menambah pagination dan proyeksi kolom.
 *
 * Urutan selalu `nim` ascending karena itu satu-satunya kunci yang stabil untuk
 * keyset pagination (`cursor`).
 *
 * @param {object} whereFilter Prisma where clause dari buildStudentFilter()
 * @param {number} page        Halaman untuk mode offset (default 1)
 * @param {number} limit       Baris per halaman (default TABLE_LIMIT)
 * @param {string} cursor      NIM terakhir; bila ada, mode offset diabaikan dan
 *                             total tidak dihitung (COUNT penuh tidak dibutuhkan
 *                             oleh konsumen cursor).
 */
async function getStudentList(whereFilter, page = 1, limit = TABLE_LIMIT, cursor, query = {}) {
  if (cursor) {
    const cursorStudent = await prisma.student.findUnique({
      where: { nim: cursor },
      select: { nim: true },
    });
    if (!cursorStudent) {
      const error = new Error('Invalid cursor.');
      error.statusCode = 400;
      throw error;
    }
  }

  const listQuery = buildStudentListQuery(whereFilter, page, limit, cursor);
  const [rawData, total] = await Promise.all([
    prisma.student.findMany(listQuery),
    cursor ? null : prisma.student.count({ where: whereFilter }),
  ]);

  const hasNextPage = rawData.length > limit;
  const academicYear = getRequestedAcademicYear(query);
  const data = rawData
    .slice(0, limit)
    .map((student) => projectSnapshotStudent(student, academicYear, query.statusKeaktifan));
  return {
    data,
    nextCursor: hasNextPage ? data[data.length - 1].nim : null,
    hasNextPage,
    pagination: {
      page: cursor ? null : page,
      limit,
      total,
      totalPages: total === null ? null : Math.ceil(total / limit),
    },
  };
}

function buildStudentListQuery(whereFilter, page, limit, cursor) {
  const skip = (page - 1) * limit;
  const query = {
    where: whereFilter,
    select: {
      nim: true,
      nama: true,
      angkatan: true,
      periode: true,
      periodeMasuk: true,
      periodeTerakhir: true,
      programStudi: true,
      fakultas: true,
      jenjang: true,
      semester: true,
      kewarganegaraan: true,
      statusKeaktifan: true,
    },
    take: limit + 1,
    orderBy: { nim: 'asc' },
  };

  if (cursor) {
    query.cursor = { nim: cursor };
    query.skip = 1;
  } else query.skip = skip;

  return query;
}

module.exports = {
  getStudentList,
  buildStudentListQuery,
  getRequestedAcademicYear,
  getSnapshotStatus,
  projectSnapshotStudent,
};
