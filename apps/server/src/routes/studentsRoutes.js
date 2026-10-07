// src/routes/studentsRoutes.js
const express = require('express');
const router = express.Router();
const { studentSessionAuth } = require('../middlewares/studentSession');
const { statsLimiter, summaryLimiter } = require('../middlewares/rateLimiter');
const { studentQuerySchema, validateQuery } = require('../middlewares/validator');
const studentsController = require('../controllers/studentsController');

// Route data mahasiswa: sesi siswa + rate limiter + validasi query. SYNC_API_KEY tidak berlaku di sini.
router.use(statsLimiter);
router.use(studentSessionAuth);
router.use(validateQuery(studentQuerySchema));

// Endpoint utama dashboard (4 card + filter options)
router.get('/summary', summaryLimiter, studentsController.getSummary);
router.get('/filter-options', studentsController.getFilterOptionsHandler);

// Endpoint detail per card (untuk chart saat card diklik)
router.get('/active-students', studentsController.getActiveStudentsDetail);
router.get('/international-detail', studentsController.getInternationalDetail);
router.get('/intake-trend', studentsController.getIntakeTrendDetail);
router.get('/decline-trend', studentsController.getDeclineTrendDetail);

// Endpoint tabel mahasiswa dengan filter + pagination
router.get('/students', studentsController.getStudents);

module.exports = router;
