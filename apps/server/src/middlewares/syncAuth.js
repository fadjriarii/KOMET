const { authenticateApiKey } = require('./auth');
const { sendRejected } = require('../utils/errorHandler');
const { hasValidSession } = require('./studentSession');
const { HTTP_STATUS, SYNC_ACTOR } = require('@komet/shared/constants');

/**
 * Guard khusus /api/sync: sesi siswa (dipakai UI) ATAU SYNC_API_KEY (ETL / cron).
 * Credential sync tetap tidak bisa membaca dataset mahasiswa — untuk itu ada
 * studentSessionAuth yang hanya menerima sesi.
 *
 * `req.syncActor` diturunkan dari kredensial yang benar-benar dipakai, bukan dari
 * string yang dikirim klien: riwayat sync tidak bisa dipalsukan lewat body.
 */
async function syncAuth(req, res, next) {
  if (await hasValidSession(req)) {
    req.syncActor = SYNC_ACTOR.DASHBOARD;
    return next();
  }
  if (authenticateApiKey(req)) {
    req.syncActor = SYNC_ACTOR.API_KEY;
    return next();
  }
  return sendRejected(
    res,
    HTTP_STATUS.UNAUTHORIZED,
    'Student session or valid x-api-key is required.',
  );
}

module.exports = { syncAuth };
