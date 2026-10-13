const logger = require('../../utils/logger');
const prisma = require('../../config/prisma');
const syncJobTracker = require('../../utils/syncJobTracker');
const createSyncHandler = require('./createSyncHandler');
const { deduplicateStudents } = require('../../services/studentDeduplicationService');
const { sanitizeProdiName, normalizeOptionalText, normalizeJenjang } = require('./text');
const { formatTahunLulus } = require('./academicPeriod');
const { resolveTargetNimBatch, paginateSevimaPages } = require('./sevimaLookup');
const { bulkUpsertGraduates } = require('./bulkWrite');
const { selectManualGraduates } = require('./manualGraduates');
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
        const attr = item.attributes;
        if (!attr.nim) {
          totalSkipped++;
          continue;
        }

        const prodiName = sanitizeProdiName(attr.program_studi || '');

        // Ekstrak Tahun Lulus sebagai label ajaran ("2025" -> "2025/2026"):
        // nilai kanonis kolom `tahunLulus`, dihitung sekali di sini.
        let tahunLulus = '';
        if (attr.id_periode_akademik && attr.id_periode_akademik.length >= 4) {
          tahunLulus = formatTahunLulus(attr.id_periode_akademik.substring(0, 4));
        } else if (attr.tanggal_keluar) {
          tahunLulus = formatTahunLulus(attr.tanggal_keluar.substring(0, 4));
        } else if (attr.tanggal_sk_yudisium) {
          tahunLulus = formatTahunLulus(attr.tanggal_sk_yudisium.substring(0, 4));
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
          jenjang: normalizeJenjang(attr.id_jenjang || 'S1'),
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

/** Insert baris `graduate` untuk NIM yang tidak ada di API (manual seed). */
async function insertManualGraduates(syncedNims) {
  const pending = selectManualGraduates(syncedNims);
  if (pending.length === 0) return 0;
  const students = await prisma.student.findMany({
    where: { nim: { in: pending.map((row) => row.nim) } },
    select: { nim: true, jenjang: true },
  });
  const jenjangByNim = new Map(students.map((s) => [s.nim, s.jenjang]));
  const rows = pending
    .filter((row) => jenjangByNim.has(row.nim))
    .map((row) => ({
      nim: row.nim,
      jenjang: jenjangByNim.get(row.nim),
      statusKelulusan: STUDENT_STATUS.LULUS,
      predikatLulus: '',
      tahunLulus: row.tahunLulus,
      periodeWisuda: row.periodeWisuda,
      ipk: row.ipk,
      sksLulus: row.sksLulus,
      periodeTerakhir: row.periodeWisuda,
    }));
  if (rows.length === 0) return 0;
  await bulkUpsertGraduates(rows);
  return rows.length;
}

module.exports = createSyncHandler({
  moduleName: 'graduates',
  label: 'Sinkronisasi kelulusan',
  execute: executeSyncGraduates,
  successMessage: (result) =>
    `Sinkronisasi sukses! Total ${result.totalSynced} data kelulusan berhasil diperbarui.`,
});

module.exports.executeSyncGraduates = executeSyncGraduates;
module.exports.insertManualGraduates = insertManualGraduates;
