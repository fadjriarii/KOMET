const prisma = require('../../config/prisma');
const { paginateList } = require('../../utils/paginationUtils');
const { TABLE_LIMIT } = require('@komet/shared/constants');

async function getMbkmList(whereFilter, page = 1, limit = TABLE_LIMIT) {
  const { rows, pagination } = await paginateList(prisma.mbkmActivity, {
    where: whereFilter,
    select: {
      id: true,
      nim: true,
      periode: true,
      programStudi: true,
      fakultas: true,
      jenjang: true,
      statusKeaktifan: true,
      jenisAktivitas: true,
      judulAktivitas: true,
      mitra: true,
      statusAktivitas: true,
      student: {
        select: {
          nama: true,
          angkatan: true,
        },
      },
    },
    orderBy: [{ periode: 'desc' }, { student: { nama: 'asc' } }],
    page,
    limit,
  });

  // Kontrak daftar MBKM: camelCase saja, tanpa nomor baris (presentasi client).
  const data = rows.map((item) => ({
    id: item.id,
    nim: item.nim,
    nama: item.student?.nama || '',
    periode: item.periode,
    tahun: item.periode ? item.periode.substring(0, 4) : '',
    angkatan: item.student?.angkatan || '',
    programStudi: item.programStudi,
    fakultas: item.fakultas,
    jenjang: item.jenjang,
    statusKeaktifan: item.statusKeaktifan,
    jenisAktivitas: item.jenisAktivitas,
    judulAktivitas: item.judulAktivitas,
    mitra: item.mitra,
    statusAktivitas: item.statusAktivitas,
  }));

  return { data, pagination };
}

module.exports = { getMbkmList };
