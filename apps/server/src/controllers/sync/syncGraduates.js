const logger = require('../../utils/logger');
const syncJobTracker = require('../../utils/syncJobTracker');
const createSyncHandler = require('./createSyncHandler');
const { deduplicateStudents } = require('../../services/studentDeduplicationService');
const { sanitizeProdiName, normalizeOptionalText } = require('./text');
const { resolveTargetNimBatch, paginateSevimaPages } = require('./sevimaLookup');
const { bulkUpsertGraduates } = require('./bulkWrite');
const { STUDENT_STATUS } = require('@komet/shared/constants');

// 2. ETL Sinkronisasi Kelulusan (Graduate)
const executeSyncGraduates = async ({ runDedup = true } = {}) => {
  logger.info('🔄 Memulai proses ETL: Data Kelulusan dari SEVIMA API...');

  let totalSynced = 0;
  let totalSkipped = 0;

  syncJobTracker.updateProgress('graduates', { status: 'running', page: 1, totalPages: 0 });

  await paginateSevimaPages({
    endpoint: '/siakadcloud/v1/kelulusan',
    onPage: async (listData, { page, totalPages }) => {
      const validItems = [];
      for (const item of listData) {
        const attr = item.attributes;
        if (!attr.nim) {
          totalSkipped++;
          continue;
        }

        const prodiName = sanitizeProdiName(attr.program_studi || '');

        // Ekstrak Tahun Lulus
        let tahunLulus = '';
        if (attr.id_periode_akademik && attr.id_periode_akademik.length >= 4) {
          tahunLulus = attr.id_periode_akademik.substring(0, 4);
        } else if (attr.tanggal_keluar) {
          tahunLulus = attr.tanggal_keluar.substring(0, 4);
        } else if (attr.tanggal_sk_yudisium) {
          tahunLulus = attr.tanggal_sk_yudisium.substring(0, 4);
        }

        // /kelulusan hanya memuat wisudawan: status diambil dari status keaktifan
        // sumber, predikat diambil apa adanya dari SK yudisium. Keduanya dulu
        // bertukar tempat — `nama_predikat` tersimpan di kolom status dan ikut
        // muncul sebagai pilihan di filter Status.
        const sourceStatus = normalizeOptionalText(attr.nama_status_mahasiswa);
        const statusKelulusan =
          sourceStatus && sourceStatus !== STUDENT_STATUS.AKTIF
            ? sourceStatus
            : STUDENT_STATUS.LULUS;

        validItems.push({
          nim: attr.nim,
          nama: attr.nama || '',
          jenjang: attr.id_jenjang || 'S1',
          id_periode_akademik: attr.id_periode_akademik || '',
          programStudi: prodiName,
          statusKelulusan,
          predikatLulus: normalizeOptionalText(attr.nama_predikat),
          tahunLulus,
          ipk: parseFloat(attr.ipk_lulusan) || 0,
          sksLulus: parseInt(attr.sks_total) || 0,
        });
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
          validItems.map((item) => ({
            nim: nimMap.get(item) || item.nim,
            jenjang: item.jenjang,
            statusKelulusan: item.statusKelulusan,
            predikatLulus: item.predikatLulus || '',
            tahunLulus: item.tahunLulus,
            periodeWisuda: item.id_periode_akademik || '',
            ipk: item.ipk,
            sksLulus: item.sksLulus,
            periodeTerakhir: item.id_periode_akademik || '',
          })),
        );
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
