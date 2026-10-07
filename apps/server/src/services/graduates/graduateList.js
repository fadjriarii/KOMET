/**
 * graduateList.js
 *
 * Query daftar lulusan dengan filter lengkap, kalkulasi predikatLulus, dan pagination.
 */

const prisma = require('../../config/prisma');
const { calculatePredikat } = require('../../utils/graduateUtils');
const { TABLE_LIMIT } = require('@komet/shared/constants');

async function getGraduateList(whereFilter, page = 1, limit = TABLE_LIMIT) {
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.graduate.findMany({
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
      skip,
      take: limit,
      orderBy: [{ tahunLulus: 'desc' }, { student: { nama: 'asc' } }],
    }),
    prisma.graduate.count({ where: whereFilter }),
  ]);

  // Kontrak daftar lulusan: camelCase saja — tanpa salinan snake_case per kolom.
  const rows = data.map((g) => {
    const tahunLulusNum = g.tahunLulus ? parseInt(g.tahunLulus) || g.tahunLulus : g.tahunLulus;
    return {
      id: g.id,
      nim: g.nim,
      nama: g.student?.nama || '',
      angkatan: g.student?.angkatan || '',
      programStudi: g.student?.programStudi || '',
      fakultas: g.student?.fakultas || '',
      jenjang: g.jenjang,
      tahunLulus: tahunLulusNum,
      ipk: g.ipk,
      sksLulus: g.sksLulus,
      // Status terkini berasal dari data, bukan label yang dikarang per baris.
      statusKeaktifan: g.student?.statusKeaktifan ?? null,
      predikatLulus: calculatePredikat(g.ipk, true),
      statusKelulusan: g.statusKelulusan,
    };
  });

  return {
    data: rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

module.exports = { getGraduateList };
