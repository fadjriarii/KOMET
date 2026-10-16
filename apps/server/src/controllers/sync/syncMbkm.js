const prisma = require('../../config/prisma');
const logger = require('../../utils/logger');
const syncJobTracker = require('../../utils/syncJobTracker');
const createSyncHandler = require('./createSyncHandler');
const { deduplicateStudents } = require('../../services/studentDeduplicationService');
const { mapMbkmRow } = require('./mapMbkmRow');
const { writeMbkmPage } = require('./writeMbkmPage');
const { getProdiFakultasMap, paginateSevimaPages } = require('./sevimaLookup');

// 3. ETL Sinkronisasi MBKM (MbkmActivity)
const executeSyncMbkm = async ({ runDedup = true } = {}) => {
  logger.info('🔄 Memulai proses ETL: Data Aktivitas MBKM dari SEVIMA API...');
  // Sync = baca peta terbaru (paksa refresh) seperti jalur mahasiswa.
  const prodiFakultasMap = await getProdiFakultasMap(true);

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
        const row = mapMbkmRow(item.attributes, prodiFakultasMap);
        if (!row) {
          totalSkipped++;
          continue;
        }
        validItems.push(row);
      }

      if (validItems.length > 0) {
        totalSynced += await writeMbkmPage(validItems);
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
