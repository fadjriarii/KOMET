const logger = require('../../utils/logger');
const syncJobTracker = require('../../utils/syncJobTracker');
const createSyncHandler = require('./createSyncHandler');
const { deduplicateStudents } = require('../../services/studentDeduplicationService');
const { mapStudentRow } = require('./mapStudentRow');
const { applyTransferSemester } = require('./transferSemester');
const { getProdiFakultasMap, resolveFakultas, paginateSevimaPages } = require('./sevimaLookup');
const { bulkUpsertStudents } = require('./bulkWrite');

// 1. ETL Sinkronisasi Mahasiswa dengan Data Cleansing & Transformation
const executeSyncStudents = async ({ runDedup = true } = {}) => {
  logger.info(
    '🔄 Memulai proses ETL: Mahasiswa dari SEVIMA API (dengan Data Cleansing & Transformation)...',
  );
  const prodiFakultasMap = await getProdiFakultasMap();

  let totalSynced = 0;
  let totalSkipped = 0;
  // Seluruh NIM yang masih dikembalikan API pada sync ini. NIM di DB yang tidak
  // ada di sini berarti hilang dari API (mis. dinomor-ulang) dan harus diprune
  // oleh dedup — kalau tidak, orang yang sama terhitung dua kali.
  const fetchedNims = new Set();

  syncJobTracker.updateProgress('students', { status: 'running', page: 1, totalPages: 0 });

  await paginateSevimaPages({
    endpoint: '/siakadcloud/v1/mahasiswa',
    onPage: async (listData, { page, totalPages }) => {
      const validItems = [];
      for (const item of listData) {
        const row = mapStudentRow(item.attributes, prodiFakultasMap, resolveFakultas);
        if (!row) {
          totalSkipped++;
          continue;
        }
        validItems.push(row);
        fetchedNims.add(row.nim);
      }

      if (validItems.length > 0) {
        await bulkUpsertStudents(validItems);
        totalSynced += validItems.length;
      }

      syncJobTracker.updateProgress('students', {
        page,
        totalPages,
        synced: totalSynced,
        skipped: totalSkipped,
      });
    },
  });

  let deduplicationResult = null;
  if (runDedup) {
    // Jalankan deduplikasi in-memory setelah seluruh data dari API masuk ke database
    deduplicationResult = await deduplicateStudents({ pruneNims: fetchedNims });
  }

  // Semester enrollment transfer dihitung dari awal masuk rantainya, bukan
  // dari periode pasca-transfer (aturan: studi kontinu se-jenjang).
  const transferFix = await applyTransferSemester();

  syncJobTracker.updateProgress('students', {
    status: 'completed',
    synced: totalSynced,
    skipped: totalSkipped,
  });
  logger.success(
    `[Mahasiswa] Selesai! ${totalSynced} data disinkronkan, ${totalSkipped} dilewati, ${deduplicationResult?.deletedStudentsCount || 0} duplikat dibersihkan, ${transferFix.updated} semester transfer dikoreksi.`,
  );
  return {
    totalSynced,
    totalSkipped,
    fetchedNims: [...fetchedNims],
    deduplication: deduplicationResult,
  };
};

module.exports = createSyncHandler({
  moduleName: 'students',
  label: 'Sinkronisasi mahasiswa',
  execute: executeSyncStudents,
  successMessage: (result) =>
    `Sinkronisasi sukses! Total ${result.totalSynced} data mahasiswa disinkronkan, ${result.totalSkipped} dilewati (${result.deduplication?.deletedStudentsCount || 0} duplikat dan ${result.deduplication?.deletedMbkmCount || 0} duplikat MBKM dibersihkan).`,
});

module.exports.executeSyncStudents = executeSyncStudents;
