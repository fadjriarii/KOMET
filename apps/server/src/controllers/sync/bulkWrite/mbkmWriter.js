const { prisma, toStr } = require('./bulk');
const { chunkBy } = require('../config');

/**
 * MBKM selalu di-truncate sebelum sinkronisasi, jadi cukup satu createMany per chunk
 * tanpa upsert per baris.
 */
async function bulkCreateMbkmActivities(rows) {
  if (!rows || rows.length === 0) return 0;
  for (const chunk of chunkBy(rows)) {
    await prisma.mbkmActivity.createMany({
      data: chunk.map((row) => ({
        nim: toStr(row.nim),
        periode: toStr(row.periode),
        programStudi: toStr(row.programStudi),
        fakultas: toStr(row.fakultas),
        jenjang: toStr(row.jenjang),
        statusKeaktifan: toStr(row.statusKeaktifan),
        jenisAktivitas: toStr(row.jenisAktivitas),
        judulAktivitas: toStr(row.judulAktivitas),
        mitra: toStr(row.mitra),
        statusAktivitas: toStr(row.statusAktivitas),
      })),
    });
  }
  return rows.length;
}

module.exports = { bulkCreateMbkmActivities };
