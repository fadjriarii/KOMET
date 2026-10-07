const syncJobTracker = require('../utils/syncJobTracker');
const { sendRejected } = require('../utils/errorHandler');

/**
 * Middleware Guard untuk mencegah eksekusi sinkronisasi bersamaan (concurrent sync).
 * Pemanggil internal (syncAll) memanggil executeSync* langsung, jadi guard ini hanya
 * mengurus jalur HTTP.
 */
const checkSyncRunning = (req, res, next) => {
  if (syncJobTracker.isRunning()) {
    return sendRejected(
      res,
      409,
      'Proses sinkronisasi lain sedang berjalan. Tunggu hingga selesai.',
      'SYNC_IN_PROGRESS',
    );
  }
  return next();
};

module.exports = { checkSyncRunning };
