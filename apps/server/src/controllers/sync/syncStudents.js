const logger = require('../../utils/logger');
const syncJobTracker = require('../../utils/syncJobTracker');
const createSyncHandler = require('./createSyncHandler');
const { deduplicateStudents } = require('../../services/studentDeduplicationService');
const { sanitizeProdiName } = require('./text');
const {
  getPeriodeFromTanggalTransfer,
  formatAngkatan,
  normalizeAcademicPeriod,
  extractPeriode,
  hitungSemester,
} = require('./academicPeriod');
const { isStatusKeluar, mapKewarganegaraan } = require('./codeMaps');
const { getProdiFakultasMap, resolveFakultas, paginateSevimaPages } = require('./sevimaLookup');
const { bulkUpsertStudents } = require('./bulkWrite');
const { STUDENT_STATUS } = require('@komet/shared/constants');

// 1. ETL Sinkronisasi Mahasiswa dengan Data Cleansing & Transformation
const executeSyncStudents = async ({ runDedup = true } = {}) => {
  logger.info(
    '🔄 Memulai proses ETL: Mahasiswa dari SEVIMA API (dengan Data Cleansing & Transformation)...',
  );
  const prodiFakultasMap = await getProdiFakultasMap();

  let totalSynced = 0;
  let totalSkipped = 0;

  syncJobTracker.updateProgress('students', { status: 'running', page: 1, totalPages: 0 });

  await paginateSevimaPages({
    endpoint: '/siakadcloud/v1/mahasiswa',
    onPage: async (listData, { page, totalPages }) => {
      const validItems = [];
      for (const item of listData) {
        const attr = item.attributes;

        // ─── RULE 1: Filter NIM — buang record yang NIM-nya kosong ───
        const nim = (attr.nim || '').trim();
        if (!nim) {
          totalSkipped++;
          continue;
        }

        // ─── RULE 2: Normalisasi Nama Program Studi & Lookup Fakultas ───
        const rawProdi = attr.program_studi || '';
        const prodiName = sanitizeProdiName(rawProdi);
        const namaFakultas = resolveFakultas(attr, prodiName, prodiFakultasMap, attr.nama_fakultas);

        // ─── RULE 3: Angkatan & Periode Masuk — Khusus S2 gunakan tanggal_transfer jika ada (atau fallback ke id_periode) ───
        const jenjang = (attr.id_jenjang || 'S1').trim().toUpperCase();
        const tanggalTransfer = (attr.tanggal_transfer || '').trim();
        const periodeFromTransfer =
          jenjang === 'S2' && tanggalTransfer ? getPeriodeFromTanggalTransfer(tanggalTransfer) : '';
        const periodeMasuk = normalizeAcademicPeriod(periodeFromTransfer || attr.id_periode);

        // ─── RULE 4: Periode — field baru "Ganjil"/"Genap" dari digit ke-5 periodeMasuk ───
        const periode = extractPeriode(periodeMasuk);

        // Angkatan = hanya 4 digit tahun masuk (contoh "2026")
        const angkatan = formatAngkatan(periodeMasuk);

        // ─── RULE 5: Status Keaktifan & Semester — kalkulasi dinamis berdasarkan status ───
        const idStatus = (attr.id_status_mahasiswa || '').trim();
        const statusName = (attr.status_mahasiswa || '').trim();
        const periodeTerakhir = normalizeAcademicPeriod(attr.id_periode_terakhir);
        const isKeluar =
          isStatusKeluar(idStatus) ||
          /lulus|drop\s*out|keluar|putus\s*studi|meninggal/i.test(statusName);

        let statusKeaktifan = statusName;
        if (!statusKeaktifan) {
          if (idStatus === 'L') statusKeaktifan = STUDENT_STATUS.LULUS;
          else if (idStatus === 'D') statusKeaktifan = 'Drop Out';
          else if (idStatus === 'C') statusKeaktifan = STUDENT_STATUS.CUTI;
          else if (idStatus === 'K') statusKeaktifan = 'Keluar';
          else if (idStatus === 'A') statusKeaktifan = STUDENT_STATUS.AKTIF;
          else statusKeaktifan = isKeluar ? STUDENT_STATUS.LULUS : STUDENT_STATUS.AKTIF;
        }

        // Gunakan periode terakhir untuk mahasiswa keluar maupun aktif bila tersedia;
        // jika kosong, helper memakai periode akademik berjalan sebagai fallback.
        const semesterAktif = hitungSemester(periodeMasuk, periodeTerakhir || null);

        // ─── RULE 6: Kewarganegaraan — konversi ke nama negara spesifik ───
        const kewarganegaraan = mapKewarganegaraan(attr.id_negara || '', attr.nama_negara || '');

        validItems.push({
          nim,
          nama: attr.nama || '',
          jenjang: attr.id_jenjang || 'S1',
          periodeMasuk,
          periodeTerakhir,
          angkatan,
          periode,
          programStudi: prodiName,
          fakultas: namaFakultas,
          statusKeaktifan,
          semester: semesterAktif,
          kewarganegaraan,
          nik: (attr.nik || '').trim(),
          tanggalLahir: (attr.tanggal_lahir || '').trim(),
        });
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
    deduplicationResult = await deduplicateStudents();
  }

  syncJobTracker.updateProgress('students', {
    status: 'completed',
    synced: totalSynced,
    skipped: totalSkipped,
  });
  logger.success(
    `[Mahasiswa] Selesai! ${totalSynced} data disinkronkan, ${totalSkipped} dilewati, ${deduplicationResult?.deletedStudentsCount || 0} duplikat dibersihkan.`,
  );
  return { totalSynced, totalSkipped, deduplication: deduplicationResult };
};

module.exports = createSyncHandler({
  moduleName: 'students',
  label: 'Sinkronisasi mahasiswa',
  execute: executeSyncStudents,
  successMessage: (result) =>
    `Sinkronisasi sukses! Total ${result.totalSynced} data mahasiswa disinkronkan, ${result.totalSkipped} dilewati (${result.deduplication?.deletedStudentsCount || 0} duplikat dan ${result.deduplication?.deletedMbkmCount || 0} duplikat MBKM dibersihkan).`,
});

module.exports.executeSyncStudents = executeSyncStudents;
