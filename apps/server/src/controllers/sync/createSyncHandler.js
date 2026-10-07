const logger = require('../../utils/logger');
const syncJobTracker = require('../../utils/syncJobTracker');
const { sendServerError, safePublicMessage } = require('../../utils/errorHandler');
const { HTTP_STATUS } = require('@komet/shared/constants');

function clearFilterCachesSafely() {
  try {
    // Setelah sync, isi kolom (prodi, fakultas, angkatan, periode) bisa berubah,
    // jadi semua tab dibuang dari cache — bukan cuma modul yang disinkronkan.
    require('../../services/students/filterOptions').clearFilterCache();
    require('../../services/graduates/filterOptions').clearGraduateFilterCache();
    require('../../services/mbkm/filterOptions').clearMbkmFilterCache();
  } catch (error) {
    logger.warn('Gagal membersihkan cache filter options:', error.message);
  }
}

function syncFailureDetail(error) {
  const raw = error?.response?.data || error?.message;
  return typeof raw === 'string' ? raw : JSON.stringify(raw);
}

/**
 * Satu pembungkus job sinkronisasi untuk semua modul.
 *
 * Yang sebelumnya ditulis ulang per modul (mode async + 202, startJob/finishJob,
 * pelaporan error) ada di sini; tiap modul cukup menyediakan ETL-nya sendiri.
 * Pencegahan sync bentrok ditangani middleware checkSyncRunning, bukan di sini.
 * Detail kegagalan (pesan axios/DB) hanya masuk log; yang keluar adalah pesan katalog.
 *
 * @param {object} options
 * @param {string} options.moduleName kunci progress di syncJobTracker ('students'|'graduates'|'mbkm'|'all')
 * @param {string} options.label teks manusia untuk pesan status
 * @param {() => Promise<object>} options.execute
 * @param {(result: object) => string} options.successMessage
 */
function createSyncHandler({ moduleName, label, execute, successMessage }) {
  const runJob = async () => {
    const result = await execute();
    clearFilterCachesSafely();
    return result;
  };

  return async function syncHandler(req, res) {
    const isAsync = req?.body?.async === true || req?.query?.async === 'true';
    // Job berurutan dari UI mengirim daftar modul yang dipilihnya; tanpa cakupan
    // ini, status hanya bisa menebak dari modul yang sedang berjalan.
    const scope = req?.body?.scope;

    if (isAsync) {
      syncJobTracker.startJob(moduleName, scope);
      setImmediate(() => {
        runJob()
          .then(() => syncJobTracker.finishJob(true))
          .catch((error) => {
            logger.error(`[AsyncJob:${moduleName}] Sinkronisasi gagal:`, syncFailureDetail(error));
            syncJobTracker.finishJob(false, safePublicMessage(syncFailureDetail(error)));
          });
      });

      return res.status(HTTP_STATUS.ACCEPTED).json({
        success: true,
        message: `${label} dimulai di background (Asynchronous Job).`,
      });
    }

    try {
      syncJobTracker.startJob(moduleName, scope);
      const result = await runJob();
      syncJobTracker.finishJob(true);
      return res.json({ success: true, message: successMessage(result), data: result });
    } catch (error) {
      syncJobTracker.finishJob(false, safePublicMessage(syncFailureDetail(error)));
      return sendServerError(res, 'SYNC_FAILED', error, `sync/${moduleName}`);
    }
  };
}

module.exports = createSyncHandler;
