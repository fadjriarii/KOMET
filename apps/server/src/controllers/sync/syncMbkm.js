const logger = require('../../utils/logger');
const syncJobTracker = require('../../utils/syncJobTracker');
const createSyncHandler = require('./createSyncHandler');
const { deduplicateStudents } = require('../../services/studentDeduplicationService');
const { mapMbkmRow, dedupeMbkmRows, sumSksByActivity } = require('./mapMbkmRow');
const { buildMbkmRows } = require('./writeMbkmPage');
const { replaceMbkmActivities } = require('./bulkWrite');
const { getProdiFakultasMap, paginateSevimaPages } = require('./sevimaLookup');

const ACTIVITY_ENDPOINT = '/siakadcloud/v1/aktivitas-mbkm';
const KONVERSI_ENDPOINT = '/siakadcloud/v1/mata-kuliah-konversi-mbkm';

/** Semua baris satu endpoint (atribut saja), dengan progres per halaman. */
async function fetchAllAttributes(endpoint, onProgress = () => {}) {
  const rows = [];
  await paginateSevimaPages({
    endpoint,
    onPage: async (listData, info) => {
      for (const item of listData) rows.push(item.attributes);
      onProgress(info);
    },
  });
  return rows;
}

// 3. ETL Sinkronisasi MBKM (MbkmActivity)
// shortcut: seluruh feed (±600 aktivitas, ±650 baris konversi) diproses di memori lalu
// ditulis sekali dalam transaksi; pindah ke penulisan bertahap bila feed > ~50 ribu baris.
const executeSyncMbkm = async ({ runDedup = true } = {}) => {
  logger.info('🔄 Memulai proses ETL: Data Aktivitas MBKM dari SEVIMA API...');
  // Sync = baca peta terbaru (paksa refresh) seperti jalur mahasiswa.
  const prodiFakultasMap = await getProdiFakultasMap(true);
  syncJobTracker.updateProgress('mbkm', { status: 'running', page: 1, totalPages: 0 });

  const attributes = await fetchAllAttributes(ACTIVITY_ENDPOINT, ({ page, totalPages }) =>
    syncJobTracker.updateProgress('mbkm', { page, totalPages }),
  );
  const mapped = attributes.map((attr) => mapMbkmRow(attr, prodiFakultasMap));
  const totalSkipped = mapped.filter((row) => !row).length;
  const { rows: uniqueRows, duplicates: feedDuplicates } = dedupeMbkmRows(mapped.filter(Boolean));

  const sksByActivity = sumSksByActivity(await fetchAllAttributes(KONVERSI_ENDPOINT));
  const { rows, orphans } = await buildMbkmRows(uniqueRows, sksByActivity);
  const totalSynced = await replaceMbkmActivities(rows);

  let deduplicationResult = null;
  if (runDedup) deduplicationResult = await deduplicateStudents();

  const report = {
    totalSynced,
    totalSkipped,
    feedDuplicates,
    orphanActivities: orphans,
    activitiesWithSks: rows.filter((row) => row.sksKonversi !== null).length,
  };
  syncJobTracker.updateProgress('mbkm', {
    status: 'completed',
    synced: totalSynced,
    skipped: totalSkipped,
    report: { feedDuplicates, orphanActivities: orphans },
  });
  logger.success(
    `[MBKM] Selesai! ${totalSynced} aktivitas ditulis, ${feedDuplicates} duplikat feed dibuang, ` +
      `${orphans} aktivitas tanpa mahasiswa dilewati, ${deduplicationResult?.deletedMbkmCount || 0} duplikat isi dibersihkan.`,
  );
  return { ...report, deduplication: deduplicationResult };
};

module.exports = createSyncHandler({
  moduleName: 'mbkm',
  label: 'Sinkronisasi MBKM',
  execute: executeSyncMbkm,
  successMessage: (result) =>
    `Sinkronisasi sukses! Total ${result.totalSynced} data aktivitas MBKM berhasil diperbarui.`,
});

module.exports.executeSyncMbkm = executeSyncMbkm;
