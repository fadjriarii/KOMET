const prisma = require('../../config/prisma');
const logger = require('../../utils/logger');
const syncJobTracker = require('../../utils/syncJobTracker');
const createSyncHandler = require('./createSyncHandler');
const { deduplicateStudents } = require('../../services/studentDeduplicationService');
const {
  cleanText,
  sanitizeText,
  sanitizeProdiName,
  normalizeOptionalText,
  resolveTargetNimBatch,
  getProdiFakultasMap,
  paginateSevimaPages,
  bulkCreateMbkmActivities,
} = require('./helpers');

function resolveFakultas(attr, prodiName, prodiFakultasMap) {
  const rawProdi = attr.program_studi || '';
  return sanitizeText(
    prodiFakultasMap.get(cleanText(rawProdi)) ||
      prodiFakultasMap.get(cleanText(prodiName)) ||
      prodiFakultasMap.get(rawProdi.trim().toLowerCase()) ||
      prodiFakultasMap.get(prodiName.trim().toLowerCase()) ||
      '',
  );
}

// 3. ETL Sinkronisasi MBKM (MbkmActivity)
const executeSyncMbkm = async ({ runDedup = true } = {}) => {
  logger.info('🔄 Memulai proses ETL: Data Aktivitas MBKM dari SEVIMA API...');
  const prodiFakultasMap = await getProdiFakultasMap();

  let totalSynced = 0;
  let totalSkipped = 0;

  // Bersihkan data aktivitas MBKM lama sebelum sinkronisasi ulang agar id selalu valid
  await prisma.mbkmActivity.deleteMany({});
  syncJobTracker.updateProgress('mbkm', { status: 'running', page: 1, totalPages: 0 });

  await paginateSevimaPages({
    endpoint: '/siakadcloud/v1/aktivitas-mbkm',
    onPage: async (listData, { page, totalPages }) => {
      const validItems = [];
      for (const item of listData) {
        const attr = item.attributes;
        // Aktivitas tanpa jenis bukan aktivitas MBKM — dibuang di ETL, bukan disaring saat baca.
        const jenisAktivitas = normalizeOptionalText(attr.jenis_kegiatan);
        if (!attr.nim || !jenisAktivitas) {
          totalSkipped++;
          continue;
        }

        const prodiName = sanitizeProdiName(attr.program_studi || '');

        validItems.push({
          nim: attr.nim,
          nama_mahasiswa: attr.nama_mahasiswa || '',
          jenjang: attr.id_jenjang_program_studi || 'S1',
          periode: attr.id_periode || '',
          programStudi: prodiName,
          fakultas: resolveFakultas(attr, prodiName, prodiFakultasMap),
          jenisAktivitas,
          judulAktivitas: normalizeOptionalText(attr.judul_aktivitas),
          mitra: normalizeOptionalText(attr.nama_mitra),
          statusAktivitas: attr.status_aktivitas || '',
        });
      }

      if (validItems.length > 0) {
        // Bulk pre-fetch NIM Resolution (Menghilangkan N+1 Query)
        const nimMap = await resolveTargetNimBatch(
          validItems,
          (item) => item.nim,
          (item) => item.nama_mahasiswa,
          (item) => item,
        );

        const targetNims = [...new Set(validItems.map((item) => nimMap.get(item) || item.nim))];
        // statusKeaktifan denormalisasi diambil dari baris mahasiswa terkait, bukan dari
        // judul aktivitas (value lama membuat kolom ini tidak pernah cocok dengan status apa pun).
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
        totalSynced += validItems.length;
      }

      syncJobTracker.updateProgress('mbkm', {
        page,
        totalPages,
        synced: totalSynced,
        skipped: totalSkipped,
      });
    },
  });

  let deduplicationResult = null;
  if (runDedup) deduplicationResult = await deduplicateStudents();

  syncJobTracker.updateProgress('mbkm', {
    status: 'completed',
    synced: totalSynced,
    skipped: totalSkipped,
  });
  logger.success(
    `[MBKM] Selesai! ${totalSynced} data aktivitas MBKM disinkronkan, ${deduplicationResult?.deletedMbkmCount || 0} duplikat dibersihkan.`,
  );
  return { totalSynced, totalSkipped, deduplication: deduplicationResult };
};

module.exports = createSyncHandler({
  moduleName: 'mbkm',
  label: 'Sinkronisasi MBKM',
  execute: executeSyncMbkm,
  successMessage: (result) =>
    `Sinkronisasi sukses! Total ${result.totalSynced} data aktivitas MBKM berhasil diperbarui.`,
});

module.exports.executeSyncMbkm = executeSyncMbkm;
