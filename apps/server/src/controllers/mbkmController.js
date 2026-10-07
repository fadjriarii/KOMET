/**
 * Dispatcher controller untuk endpoint statistik & tabel MBKM (Tab MBKM Data).
 *
 * Controller hanya membaca `req.query`, memanggil service, dan mengirim
 * respons. Periode efektif, filter, aritmetika persentase, dan bentuk payload
 * hidup di `services/mbkm/`.
 */
const {
  buildMbkmFilter,
  buildStudentFilterFromMbkmQuery,
  resolveMbkmQuery,
  resolveMitraPeriode,
} = require('../services/mbkm/filterBuilder');
const { getPaginationParams } = require('../utils/paginationUtils');
const {
  getActivityDistribution,
  getProdiDistribution,
  getStatusDistribution,
} = require('../services/mbkm/mbkmActivities');
const { getEligibleStudents } = require('../services/mbkm/mbkmEligible');
const { getMitraDistribution } = require('../services/mbkm/mbkmMitra');
const { getMbkmList } = require('../services/mbkm/mbkmList');
const { getMbkmRate } = require('../services/mbkm/mbkmRate');
const { getMbkmSummary } = require('../services/mbkm/mbkmSummary');
const { sendServerError } = require('../utils/errorHandler');

// GET /api/mbkm/summary — Data 4 card + filter options untuk tab MBKM
const getSummary = async (req, res) => {
  try {
    return res.json({ success: true, ...(await getMbkmSummary(req.query)) });
  } catch (error) {
    return sendServerError(res, 'DATA_READ_FAILED', error, 'mbkm/getSummary');
  }
};

// GET /api/mbkm/list — Tabel MBKM dengan filter + pagination
const getMbkmData = async (req, res) => {
  try {
    const { page, limit } = getPaginationParams(req.query);
    const result = await getMbkmList(buildMbkmFilter(req.query), page, limit);
    return res.json({ success: true, ...result });
  } catch (error) {
    return sendServerError(res, 'DATA_READ_FAILED', error, 'mbkm/getMbkmData');
  }
};

// GET /api/mbkm/analytics/rate — Detail Card 1: % MBKM vs Eligible
const getRate = async (req, res) => {
  try {
    const { selectedPeriode, whereFilter } = await resolveMbkmQuery(req.query);
    const data = await getMbkmRate(
      whereFilter,
      selectedPeriode,
      buildStudentFilterFromMbkmQuery(req.query),
    );
    return res.json({ success: true, selectedPeriode, data });
  } catch (error) {
    return sendServerError(res, 'DATA_READ_FAILED', error, 'mbkm/getRate');
  }
};

/**
 * Distribusi berbasis periode: ketiganya hanya berbeda di service penghitung.
 * Alurnya sama persis — periode efektif + filter, lalu satu payload
 * `{ selectedPeriode, data }`.
 */
const periodeDistributionHandler = (service, label) => async (req, res) => {
  try {
    const { selectedPeriode, whereFilter } = await resolveMbkmQuery(req.query);
    const data = await service(whereFilter, selectedPeriode);
    return res.json({ success: true, selectedPeriode, data });
  } catch (error) {
    return sendServerError(res, 'DATA_READ_FAILED', error, label);
  }
};

// GET /api/mbkm/analytics/activity-distribution — Detail Card 2 Tab A
const getActivityDistributionHandler = periodeDistributionHandler(
  getActivityDistribution,
  'mbkm/getActivityDistribution',
);

// GET /api/mbkm/analytics/prodi-distribution — Detail Card 2 Tab B
const getProdiDistributionHandler = periodeDistributionHandler(
  getProdiDistribution,
  'mbkm/getProdiDistribution',
);

// GET /api/mbkm/analytics/status-distribution — Detail Card 2 Tab C
const getStatusDistributionHandler = periodeDistributionHandler(
  getStatusDistribution,
  'mbkm/getStatusDistribution',
);

// GET /api/mbkm/analytics/eligible-students — Detail Card 3
const getEligibleStudentsHandler = async (req, res) => {
  try {
    const data = await getEligibleStudents(buildStudentFilterFromMbkmQuery(req.query));
    return res.json({ success: true, data });
  } catch (error) {
    return sendServerError(res, 'DATA_READ_FAILED', error, 'mbkm/getEligibleStudents');
  }
};

// GET /api/mbkm/analytics/mitra-distribution — Detail Card 4
const getMitraDistributionHandler = async (req, res) => {
  try {
    const selectedPeriode = await resolveMitraPeriode(req.query);
    const data = await getMitraDistribution(selectedPeriode, req.query.topN);
    return res.json({ success: true, selectedPeriode, data });
  } catch (error) {
    return sendServerError(res, 'DATA_READ_FAILED', error, 'mbkm/getMitraDistribution');
  }
};

module.exports = {
  getSummary,
  getMbkmData,
  getRate,
  getActivityDistributionHandler,
  getProdiDistributionHandler,
  getStatusDistributionHandler,
  getEligibleStudentsHandler,
  getMitraDistributionHandler,
};
