const { buildStudentFilter, buildBaseFilter, getPaginationParams } = require('../services/students/filterBuilder');
const { getFilterOptions } = require('../services/students/filterOptions');
const { getTotalActiveStudents, getActiveStudentsByYear, getActiveStudentsMultisector } = require('../services/students/activeStudents');
const { getInternationalStudentsTrend, getTotalInternationalStudents } = require('../services/students/internationalTrend');
const { getIntakeTrend } = require('../services/students/intakeTrend');
const { getNewStudentDecline } = require('../services/students/declineTrend');
const { getStudentList } = require('../services/students/studentList');
const { sendError } = require('../utils/errorHandler');

// GET /api/students/summary — Data 4 card utama dashboard + filter options
const getSummary = async (req, res) => {
    try {
        const baseFilter = buildBaseFilter(req.query);
        const { selectedPeriode } = req.query;
        
        const [
            filterOptions,
            totalActiveStudents,
            totalInternationalStudents,
            internationalTrend,
            intakeTrendResult
        ] = await Promise.all([
            getFilterOptions(),
            getTotalActiveStudents(baseFilter),        // Card 1: Total Mahasiswa Aktif
            getTotalInternationalStudents(baseFilter), // Card 2: Total Mahasiswa Asing (WNA) Aktif
            getInternationalStudentsTrend(baseFilter),
            getIntakeTrend(baseFilter)                 // Card 3: Intake Mahasiswa Baru
        ]);
        
        // Destructure since getIntakeTrend returns { trend, rechartsData }
        const intakeTrend = intakeTrendResult.trend || [];
        
        // Card 4: Persentase Penurunan Mahasiswa Baru (Rentang 5 Tahun)
        const newStudentDecline = await getNewStudentDecline(selectedPeriode, baseFilter, intakeTrend);

        const activeStudentsCount = totalActiveStudents;
        const foreignStudentsCount = totalInternationalStudents;
        const totalAll = totalActiveStudents + totalInternationalStudents;
        const foreignStudentsRate = totalAll > 0 ? `${((totalInternationalStudents / totalAll) * 100).toFixed(1)}%` : "0.0%";
        const latestIntake = intakeTrend[intakeTrend.length - 1];
        const intakeCohortCount = latestIntake ? (latestIntake.intakeCount || latestIntake.count || 0) : 0;
        const declinePct = newStudentDecline?.declinePercentage ?? 0;
        const intakeFluctuationAvg = `${declinePct >= 0 ? '+' : ''}${declinePct.toFixed(1)}%`;
        const isFluctuationPositive = declinePct >= 0;

        const intlTrendData = internationalTrend?.trendData || [];

        return res.status(200).json({
            success: true,
            summary: {
                totalActiveStudents,          // Card 1: Angka Total Mahasiswa Aktif
                totalInternationalStudents,   // Card 2: Angka Total Mahasiswa Asing yang Aktif
                intakeTrend: {                // Card 3: Intake Mahasiswa Baru (latest = angka card 3)
                    latest: latestIntake || null,
                    trend: intakeTrend
                },
                newStudentDecline,            // Card 4: Persentase Penurunan MB Rentang 5 Tahun
                internationalStudentsTrend: { // Chart detail mahasiswa asing
                    latest: intlTrendData[intlTrendData.length - 1] || null,
                    trend: intlTrendData,
                    total: internationalTrend?.total || 0,
                    byCountry: internationalTrend?.byCountry || []
                }
            },
            // Flat kpis object persis sesuai harapan StudentDataPage.jsx:
            kpis: {
                activeStudentsCount,
                foreignStudentsRate,
                foreignStudentsCount,
                intakeCohortCount,
                intakeFluctuationAvg,
                isFluctuationPositive
            },
            filterOptions
        });
    } catch (error) {
        return sendError(res, 500, 'Gagal mengambil summary statistik.', error, 'students/getSummary');
    }
};

// GET /api/students/active-students — Detail chart totalActiveStudents (multisector breakdown)
const getActiveStudentsDetail = async (req, res) => {
    try {
        const baseFilter = buildBaseFilter(req.query);
        const multisector = await getActiveStudentsMultisector(baseFilter);
        const byYear = await getActiveStudentsByYear(baseFilter);
        return res.status(200).json({ success: true, ...multisector, byYear });
    } catch (error) {
        return sendError(res, 500, 'Gagal mengambil data mahasiswa aktif.', error, 'students/getActiveStudentsDetail');
    }
};

// GET /api/students/international-trend — Detail chart internationalStudentsTrend
const getInternationalTrendDetail = async (req, res) => {
    try {
        const baseFilter = buildBaseFilter(req.query);
        const data = await getInternationalStudentsTrend(baseFilter);
        return res.status(200).json({ success: true, ...data });
    } catch (error) {
        return sendError(res, 500, 'Gagal mengambil tren mahasiswa asing.', error, 'students/getInternationalTrendDetail');
    }
};

// GET /api/students/intake-trend — Detail chart intakeTrend (IntakeTrendView.jsx)
const getIntakeTrendDetail = async (req, res) => {
    try {
        const baseFilter = buildBaseFilter(req.query);
        const { trend, rechartsData } = await getIntakeTrend(baseFilter);
        return res.status(200).json({ success: true, data: trend, intakeTrendData: rechartsData });
    } catch (error) {
        return sendError(res, 500, 'Gagal mengambil tren intake.', error, 'students/getIntakeTrendDetail');
    }
};

// GET /api/students/decline-trend & /api/students/intake-fluctuation — Detail chart newStudentDecline & IntakeFluctuationView
const getDeclineTrendDetail = async (req, res) => {
    try {
        const baseFilter = buildBaseFilter(req.query);
        const { trend: intakeTrend } = await getIntakeTrend(baseFilter);
        const data = await getNewStudentDecline(req.query.selectedPeriode, baseFilter, intakeTrend);
        
        const isPositive = data.declinePercentage >= 0;
        const finalAverage = `${isPositive ? '+' : ''}${data.declinePercentage.toFixed(1)}%`;
        const trendBadge = isPositive ? 'Peningkatan' : 'Penurunan';

        const chartData = (data.history || []).map(h => ({
            year: h.year || h.academicYear,
            absolutCount: h.count || h.intakeCount || 0,
            deltaFormatted: `${h.percentageChange >= 0 ? '+' : ''}${(h.percentageChange || 0).toFixed(1)}%`,
            deltaPercentage: h.percentageChange || 0
        }));

        return res.status(200).json({
            success: true,
            data,
            declineTrend: data,
            // Properti persis yang diharapkan oleh IntakeFluctuationView.jsx & apiClient.js:
            isPositive,
            finalAverage,
            trendBadge,
            chartData,
            fluctuationData: {
                isPositive,
                finalAverage,
                trendBadge,
                chartData
            }
        });
    } catch (error) {
        return sendError(res, 500, 'Gagal menghitung fluktuasi mahasiswa baru.', error, 'students/getDeclineTrendDetail');
    }
};

// GET /api/students/students — Tabel mahasiswa dengan filter + pagination
const getStudents = async (req, res) => {
    try {
        const whereFilter = buildStudentFilter(req.query);
        const { limit, page } = getPaginationParams(req.query);
        
        const result = await getStudentList(whereFilter, page, limit);
        return res.status(200).json({ success: true, ...result });
    } catch (error) {
        return sendError(res, 500, 'Gagal mengambil daftar mahasiswa.', error, 'students/getStudents');
    }
};

module.exports = {
    getSummary,
    getActiveStudentsDetail,
    getInternationalTrendDetail,
    getIntakeTrendDetail,
    getDeclineTrendDetail,
    getStudents
};