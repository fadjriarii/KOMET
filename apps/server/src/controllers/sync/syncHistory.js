const logger = require('../../utils/logger');
const { listRuns, deleteRun, settleUnloggedDeath } = require('../../services/sync/syncRunLog');
const { sendServerError, sendRejected } = require('../../utils/errorHandler');
const { ERROR_CATALOG } = require('../../utils/errorCatalog');

/**
 * Riwayat sinkronisasi: seluruh perhitungan (jumlah modul yang berhasil, bentuk
 * tanggal) sudah selesai di `syncRunLog`. Controller ini hanya membungkusnya.
 *
 * Pembacaan daftar ini juga menutup job yang mati di tengah jalan: job seperti itu tidak
 * pernah lewat `endJob`, jadi tidak ada yang menulis barisnya. Ditulis DI SINI, sebelum
 * daftarnya diambil, supaya 'Failed' sudah ikut dalam respons yang sama — dan tidak
 * bergantung pada siapa yang membaca `/api/sync/status` lebih dulu. Gagal mencatat tidak
 * boleh merusak daftar, sama seperti `endJob`: cukup jadi pesan di log server.
 */
async function getSyncHistory(req, res) {
  try {
    await settleUnloggedDeath().catch((error) =>
      logger.error('[syncRunLog] Gagal mencatat riwayat sinkronisasi:', error.message),
    );
    return res.json({ success: true, data: await listRuns() });
  } catch (error) {
    return sendServerError(res, 'DATA_READ_FAILED', error, 'sync/history');
  }
}

const RUN_ID = /^\d{1,9}$/;

/**
 * Hapus satu log. `id` path parameter tidak lewat `validateQuery` (itu middleware
 * query string), jadi dicek di sini; angka di luar rentang Int MariaDB ikut ditolak
 * pola ini dan diperlakukan sama seperti id yang tidak ada.
 */
async function deleteSyncRun(req, res) {
  if (!RUN_ID.test(req.params.id)) return notFound(res);
  try {
    if (!(await deleteRun(Number(req.params.id)))) return notFound(res);
    return res.json({ success: true });
  } catch (error) {
    return sendServerError(res, 'DATA_WRITE_FAILED', error, 'sync/history/:id');
  }
}

const notFound = (res) =>
  sendRejected(
    res,
    ERROR_CATALOG.SYNC_RUN_NOT_FOUND.statusCode,
    ERROR_CATALOG.SYNC_RUN_NOT_FOUND.message,
    'SYNC_RUN_NOT_FOUND',
  );

module.exports = { getSyncHistory, deleteSyncRun };
