/**
 * graduatesController.js
 *
 * Dispatcher controller untuk endpoint statistik & tabel kelulusan (Tab Lulusan).
 */

const { buildGraduateFilter, getPaginationParams } = require('../services/graduates/filterBuilder');
const { getGraduateSummary } = require('../services/graduates/graduateSummary');
const { getTotalLulusanByYear } = require('../services/graduates/totalLulusan');
const { getAvgIpk, getIpkByYear, getIpkOverview } = require('../services/graduates/ipkTrend');
const { getTepatWaktuByYear } = require('../services/graduates/tepatWaktu');
const { getKeberhasilanStudiByAngkatan } = require('../services/graduates/keberhasilanStudi');
const { getGraduateDistribution } = require('../services/graduates/graduateDistribution');
const { getGraduateList } = require('../services/graduates/graduateList');
const { sendServerError } = require('../utils/errorHandler');

// GET /api/graduates/summary — Data 4 card + filter options untuk tab lulusan
const getSummary = async (req, res) => {
  try {
    const whereFilter = buildGraduateFilter(req.query);
    const data = await getGraduateSummary(whereFilter);
    return res.json({ success: true, ...data });
  } catch (error) {
    return sendServerError(res, 'DATA_READ_FAILED', error, 'graduates/getSummary');
  }
};

// GET /api/graduates/total-lulusan — Detail chart Card 1
const getTotalLulusanDetail = async (req, res) => {
  try {
    const whereFilter = buildGraduateFilter(req.query);
    const data = await getTotalLulusanByYear(whereFilter);
    return res.json({ success: true, data });
  } catch (error) {
    return sendServerError(res, 'DATA_READ_FAILED', error, 'graduates/getTotalLulusanDetail');
  }
};

// GET /api/graduates/ipk-trend — Detail chart Card 2
const getIpkTrendDetail = async (req, res) => {
  try {
    const whereFilter = buildGraduateFilter(req.query);
    const [avgIpk, byYear, overview] = await Promise.all([
      getAvgIpk(whereFilter),
      getIpkByYear(whereFilter),
      getIpkOverview(whereFilter),
    ]);
    // Key disebut satu-satu: spread tidak bisa menimpa key dari sumber lain secara diam-diam.
    return res.json({
      success: true,
      data: {
        s1Gpa: avgIpk.s1,
        s2Gpa: avgIpk.s2,
        byYearS1: byYear.byYearS1,
        byYearS2: byYear.byYearS2,
        prodiGpaData: overview.prodiGpaData,
        facultyGpaData: overview.facultyGpaData,
        gpaBandsData: overview.gpaBandsData,
        unknownIpkCount: overview.unknownIpkCount,
      },
    });
  } catch (error) {
    return sendServerError(res, 'DATA_READ_FAILED', error, 'graduates/getIpkTrendDetail');
  }
};

// GET /api/graduates/tepat-waktu — Detail chart Card 3
const getTepatWaktuDetail = async (req, res) => {
  try {
    const whereFilter = buildGraduateFilter(req.query);
    const data = await getTepatWaktuByYear(whereFilter);
    return res.json({ success: true, data });
  } catch (error) {
    return sendServerError(res, 'DATA_READ_FAILED', error, 'graduates/getTepatWaktuDetail');
  }
};

// GET /api/graduates/keberhasilan-studi & /api/graduates/study-success — Detail chart Card 4
const getKeberhasilanStudiDetail = async (req, res) => {
  try {
    const whereFilter = buildGraduateFilter(req.query);
    const data = await getKeberhasilanStudiByAngkatan(whereFilter);
    return res.json({ success: true, data });
  } catch (error) {
    return sendServerError(res, 'DATA_READ_FAILED', error, 'graduates/getKeberhasilanStudiDetail');
  }
};

// GET /api/graduates/distribution — Detail chart per predikat & per tahun
const getGraduateDistributionDetail = async (req, res) => {
  try {
    const whereFilter = buildGraduateFilter(req.query);
    const data = await getGraduateDistribution(whereFilter);
    return res.json({ success: true, data });
  } catch (error) {
    return sendServerError(
      res,
      'DATA_READ_FAILED',
      error,
      'graduates/getGraduateDistributionDetail',
    );
  }
};

// GET /api/graduates/list — Tabel lulusan dengan filter + pagination
const getGraduates = async (req, res) => {
  try {
    const whereFilter = buildGraduateFilter(req.query);
    const { page, limit } = getPaginationParams(req.query);
    const result = await getGraduateList(whereFilter, page, limit);
    return res.json({ success: true, ...result });
  } catch (error) {
    return sendServerError(res, 'DATA_READ_FAILED', error, 'graduates/getGraduates');
  }
};

module.exports = {
  getSummary,
  getTotalLulusanDetail,
  getIpkTrendDetail,
  getTepatWaktuDetail,
  getKeberhasilanStudiDetail,
  getGraduateDistributionDetail,
  getGraduates,
};
