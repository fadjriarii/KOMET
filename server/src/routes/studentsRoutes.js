// src/routes/studentsRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const { statsLimiter } = require('../middlewares/rateLimiter');
const { studentQuerySchema, validateQuery } = require('../middlewares/validator');
const studentsController = require('../controllers/studentsController');

// Semua routes dilindungi oleh API Key & Rate Limiter & Validasi Query
router.use(authMiddleware);
router.use(statsLimiter);
router.use(validateQuery(studentQuerySchema));

// Endpoint utama dashboard (4 card + filter options)
router.get('/summary', studentsController.getSummary);

// Endpoint detail per card (untuk chart saat card diklik)
router.get('/active-students', studentsController.getActiveStudentsDetail);
router.get('/international-trend', studentsController.getInternationalTrendDetail);
router.get('/intake-trend', studentsController.getIntakeTrendDetail);
router.get('/decline-trend', studentsController.getDeclineTrendDetail);
router.get('/intake-fluctuation', studentsController.getDeclineTrendDetail);

// Endpoint tabel mahasiswa dengan filter + pagination
router.get('/students', studentsController.getStudents);

// Legacy endpoint (pertahankan sementara agar tidak breaking changes)
router.get('/student-dashboard', studentsController.getSummary);

module.exports = router;