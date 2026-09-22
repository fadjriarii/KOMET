const syncStudents = require('./syncStudents');
const syncGraduates = require('./syncGraduates');
const syncMbkm = require('./syncMbkm');
const syncJobTracker = require('../../utils/syncJobTracker');
const logger = require('../../utils/logger');

const executeSyncAll = async () => {
    logger.info('🚀 Memulai Sinkronisasi Penuh (Students, Graduates, MBKM)...');
    // Lewatkan objek req dengan isInternal: true agar status job global 'all' tidak tertimpa
    const countStudents = await syncStudents({ isInternal: true }, null);
    const countGraduates = await syncGraduates({ isInternal: true }, null);
    const countMbkm = await syncMbkm({ isInternal: true }, null);

    return {
        totalStudents: countStudents,
        totalGraduates: countGraduates,
        totalMbkmActivities: countMbkm
    };
};

// 4. Sinkronisasi Keseluruhan (All)
const syncAll = async (req, res) => {
    const isAsync = req?.body?.async === true || req?.query?.async === 'true';

    if (isAsync && res) {
        if (syncJobTracker.isRunning()) {
            return res.status(409).json({
                success: false,
                message: 'Proses sinkronisasi lain sedang berjalan di background.',
                statusUrl: '/api/sync/status'
            });
        }

        syncJobTracker.startJob('all');
        setImmediate(() => {
            executeSyncAll()
                .then(() => {
                    try { syncJobTracker.finishJob(true); } catch (e) { logger.error('Gagal memanggil finishJob:', e); }
                })
                .catch((err) => {
                    logger.error('[AsyncJob:all] Error tidak tertangani:', err.message);
                    try { syncJobTracker.finishJob(false, err.message); } catch (_) {}
                });
        });

        return res.status(202).json({
            success: true,
            message: 'Sinkronisasi penuh dimulai di background (Asynchronous Job).',
            statusUrl: '/api/sync/status'
        });
    }

    try {
        syncJobTracker.startJob('all');
        const results = await executeSyncAll();
        syncJobTracker.finishJob(true);

        if (res) {
            return res.status(200).json({
                success: true,
                message: 'Seluruh data berhasil disinkronkan ke database!',
                data: results
            });
        }

        return results;
    } catch (error) {
        const errorMsg = error.message || 'Unknown error occurred during full sync';
        syncJobTracker.finishJob(false, errorMsg);
        logger.error('❌ Gagal sinkronisasi penuh:', errorMsg);

        if (res) {
            return res.status(500).json({
                success: false,
                message: typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg)
            });
        }
        throw error;
    }
};

module.exports = syncAll;

