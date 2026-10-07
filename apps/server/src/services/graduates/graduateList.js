/**
 * graduateList.js
 *
 * Query daftar lulusan dengan filter lengkap, kalkulasi predikatLulus, dan pagination.
 */

const prisma = require('../../config/prisma');
const { calculatePredikat } = require('../../utils/graduateUtils');
const { paginateList } = require('../../utils/paginationUtils');
const { TABLE_LIMIT } = require('@komet/shared/constants');

async function getGraduateList(whereFilter, page = 1, limit = TABLE_LIMIT) {
  const { rows, pagination } = await paginateList(prisma.graduate, {
    where: whereFilter,
    select: {
      id: true,
      nim: true,
      jenjang: true,
      statusKelulusan: true,
      tahunLulus: true,
      periodeWisuda: true,
      ipk: true,
      sksLulus: true,
      student: {
        select: {
          nama: true,
          angkatan: true,
          programStudi: true,
          fakultas: true,
          statusKeaktifan: true,
        },
      },
    },
    orderBy: [{ tahunLulus: 'desc' }, { student: { nama: 'asc' } }],
    page,
    limit,
  });

  // Kontrak daftar lulusan: camelCase saja — tanpa salinan snake_case per kolom.
  const data = rows.map((g) => ({
    id: g.id,
    nim: g.nim,
    nama: g.student?.nama || '',
    angkatan: g.student?.angkatan || '',
    programStudi: g.student?.programStudi || '',
    fakultas: g.student?.fakultas || '',
    jenjang: g.jenjang,
    // `tahunLulus` String sesuai skema; mengubahnya jadi angka di sini membuat
    // daftar dan jalur tren memakai dua tipe untuk kolom yang sama.
    tahunLulus: g.tahunLulus,
    ipk: g.ipk,
    sksLulus: g.sksLulus,
    // Status terkini berasal dari data, bukan label yang dikarang per baris.
    statusKeaktifan: g.student?.statusKeaktifan ?? null,
    predikatLulus: calculatePredikat(g.ipk, true),
    statusKelulusan: g.statusKelulusan,
  }));

  return { data, pagination };
}

module.exports = { getGraduateList };
