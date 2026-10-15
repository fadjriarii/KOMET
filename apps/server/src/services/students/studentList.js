const prisma = require('../../config/prisma');
const { TABLE_LIMIT } = require('@komet/shared/constants');
const {
  getRequestedAcademicYear,
  getSnapshotStatus,
  projectSnapshotStudent,
  resolveSnapshotSemesterWhere,
} = require('./studentSnapshot');

/**
 * Daftar mahasiswa. `whereFilter` (termasuk status) sepenuhnya dimiliki
 * buildStudentFilter(); fungsi ini hanya menambah pagination dan proyeksi kolom.
 *
 * Tabel ber-offset diurut terbaru dulu (lihat `buildStudentListQuery`). Jalur
 * `cursor` tetap `nim` ascending karena itu satu-satunya kunci yang stabil untuk
 * keyset pagination.
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

  // Filter semester + tahun ajaran diselesaikan dulu menjadi daftar NIM
  // (nilai tampil tidak bisa dihitung di SQL) agar list dan total konsisten.
  const where = await resolveSnapshotSemesterWhere(prisma, whereFilter, query);
  const listQuery = buildStudentListQuery(where, page, limit, cursor);
  const [rawData, total] = await Promise.all([
    prisma.student.findMany(listQuery),
    cursor ? null : prisma.student.count({ where }),
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
      periodeMasukAwal: true,
      periodeTerakhir: true,
      programStudi: true,
      fakultas: true,
      jenjang: true,
      semester: true,
      kewarganegaraan: true,
      statusKeaktifan: true,
    },
    take: limit + 1,
    // Mahasiswa terbaru di atas: angkatan tertinggi (masih semester 1) dulu,
    // periode masuk Ganjil/Genap mengikuti, `nim` menutup ties supaya urutan
    // antar halaman tidak bergeser.
    orderBy: cursor
      ? { nim: 'asc' }
      : [{ angkatan: 'desc' }, { periodeMasuk: 'desc' }, { nim: 'desc' }],
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
