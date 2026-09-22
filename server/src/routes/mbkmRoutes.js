/**
 * Express Router untuk seluruh API endpoints Tab MBKM Data (/api/mbkm/*).
 */
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const { statsLimiter } = require('../middlewares/rateLimiter');
const { mbkmQuerySchema, validateQuery } = require('../middlewares/validator');
const {
    getSummary,
    getMbkmData,
    getRate,
    getActivityDistributionHandler,
    getProdiDistributionHandler,
    getStatusDistributionHandler,
    getEligibleStudentsHandler,
    getMitraDistributionHandler,
    getMbkmDistributionHandler
} = require('../controllers/mbkmController');

// Semua routes dilindungi oleh API Key middleware & Rate Limiter & Validasi Query
router.use(authMiddleware);
router.use(statsLimiter);
router.use(validateQuery(mbkmQuerySchema));

// Endpoint utama tab MBKM (4 card + filter options)
router.get('/summary', getSummary);

// Endpoint gabungan distribusi (MbkmDataPage.jsx modal detail)
router.get('/distribution', getMbkmDistributionHandler);

// Endpoint tabel MBKM dengan filter + pagination
router.get('/list', getMbkmData);

// Analytics endpoints — Detail card popup
router.get('/analytics/rate', getRate);
router.get('/analytics/activity-distribution', getActivityDistributionHandler);
router.get('/analytics/prodi-distribution', getProdiDistributionHandler);
router.get('/analytics/status-distribution', getStatusDistributionHandler);
router.get('/analytics/eligible-students', getEligibleStudentsHandler);
router.get('/analytics/mitra-distribution', getMitraDistributionHandler);

module.exports = router;
