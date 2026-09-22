/**
 * graduatesController.js
 * 
 * Dispatcher controller untuk endpoint statistik & tabel kelulusan (Tab Lulusan).
 */

const { buildGraduateFilter, getPaginationParams } = require('../services/graduates/filterBuilder');
const { getGraduateFilterOptions } = require('../services/graduates/filterOptions');
const { getTotalLulusan, getTotalLulusanByYear, getYearRange } = require('../services/graduates/totalLulusan');
const { getAvgIpk, getIpkByYear, getIpkOverview } = require('../services/graduates/ipkTrend');
const { getTepatWaktu, getTepatWaktuByYear } = require('../services/graduates/tepatWaktu');
const { getKeberhasilanStudi, getKeberhasilanStudiByAngkatan } = require('../services/graduates/keberhasilanStudi');
const { getGraduateDistribution } = require('../services/graduates/graduateDistribution');
const { getGraduateList } = require('../services/graduates/graduateList');
const { sendError } = require('../utils/errorHandler');

// GET /api/graduates/summary — Data 4 card + filter options untuk tab lulusan
const getSummary = async (req, res) => {
    try {
        const whereFilter = buildGraduateFilter(req.query);
        const yearRange = getYearRange();
        const refYear = new Date().getFullYear() - 1;

        const [filterOptions, totalLulusan, avgIpk, tepatWaktu, keberhasilan] = await Promise.all([
            getGraduateFilterOptions(),
            getTotalLulusan(whereFilter),
            getAvgIpk(whereFilter),
            getTepatWaktu(whereFilter),
            getKeberhasilanStudi(whereFilter)
        ]);

        const totalGraduates = (totalLulusan?.s1 || 0) + (totalLulusan?.s2 || 0);
        const onTimeGraduationRateS1 = tepatWaktu?.s1 !== null ? `${tepatWaktu.s1}%` : '0.0%';
        const onTimeGraduationRateS2 = tepatWaktu?.s2 !== null ? `${tepatWaktu.s2}%` : '0.0%';
        const studySuccessRateS1 = keberhasilan?.s1 !== null ? `${keberhasilan.s1}%` : '0.0%';
        const averageGpaS1 = avgIpk?.s1?.average !== undefined ? String(avgIpk.s1.average) : (typeof avgIpk?.s1 === 'number' ? String(avgIpk.s1) : '0.00');
        const averageGpaS2 = avgIpk?.s2?.average !== undefined ? String(avgIpk.s2.average) : (typeof avgIpk?.s2 === 'number' ? String(avgIpk.s2) : '0.00');

        return res.status(200).json({
            success: true,
            referenceYear: refYear,
            yearRange,
            summary: {
                totalLulusan,
                avgIpk,
                tepatWaktu,
                keberhasilanStudi: keberhasilan
            },
            // Flat kpis object persis sesuai harapan GraduateDataPage.jsx:
            kpis: {
                totalGraduates,
                onTimeGraduationRateS1,
                onTimeGraduationRateS2,
                studySuccessRateS1,
                averageGpaS1,
                averageGpaS2
            },
            filterOptions
        });
    } catch (error) {
        return sendError(res, 500, 'Gagal mengambil summary lulusan.', error, 'graduates/getSummary');
    }
};

// GET /api/graduates/total-lulusan — Detail chart Card 1
const getTotalLulusanDetail = async (req, res) => {
    try {
        const whereFilter = buildGraduateFilter(req.query);
        const data = await getTotalLulusanByYear(whereFilter);
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return sendError(res, 500, 'Gagal mengambil detail total lulusan.', error, 'graduates/getTotalLulusanDetail');
    }
};

// GET /api/graduates/ipk-trend — Detail chart Card 2 (GpaOverviewView.jsx)
const getIpkTrendDetail = async (req, res) => {
    try {
        const whereFilter = buildGraduateFilter(req.query);
        const [avgIpk, byYear, overview] = await Promise.all([
            getAvgIpk(whereFilter),
            getIpkByYear(whereFilter),
            getIpkOverview(whereFilter)
        ]);
        return res.status(200).json({
            success: true,
            data: {
                s1Gpa: avgIpk.s1,
                s2Gpa: avgIpk.s2,
                ...byYear,
                ...overview
            }
        });
    } catch (error) {
        return sendError(res, 500, 'Gagal mengambil tren IPK.', error, 'graduates/getIpkTrendDetail');
    }
};

// GET /api/graduates/tepat-waktu — Detail chart Card 3 (OnTimeGraduationView.jsx)
const getTepatWaktuDetail = async (req, res) => {
    try {
        const whereFilter = buildGraduateFilter(req.query);
        const data = await getTepatWaktuByYear(whereFilter);
        const onTimeCohortData = data.s1 || [];
        const onTimeCohortDataS2 = data.s2 || [];
        return res.status(200).json({ success: true, data, onTimeCohortData, onTimeCohortDataS2 });
    } catch (error) {
        return sendError(res, 500, 'Gagal mengambil data tepat waktu.', error, 'graduates/getTepatWaktuDetail');
    }
};

// GET /api/graduates/keberhasilan-studi & /api/graduates/study-success — Detail chart Card 4 (StudySuccessView.jsx)
const getKeberhasilanStudiDetail = async (req, res) => {
    try {
        const whereFilter = buildGraduateFilter(req.query);
        const data = await getKeberhasilanStudiByAngkatan(whereFilter);
        const successCohortData = data.s1 || [];
        const successCohortDataS2 = data.s2 || [];
        return res.status(200).json({ success: true, data, successCohortData, successCohortDataS2 });
    } catch (error) {
        return sendError(res, 500, 'Gagal mengambil data keberhasilan studi.', error, 'graduates/getKeberhasilanStudiDetail');
    }
};

// GET /api/graduates/distribution — Detail chart per predikat & per tahun (GraduateDataPage.jsx)
const getGraduateDistributionDetail = async (req, res) => {
    try {
        const whereFilter = buildGraduateFilter(req.query);
        const data = await getGraduateDistribution(whereFilter);
        return res.status(200).json({ success: true, data, ...data });
    } catch (error) {
        return sendError(res, 500, 'Gagal mengambil distribusi lulusan.', error, 'graduates/getGraduateDistributionDetail');
    }
};

// GET /api/graduates/list — Tabel lulusan dengan filter + pagination
const getGraduates = async (req, res) => {
    try {
        const whereFilter = buildGraduateFilter(req.query);
        const { page, limit } = getPaginationParams(req.query);
        const result = await getGraduateList(whereFilter, page, limit);
        return res.status(200).json({ success: true, ...result });
    } catch (error) {
        return sendError(res, 500, 'Gagal mengambil daftar lulusan.', error, 'graduates/getGraduates');
    }
};

module.exports = {
    getSummary,
    getTotalLulusanDetail,
    getIpkTrendDetail,
    getTepatWaktuDetail,
    getKeberhasilanStudiDetail,
    getGraduateDistributionDetail,
    getGraduates
};
