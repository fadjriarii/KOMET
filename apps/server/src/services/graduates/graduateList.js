/**
 * graduateList.js
 *
 * Daftar lulusan dibaca dari tabel students yang punya baris graduate
 * (populasi `/kelulusan`; inner join lewat where builder — graduate field
 * di-select lewat relasi) — total tabel = total kartu by construction.
 * Lulusan yang tidak diterbitkan endpoint `/kelulusan` tetap tampil setelah
 * baris graduate-nya dimasukkan manual ke database.
 */

const prisma = require('../../config/prisma');
const { calculatePredikat } = require('../../utils/graduateUtils');
const { paginateList } = require('../../utils/paginationUtils');
const { withTahunAjaranAnchor } = require('./tahunAjaran');
const { TABLE_LIMIT } = require('@komet/shared/constants');

async function getGraduateList(whereFilter, page = 1, limit = TABLE_LIMIT) {
  // Jangkar `tahunAjaran` (meta transport Opsi A) memotong tabel seperti kartu:
  // tanpa filter tahunLulus eksplisit, tabel = "lulus sampai tahun ajaran itu".
  // Tanpa ini kartu dan tabel menjawab dua rentang berbeda pada jangkar yang sama.
  const { rows, pagination } = await paginateList(prisma.student, {
    where: withTahunAjaranAnchor(whereFilter),
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
