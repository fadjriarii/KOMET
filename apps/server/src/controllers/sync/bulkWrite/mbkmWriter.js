const { prisma, toStr } = require('./bulk');
const { chunkBy } = require('../config');

// Satu sync MBKM penuh ±600 baris; hapus + isi dalam satu transaksi butuh lebih dari default 5 dtk.
const MBKM_TX_TIMEOUT_MS = 120_000;

const toActivityRow = (row) => ({
  idAktivitas: row.idAktivitas ?? null,
  nim: toStr(row.nim),
  periode: toStr(row.periode),
  programStudi: toStr(row.programStudi),
  fakultas: toStr(row.fakultas),
  jenjang: toStr(row.jenjang),
  statusKeaktifan: toStr(row.statusKeaktifan),
  jenisAktivitas: toStr(row.jenisAktivitas),
  idJenisKegiatan: toStr(row.idJenisKegiatan),
  judulAktivitas: toStr(row.judulAktivitas),
  mitra: toStr(row.mitra),
  statusAktivitas: toStr(row.statusAktivitas),
  idStatusAktivitas: toStr(row.idStatusAktivitas),
  tanggalMulai: toStr(row.tanggalMulai),
  tanggalSelesai: toStr(row.tanggalSelesai),
  sksKonversi: Number.isFinite(row.sksKonversi) ? row.sksKonversi : null,
  raw: row.raw ?? undefined,
});

/**
 * Ganti seluruh isi tabel MBKM secara atomik: hapus dan isi ulang dalam satu
 * transaksi. Sync yang gagal di tengah tidak meninggalkan tabel kosong atau
 * parsial, dan pembaca dashboard tidak pernah melihat setengah data.
 */
async function replaceMbkmActivities(rows) {
  return prisma.$transaction(
    async (tx) => {
      await tx.mbkmActivity.deleteMany({});
      for (const chunk of chunkBy(rows)) {
        await tx.mbkmActivity.createMany({ data: chunk.map(toActivityRow) });
      }
      return rows.length;
    },
    { timeout: MBKM_TX_TIMEOUT_MS, maxWait: MBKM_TX_TIMEOUT_MS },
  );
}

module.exports = { replaceMbkmActivities };
