// src/routes/studentsRoutes.js
const express = require('express');
const router = express.Router();
const { studentSessionAuth } = require('../middlewares/studentSession');
const { statsLimiter } = require('../middlewares/rateLimiter');
const { studentQuerySchema, validateQuery } = require('../middlewares/validator');
const studentsController = require('../controllers/studentsController');

// Semua routes dilindungi oleh API Key & Rate Limiter & Validasi Query
router.use(statsLimiter);
router.use(studentSessionAuth);
router.use(validateQuery(studentQuerySchema));

// Endpoint utama dashboard (4 card + filter options)
router.get('/summary', studentsController.getSummary);

// Endpoint detail per card (untuk chart saat card diklik)
router.get('/active-students', studentsController.getActiveStudentsDetail);
router.get('/international-detail', studentsController.getInternationalDetail);
router.get('/intake-trend', studentsController.getIntakeTrendDetail);
router.get('/decline-trend', studentsController.getDeclineTrendDetail);

// Endpoint tabel mahasiswa dengan filter + pagination
router.get('/students', studentsController.getStudents);

// Legacy endpoint (pertahankan sementara agar tidak breaking changes)
module.exports = router;
