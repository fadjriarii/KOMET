const prisma = require('../../config/prisma');
const { resolveTargetNimBatch } = require('./sevimaLookup');
const { bulkCreateMbkmActivities } = require('./bulkWrite');

/**
 * Tulis satu halaman aktivitas: resolusi NIM tanpa N+1 query, denormalisasi
 * statusKeaktifan dari baris mahasiswa terkait (bukan dari judul aktivitas —
 * value lama membuat kolom ini tidak pernah cocok dengan status apa pun),
 * lalu bulk insert.
 *
 * @returns jumlah baris yang ditulis
 */
async function writeMbkmPage(validItems) {
  // Bulk pre-fetch NIM Resolution (Menghilangkan N+1 Query)
  const nimMap = await resolveTargetNimBatch(
    validItems,
    (item) => item.nim,
    (item) => item.nama_mahasiswa,
    (item) => item,
  );

  const targetNims = [...new Set(validItems.map((item) => nimMap.get(item) || item.nim))];
  const studentRows = await prisma.student.findMany({
    where: { nim: { in: targetNims } },
    select: { nim: true, statusKeaktifan: true },
  });
  const statusByNim = new Map(studentRows.map((row) => [row.nim, row.statusKeaktifan]));

  await bulkCreateMbkmActivities(
    validItems.map((item) => {
      const nim = nimMap.get(item) || item.nim;
      return {
        nim,
        periode: item.periode,
        programStudi: item.programStudi,
        fakultas: item.fakultas,
        jenjang: item.jenjang,
        statusKeaktifan: statusByNim.get(nim) || '',
        jenisAktivitas: item.jenisAktivitas,
        judulAktivitas: item.judulAktivitas,
        mitra: item.mitra,
        statusAktivitas: item.statusAktivitas,
      };
    }),
  );
  return validItems.length;
}

module.exports = { writeMbkmPage };
