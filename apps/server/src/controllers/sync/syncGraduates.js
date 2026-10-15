const logger = require('../../utils/logger');
const prisma = require('../../config/prisma');
const syncJobTracker = require('../../utils/syncJobTracker');
const createSyncHandler = require('./createSyncHandler');
const { deduplicateStudents } = require('../../services/studentDeduplicationService');
const { mapGraduateRow, toGraduateBulkRow } = require('./mapGraduateRow');
const { insertManualGraduates } = require('./manualGraduateWriter');
const { resolveTargetNimBatch, paginateSevimaPages } = require('./sevimaLookup');
const { bulkUpsertGraduates } = require('./bulkWrite');
const { STUDENT_STATUS } = require('@komet/shared/constants');

// 2. ETL Sinkronisasi Kelulusan (Graduate)
const executeSyncGraduates = async ({ runDedup = true } = {}) => {
  logger.info('🔄 Memulai proses ETL: Data Kelulusan dari SEVIMA API...');

  let totalSynced = 0;
  let totalSkipped = 0;
  // NIM yang benar-benar diterbitkan `/kelulusan` — dasar keputusan baris manual.
  const syncedNims = new Set();

  syncJobTracker.updateProgress('graduates', { status: 'running', page: 1, totalPages: 0 });

  // Publikasi ulang, bukan tambah-timpa: tabel dibuang lebih dulu agar lulusan
  // yang tidak lagi diterbitkan endpoint (mis. dibatalkan) tidak tertinggal
  // selamanya sebagai baris basi. Pola yang sama dipakai MBKM.
  await prisma.graduate.deleteMany({});

  await paginateSevimaPages({
    endpoint: '/siakadcloud/v1/kelulusan',
    onPage: async (listData, { page, totalPages }) => {
      const validItems = [];
      for (const item of listData) {
        const row = mapGraduateRow(item.attributes);
        if (!row) {
          totalSkipped++;
          continue;
        }
        validItems.push(row);
      }

      if (validItems.length > 0) {
        // Bulk pre-fetch NIM (termasuk varian tanpa "x") agar tidak ada query per baris.
        const nimMap = await resolveTargetNimBatch(
          validItems,
          (item) => item.nim,
          (item) => item.nama,
          (item) => ({
            ...item,
            defaultStatusKeaktifan: STUDENT_STATUS.LULUS,
            defaultSemester: 8,
          }),
        );

        await bulkUpsertGraduates(
          validItems.map((item) => toGraduateBulkRow(item, nimMap.get(item) || item.nim)),
        );
        // NIM mentah DAN hasil resolusi dicatat: baris manual dibandingkan
        // terhadap keduanya supaya NIM ber-"x" milik API tetap memblokir manual.
        validItems.forEach((item) => {
          syncedNims.add(item.nim);
          syncedNims.add(nimMap.get(item) || item.nim);
        });
        totalSynced += validItems.length;
      }

      syncJobTracker.updateProgress('graduates', {
        page,
        totalPages,
        synced: totalSynced,
        skipped: totalSkipped,
      });
    },
  });

  let deduplicationResult = null;
  if (runDedup) deduplicationResult = await deduplicateStudents();

  // Lulusan yang tidak pernah diterbitkan `/kelulusan` (5 NIM terukur) diisi
  // literalnya supaya jumlah tetap selaras dengan
  // `/mahasiswa?statusKeaktifan=Lulus`. Baris `graduate` tetap HANYA berasal
  // dari dua sumber ini: endpoint `/kelulusan` dan daftar manual di
  // `manualGraduates.js` — sinkron tidak membuat baris dari `/mahasiswa`.
  const manualCount = await insertManualGraduates(syncedNims);
  totalSynced += manualCount;

  syncJobTracker.updateProgress('graduates', {
    status: 'completed',
    synced: totalSynced,
    skipped: totalSkipped,
  });
  logger.success(
    `[Kelulusan] Selesai! ${totalSynced} data disinkronkan, ${deduplicationResult?.deletedStudentsCount || 0} duplikat dibersihkan.`,
  );
  return { totalSynced, totalSkipped, deduplication: deduplicationResult };
};

module.exports = createSyncHandler({
  moduleName: 'graduates',
  label: 'Sinkronisasi kelulusan',
  execute: executeSyncGraduates,
  successMessage: (result) =>
    `Sinkronisasi sukses! Total ${result.totalSynced} data kelulusan berhasil diperbarui.`,
});

module.exports.executeSyncGraduates = executeSyncGraduates;
module.exports.insertManualGraduates = insertManualGraduates;
