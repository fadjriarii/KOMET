/**
 * graduatesRoutes.js
 * 
 * Express Router untuk seluruh API endpoints statistik & tabel kelulusan (/api/graduates/*).
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const { statsLimiter } = require('../middlewares/rateLimiter');
const { graduateQuerySchema, validateQuery } = require('../middlewares/validator');
const graduates = require('../controllers/graduatesController');

// Semua routes dilindungi oleh API Key middleware & Rate Limiter & Validasi Query
router.use(authMiddleware);
router.use(statsLimiter);
router.use(validateQuery(graduateQuerySchema));

// Endpoint utama tab lulusan (4 card + filter options)
router.get('/summary', graduates.getSummary);

// Endpoint detail chart per card
router.get('/total-lulusan', graduates.getTotalLulusanDetail);
router.get('/ipk-trend', graduates.getIpkTrendDetail);
router.get('/tepat-waktu', graduates.getTepatWaktuDetail);
router.get('/keberhasilan-studi', graduates.getKeberhasilanStudiDetail);
router.get('/study-success', graduates.getKeberhasilanStudiDetail);
router.get('/distribution', graduates.getGraduateDistributionDetail);

// Endpoint tabel lulusan dengan filter + pagination
router.get('/list', graduates.getGraduates);

module.exports = router;
