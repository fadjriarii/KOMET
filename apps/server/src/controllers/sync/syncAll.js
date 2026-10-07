const logger = require('../../utils/logger');
const createSyncHandler = require('./createSyncHandler');
const { deduplicateStudents } = require('../../services/studentDeduplicationService');
const { executeSyncStudents } = require('./syncStudents');
const { executeSyncGraduates } = require('./syncGraduates');
const { executeSyncMbkm } = require('./syncMbkm');

// Urutan tetap: mahasiswa -> kelulusan -> MBKM, karena Graduate dan MBKM membuat
// baris mahasiswa yang belum ada (FK ke students.nim).
const executeSyncAll = async () => {
  logger.info('🚀 Memulai Sinkronisasi Penuh (Students, Graduates, MBKM)...');

  const students = await executeSyncStudents({ runDedup: false });
  const graduates = await executeSyncGraduates({ runDedup: false });
  const mbkm = await executeSyncMbkm({ runDedup: false });

  // Deduplikasi memuat seluruh tabel mahasiswa + MBKM ke memori. Cukup sekali di akhir,
  // bukan sekali per modul.
  const deduplication = await deduplicateStudents();

  return {
    totalStudents: students.totalSynced,
    totalGraduates: graduates.totalSynced,
    totalMbkmActivities: mbkm.totalSynced,
    totalSkipped: students.totalSkipped + graduates.totalSkipped + mbkm.totalSkipped,
    deduplication,
  };
};

// 4. Sinkronisasi Keseluruhan (All)
module.exports = createSyncHandler({
  moduleName: 'all',
  label: 'Sinkronisasi penuh',
  execute: executeSyncAll,
  successMessage: (result) =>
    `Seluruh data berhasil disinkronkan ke database! ${result.totalStudents} mahasiswa, ${result.totalGraduates} lulusan, ${result.totalMbkmActivities} aktivitas MBKM.`,
});
