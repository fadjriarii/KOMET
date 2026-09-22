const express = require('express');
const router = express.Router();
const syncController = require('../controllers/syncController');
const authMiddleware = require('../middlewares/auth');
const { checkSyncRunning } = require('../middlewares/syncGuard');
const { syncLimiter, statsLimiter } = require('../middlewares/rateLimiter');

// Seluruh rute sinkronisasi diproteksi oleh API Key Middleware
router.use(authMiddleware);

// Endpoint Sinkronisasi (Menggunakan HTTP POST) - Terikat syncLimiter & checkSyncRunning
router.post('/students', syncLimiter, checkSyncRunning, syncController.syncStudents);
router.post('/graduates', syncLimiter, checkSyncRunning, syncController.syncGraduates);
router.post('/mbkm', syncLimiter, checkSyncRunning, syncController.syncMbkm);
router.post('/all', syncLimiter, checkSyncRunning, syncController.syncAll);

// Endpoint Monitoring Status Sinkronisasi - Terikat statsLimiter
router.get('/status', statsLimiter, syncController.getSyncStatus);

module.exports = router;