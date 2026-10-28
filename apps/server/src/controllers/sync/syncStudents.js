const logger = require('../../utils/logger');
const prisma = require('../../config/prisma');
const syncJobTracker = require('../../utils/syncJobTracker');
const createSyncHandler = require('./createSyncHandler');
const { deduplicateStudents } = require('../../services/studentDeduplicationService');
const { mapStudentRow } = require('./mapStudentRow');
const { fetchCutiHistory, buildPeriodRange } = require('./studentCuti');
const { getCurrentAcademicPeriode } = require('./academicPeriod');
const { applyTransferSemester } = require('./transferSemester');
const { createIssueCollector, summarizeIssues } = require('./syncIssues');
const { STUDENT_STATUS } = require('@komet/shared/constants');
const {
  getProdiFakultasMap,
  getProdiCodeMap,
  resolveFakultas,
  paginateSevimaPages,
} = require('./sevimaLookup');
const { bulkUpsertStudents, replaceCutiPeriods } = require('./bulkWrite');

// 1. ETL Sinkronisasi Mahasiswa dengan Data Cleansing & Transformation
const executeSyncStudents = async ({ runDedup = true } = {}) => {
  logger.info(
    '🔄 Memulai proses ETL: Mahasiswa dari SEVIMA API (dengan Data Cleansing & Transformation)...',
  );
  // Sync = baca peta terbaru (paksa refresh): prodi/fakultas baru dari API
  // harus ter-resolve resmi saat sync ini juga, bukan setelah cache 1 jam basi.
  // Cuti diambil dari `/perwalian` untuk semua periode agar status historis tidak
  // hilang saat mahasiswa kembali aktif. Kegagalan endpoint sekunder ini tidak
  // boleh menggagalkan sync mahasiswa.
  const currentPeriode = getCurrentAcademicPeriode();
  const [earliestStudent, existingCurrentCuti] = await Promise.all([
    prisma.student.findFirst({
      where: { periodeMasuk: { not: '' } },
      orderBy: { periodeMasuk: 'asc' },
      select: { periodeMasuk: true },
    }),
    prisma.student.findMany({
      where: { statusKeaktifan: STUDENT_STATUS.CUTI },
      select: { nim: true },
    }),
  ]);
  const cutiPeriods = buildPeriodRange(earliestStudent?.periodeMasuk, currentPeriode);
  const cutiHistoryPromise = fetchCutiHistory(cutiPeriods).catch((error) => {
    logger.warn(`[Mahasiswa] Gagal mengambil riwayat cuti dari /perwalian: ${error.message}`);
    return new Map();
  });
  const [prodiFakultasMap, prodiCodeMap, cutiHistory] = await Promise.all([
    getProdiFakultasMap(true),
    getProdiCodeMap(true),
    cutiHistoryPromise,
  ]);
  // Periode berjalan yang gagal diambil tidak boleh menghapus status cuti yang
  // sudah dikenal; pakai data lama sebagai fallback sampai sync berikutnya.
  const cutiNims =
    cutiHistory.get(currentPeriode) || new Set(existingCurrentCuti.map((row) => row.nim));
  // Nilai tak dikenal tetap tampil (passthrough), tapi dicatat detector supaya
  // manusia dikabari — tidak perlu mengetik tabel mapping.
  const issues = createIssueCollector();

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
        const row = mapStudentRow(item.attributes, prodiFakultasMap, resolveFakultas, {
          prodiCodeMap,
          issues,
        });
        if (!row) {
          totalSkipped++;
          continue;
        }
        // Master `/mahasiswa` tetap `A / Aktif` untuk mahasiswa cuti; status
        // periode berjalan dari `/perwalian` yang menang saat sync.
        if (cutiNims.has(row.nim)) row.statusKeaktifan = STUDENT_STATUS.CUTI;
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

  // Ganti per periode supaya koreksi/penghapusan cuti dari SEVIMA ikut terbawa,
  // tetapi periode yang gagal diambil (`null`) dibiarkan apa adanya.
  let cutiHistoryRows = 0;
  for (const [periode, nims] of cutiHistory) {
    if (nims) cutiHistoryRows += await replaceCutiPeriods(periode, nims);
  }

  const newValues = summarizeIssues(issues);
  if (Object.keys(newValues).length) {
    logger.warn(
      `🆕 Nilai baru dari SEVIMA (tampil otomatis, perlu ditinjau): ${JSON.stringify(newValues)}`,
    );
  }

  syncJobTracker.updateProgress('students', {
    status: 'completed',
    synced: totalSynced,
    skipped: totalSkipped,
  });
  logger.success(
    `[Mahasiswa] Selesai! ${totalSynced} data disinkronkan, ${totalSkipped} dilewati, ${cutiNims.size} mahasiswa cuti berjalan, ${cutiHistoryRows} riwayat cuti tersimpan, ${deduplicationResult?.deletedStudentsCount || 0} duplikat dibersihkan, ${transferFix.updated} semester transfer dikoreksi.`,
  );
  return {
    totalSynced,
    totalSkipped,
    cutiCount: cutiNims.size,
    cutiHistoryRows,
    fetchedNims: [...fetchedNims],
    deduplication: deduplicationResult,
    newValues,
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
