const { authenticateApiKey } = require('./auth');
const { sendRejected } = require('../utils/errorHandler');
const { hasValidSession } = require('./studentSession');
const { HTTP_STATUS } = require('@komet/shared/constants');

/**
 * Guard khusus /api/sync: sesi siswa (dipakai UI) ATAU SYNC_API_KEY (ETL / cron).
 * Credential sync tetap tidak bisa membaca dataset mahasiswa — untuk itu ada
 * studentSessionAuth yang hanya menerima sesi.
 */
async function syncAuth(req, res, next) {
  if (await hasValidSession(req)) return next();
  if (authenticateApiKey(req)) return next();
  return sendRejected(
    res,
    HTTP_STATUS.UNAUTHORIZED,
    'Student session or valid x-api-key is required.',
  );
}

module.exports = { syncAuth };
