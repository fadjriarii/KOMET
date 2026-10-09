/**
 * graduateList.js
 *
 * Daftar lulusan dibaca dari tabel students (base Lulus, left join graduate
 * untuk field kelulusan) — total tabel = total kartu by construction.
 * 5 orphan Lulus tanpa baris graduate tampil dengan field '-' (bukan hilang).
 */

const prisma = require('../../config/prisma');
const { calculatePredikat } = require('../../utils/graduateUtils');
const { paginateList } = require('../../utils/paginationUtils');
const { TABLE_LIMIT } = require('@komet/shared/constants');

async function getGraduateList(whereFilter, page = 1, limit = TABLE_LIMIT) {
  const { rows, pagination } = await paginateList(prisma.student, {
    where: whereFilter,
    select: {
      nim: true,
      nama: true,
      angkatan: true,
      programStudi: true,
      fakultas: true,
      jenjang: true,
      statusKeaktifan: true,
      graduate: {
        select: {
          jenjang: true,
          statusKelulusan: true,
          predikatLulus: true,
          tahunLulus: true,
          periodeWisuda: true,
          ipk: true,
          sksLulus: true,
        },
      },
    },
    orderBy: [{ nama: 'asc' }],
    page,
    limit,
  });

  // Kontrak daftar lulusan: camelCase saja — tanpa salinan snake_case per kolom.
  const data = rows.map((s) => {
    const g = s.graduate;
    return {
      id: s.nim,
      nim: s.nim,
      nama: s.nama || '',
      angkatan: s.angkatan || '',
      programStudi: s.programStudi || '',
      fakultas: s.fakultas || '',
      jenjang: s.jenjang,
      // `tahunLulus` String sesuai skema; orphan tanpa baris graduate = null.
      tahunLulus: g?.tahunLulus ?? null,
      ipk: g?.ipk ?? null,
      sksLulus: g?.sksLulus ?? null,
      // Status terkini berasal dari data, bukan label yang dikarang per baris.
      statusKeaktifan: s.statusKeaktifan ?? null,
      // Label resmi dari SK yudisium; ambang IPK hanya dipakai untuk baris yang
      // belum disinkron ulang sejak kolom `predikatLulus` ada.
      predikatLulus: g?.predikatLulus || calculatePredikat(g?.ipk),
      statusKelulusan: g?.statusKelulusan ?? 'Lulus',
    };
  });

  return { data, pagination };
}

module.exports = { getGraduateList };
