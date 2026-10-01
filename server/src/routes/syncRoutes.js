const express = require('express');
const router = express.Router();
const syncController = require('../controllers/syncController');
const { studentSessionAuth } = require('../middlewares/studentSession');
const { checkSyncRunning } = require('../middlewares/syncGuard');
const { syncLimiter, statsLimiter } = require('../middlewares/rateLimiter');

// Seluruh rute sinkronisasi diproteksi limiter dasar + Session / API Key Middleware
router.use(statsLimiter, studentSessionAuth);

// Endpoint Sinkronisasi (Menggunakan HTTP POST) - Terikat syncLimiter & checkSyncRunning
router.post('/students', syncLimiter, checkSyncRunning, syncController.syncStudents);
router.post('/graduates', syncLimiter, checkSyncRunning, syncController.syncGraduates);
router.post('/mbkm', syncLimiter, checkSyncRunning, syncController.syncMbkm);
router.post('/all', syncLimiter, checkSyncRunning, syncController.syncAll);

// Endpoint Monitoring Status & Uji Latensi
router.get('/status', syncController.getSyncStatus);
router.get('/check-connection', syncController.checkConnection);

module.exports = router;