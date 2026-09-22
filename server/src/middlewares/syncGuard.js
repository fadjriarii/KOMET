const syncJobTracker = require('../utils/syncJobTracker');

/**
 * Middleware Guard untuk mencegah eksekusi sinkronisasi bersamaan (concurrent sync).
 */
const checkSyncRunning = (req, res, next) => {
    const isInternal = req?.isInternal === true;
    
    if (!isInternal && syncJobTracker.isRunning()) {
        if (res) {
            return res.status(409).json({
                success: false,
                message: 'Proses sinkronisasi lain sedang berjalan. Tunggu hingga selesai.',
                statusUrl: '/api/sync/status'
            });
        }
        throw new Error('Proses sinkronisasi lain sedang berjalan.');
    }
    
    next();
};

module.exports = { checkSyncRunning };
