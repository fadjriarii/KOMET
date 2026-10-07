const express = require('express');
const router = express.Router();
const syncController = require('../controllers/syncController');
const { syncAuth } = require('../middlewares/syncAuth');
const { checkSyncRunning } = require('../middlewares/syncGuard');
const { syncLimiter, statusLimiter, statsLimiter } = require('../middlewares/rateLimiter');

// Monitoring status & uji latensi: dibacanya lewat polling tiap 2 detik oleh UI,
// jadi dipisah dari budget statsLimiter agar polling tidak menghabiskan jatah dashboard.
router.get('/status', statusLimiter, syncAuth, syncController.getSyncStatus);
router.get('/check-connection', statusLimiter, syncAuth, syncController.checkConnection);

// Endpoint sync berat: limiter dasar + kredensial sync (sesi UI atau SYNC_API_KEY).
router.use(statsLimiter, syncAuth);

// Endpoint Sinkronisasi (Menggunakan HTTP POST) - Terikat syncLimiter & checkSyncRunning
router.post('/students', syncLimiter, checkSyncRunning, syncController.syncStudents);
router.post('/graduates', syncLimiter, checkSyncRunning, syncController.syncGraduates);
router.post('/mbkm', syncLimiter, checkSyncRunning, syncController.syncMbkm);
router.post('/all', syncLimiter, checkSyncRunning, syncController.syncAll);

module.exports = router;
