const {
  buildStudentFilter,
  getSelectedAcademicYear,
} = require('../services/students/filterBuilder');
const { getFilterOptions } = require('../services/students/filterOptions');
const { getActiveStudentsMultisector } = require('../services/students/activeStudents');
const { getInternationalStudentsTrend } = require('../services/students/internationalTrend');
const { getIntakeTrend, getIntakeYearCounts } = require('../services/students/intakeTrend');
const { getNewStudentDecline } = require('../services/students/declineTrend');
const { getStudentSummary } = require('../services/students/studentSummary');
const { getStudentList } = require('../services/students/studentList');
const { getPaginationParams } = require('../utils/paginationUtils');
const { sendServerError } = require('../utils/errorHandler');

// GET /api/students/summary — Data 4 card utama dashboard + filter options
const getSummary = async (req, res) => {
  try {
    return res.json({ success: true, ...(await getStudentSummary(req.query)) });
  } catch (error) {
    return sendServerError(res, 'DATA_READ_FAILED', error, 'students/getSummary');
  }
};

// GET /api/students/international-detail — Detail chart mahasiswa asing per negara
const getInternationalDetail = async (req, res) => {
  try {
    const data = await getInternationalStudentsTrend(req.query);
    return res.json({ success: true, data });
  } catch (error) {
    return sendServerError(res, 'DATA_READ_FAILED', error, 'students/getInternationalDetail');
  }
};

// GET /api/students/active-students — Detail chart totalActiveStudents (multisector breakdown)
const getActiveStudentsDetail = async (req, res) => {
  try {
    const data = await getActiveStudentsMultisector(buildStudentFilter(req.query));
    return res.json({ success: true, data });
  } catch (error) {
    return sendServerError(res, 'DATA_READ_FAILED', error, 'students/getActiveStudentsDetail');
  }
};

// GET /api/students/intake-trend — Detail chart intakeTrend (IntakeTrendView.jsx)
const getIntakeTrendDetail = async (req, res) => {
  try {
    const { trend } = await getIntakeTrend(req.query);
    // Bentuknya sama dengan summary.intakeTrend agar jalur lazy-fetch dan jalur
    // reuse-summary di klien membaca satu struktur.
    return res.json({ success: true, data: { trend } });
  } catch (error) {
    return sendServerError(res, 'DATA_READ_FAILED', error, 'students/getIntakeTrendDetail');
  }
};

// GET /api/students/decline-trend — Detail chart newStudentDecline
const getDeclineTrendDetail = async (req, res) => {
  try {
    // Peta intake penuh dari satu `groupBy`; penurunan murni dihitung di memori.
    const yearCounts = await getIntakeYearCounts(req.query);
    return res.json({
      success: true,
      data: getNewStudentDecline(getSelectedAcademicYear(req.query), yearCounts),
    });
  } catch (error) {
    return sendServerError(res, 'DATA_READ_FAILED', error, 'students/getDeclineTrendDetail');
  }
};

// GET /api/students/students — Tabel mahasiswa dengan filter + pagination
const getStudents = async (req, res) => {
  try {
    const services = req.studentDataServices || {};
    const whereFilter = (services.buildStudentFilter || buildStudentFilter)(req.query);
    const { limit, page } = (services.getPaginationParams || getPaginationParams)(req.query);

    const result = await (services.getStudentList || getStudentList)(
      whereFilter,
      page,
      limit,
      req.query.cursor,
      req.query,
    );
    return res.json({ success: true, ...result });
  } catch (error) {
    const context = 'students/getStudents';
    // 400 berasal dari validasi filter; selain itu kegagalan yang tidak terduga.
    return error.statusCode === 400
      ? sendServerError(res, 'INVALID_QUERY', error, context)
      : sendServerError(res, 'DATA_READ_FAILED', error, context);
  }
};

// GET /api/students/filter-options — Filter options untuk dropdown (dapat di-cache lebih lama)
const getFilterOptionsHandler = async (req, res) => {
  try {
    return res.json({
      success: true,
      data: await getFilterOptions(),
    });
  } catch (error) {
    return sendServerError(res, 'DATA_READ_FAILED', error, 'students/getFilterOptions');
  }
};

module.exports = {
  getSummary,
  getActiveStudentsDetail,
  getIntakeTrendDetail,
  getDeclineTrendDetail,
  getStudents,
  getInternationalDetail,
  getFilterOptionsHandler,
};
