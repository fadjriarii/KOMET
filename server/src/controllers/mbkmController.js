/**
 * Dispatcher controller untuk endpoint statistik & tabel MBKM (Tab MBKM Data).
 */
const { buildMbkmFilter, getPaginationParams, getDefaultPeriode, getPreviousPeriode, buildStudentFilterFromMbkmQuery } = require('../services/mbkm/filterBuilder');
const { getMbkmFilterOptions } = require('../services/mbkm/filterOptions');
const { getMbkmRate } = require('../services/mbkm/mbkmRate');
const { getActivityDistribution, getProdiDistribution, getStatusDistribution } = require('../services/mbkm/mbkmActivities');
const { getEligibleStudents } = require('../services/mbkm/mbkmEligible');
const { getMitraDistribution } = require('../services/mbkm/mbkmMitra');
const { getMbkmList } = require('../services/mbkm/mbkmList');
const { sendError } = require('../utils/errorHandler');

// GET /api/mbkm/summary — Data 4 card + filter options untuk tab MBKM
const getSummary = async (req, res) => {
    try {
        const selectedPeriode = req.query.periode || await getDefaultPeriode();
        const previousPeriode = getPreviousPeriode(selectedPeriode);
        const whereFilter = buildMbkmFilter({ ...req.query, periode: selectedPeriode });
        const studentFilter = buildStudentFilterFromMbkmQuery(req.query);

        const [filterOptions, rateData, totalEligibleData, totalMitraData] = await Promise.all([
            getMbkmFilterOptions(),
            getMbkmRate(whereFilter, selectedPeriode, studentFilter),
            getEligibleStudents(studentFilter),
            getMitraDistribution(previousPeriode, 999)
        ]);

        const totalParticipants = rateData.participantStats.count;
        const selesaiCount = rateData.participantStats.selesaiCount || 0;
        const evaluasiCount = 0;
        const berjalanCount = rateData.participantStats.disetujuiCount || 0;
        const eligibleCount = totalEligibleData.eligibleCount;
        const participationRate = `${rateData.eligibleRate.numPercentage.toFixed(1)}%`;

        return res.status(200).json({
            success: true,
            selectedPeriode,
            previousPeriode,
            summary: {
                persentaseMbkm: {
                    mbkmCount: rateData.participantStats.count,
                    eligibleCount: rateData.eligibleCount,
                    percentage: rateData.eligibleRate.numPercentage
                },
                totalMbkmAktif: rateData.participantStats.disetujuiCount,
                totalEligible: totalEligibleData.eligibleCount,
                totalMitra: totalMitraData.totalPartners
            },
            // Flat kpis object persis sesuai harapan MbkmDataPage.jsx:
            kpis: {
                totalParticipants,
                selesaiCount,
                evaluasiCount,
                berjalanCount,
                participationRate,
                eligibleCount
            },
            filterOptions
        });
    } catch (error) {
        return sendError(res, 500, 'Gagal mengambil summary MBKM.', error, 'mbkm/getSummary');
    }
};

// GET /api/mbkm/list — Tabel MBKM dengan filter + pagination
const getMbkmData = async (req, res) => {
    try {
        const whereFilter = buildMbkmFilter(req.query);
        const { page, limit } = getPaginationParams(req.query);
        const result = await getMbkmList(whereFilter, page, limit);
        return res.status(200).json({ success: true, ...result });
    } catch (error) {
        return sendError(res, 500, 'Gagal mengambil data MBKM.', error, 'mbkm/getMbkmData');
    }
};

// GET /api/mbkm/analytics/rate — Detail Card 1: % MBKM vs Eligible
const getRate = async (req, res) => {
    try {
        const selectedPeriode = req.query.periode || await getDefaultPeriode(prisma);
        const whereFilter = buildMbkmFilter({ ...req.query, periode: selectedPeriode });
        const studentFilter = buildStudentFilterFromMbkmQuery(req.query);
        const data = await getMbkmRate(whereFilter, selectedPeriode, studentFilter);
        return res.status(200).json({
            success: true,
            message: 'Berhasil memuat analisis partisipasi MBKM vs Mahasiswa Eligible',
            selectedPeriode,
            data
        });
    } catch (error) {
        return sendError(res, 500, 'Gagal mengambil data rate MBKM.', error, 'mbkm/getRate');
    }
};

// GET /api/mbkm/analytics/activity-distribution — Detail Card 2 Tab A
const getActivityDistributionHandler = async (req, res) => {
    try {
        const selectedPeriode = req.query.periode || await getDefaultPeriode(prisma);
        const whereFilter = buildMbkmFilter({ ...req.query, periode: selectedPeriode });
        const data = await getActivityDistribution(whereFilter, selectedPeriode);
        return res.status(200).json({
            success: true,
            message: 'Berhasil memuat distribusi jenis aktivitas MBKM',
            selectedPeriode,
            data
        });
    } catch (error) {
        return sendError(res, 500, 'Gagal mengambil distribusi aktivitas.', error, 'mbkm/getActivityDistribution');
    }
};

// GET /api/mbkm/analytics/prodi-distribution — Detail Card 2 Tab B
const getProdiDistributionHandler = async (req, res) => {
    try {
        const selectedPeriode = req.query.periode || await getDefaultPeriode(prisma);
        const whereFilter = buildMbkmFilter({ ...req.query, periode: selectedPeriode });
        const data = await getProdiDistribution(whereFilter, selectedPeriode);
        return res.status(200).json({
            success: true,
            message: 'Berhasil memuat sebaran program studi MBKM',
            selectedPeriode,
            data
        });
    } catch (error) {
        return sendError(res, 500, 'Gagal mengambil sebaran program studi MBKM.', error, 'mbkm/getProdiDistribution');
    }
};

// GET /api/mbkm/analytics/status-distribution — Detail Card 2 Tab C
const getStatusDistributionHandler = async (req, res) => {
    try {
        const selectedPeriode = req.query.periode || await getDefaultPeriode(prisma);
        const whereFilter = buildMbkmFilter({ ...req.query, periode: selectedPeriode });
        const data = await getStatusDistribution(whereFilter, selectedPeriode);
        return res.status(200).json({
            success: true,
            message: 'Berhasil memuat status verifikasi dan evaluasi MBKM',
            selectedPeriode,
            data
        });
    } catch (error) {
        return sendError(res, 500, 'Gagal mengambil status verifikasi MBKM.', error, 'mbkm/getStatusDistribution');
    }
};

// GET /api/mbkm/analytics/eligible-students — Detail Card 3
const getEligibleStudentsHandler = async (req, res) => {
    try {
        const studentFilter = buildStudentFilterFromMbkmQuery(req.query);
        const data = await getEligibleStudents(studentFilter);
        return res.status(200).json({
            success: true,
            message: 'Berhasil memuat data mahasiswa eligible semester 7',
            data
        });
    } catch (error) {
        return sendError(res, 500, 'Gagal mengambil data eligible.', error, 'mbkm/getEligibleStudents');
    }
};

// GET /api/mbkm/analytics/mitra-distribution — Detail Card 4
const getMitraDistributionHandler = async (req, res) => {
    try {
        const defaultLatest = await getDefaultPeriode(prisma);
        const previousPeriode = getPreviousPeriode(defaultLatest);
        const selectedPeriode = req.query.periode || previousPeriode;
        const topN = Math.min(50, Math.max(1, parseInt(req.query.topN) || 10));
        const data = await getMitraDistribution(selectedPeriode, topN);
        return res.status(200).json({
            success: true,
            message: 'Berhasil memuat sebaran penempatan mitra industri & riset',
            selectedPeriode,
            data
        });
    } catch (error) {
        return sendError(res, 500, 'Gagal mengambil data mitra.', error, 'mbkm/getMitraDistribution');
    }
};

// GET /api/mbkm/distribution — Endpoint gabungan untuk MbkmDataPage.jsx modal detail
const getMbkmDistributionHandler = async (req, res) => {
    try {
        const selectedPeriode = req.query.periode || await getDefaultPeriode(prisma);
        const previousPeriode = getPreviousPeriode(selectedPeriode);
        const whereFilter = buildMbkmFilter({ ...req.query, periode: selectedPeriode });

        const [activityRes, prodiRes, statusRes, mitraRes] = await Promise.all([
            getActivityDistribution(whereFilter, selectedPeriode),
            getProdiDistribution(whereFilter, selectedPeriode),
            getStatusDistribution(whereFilter, selectedPeriode),
            getMitraDistribution(previousPeriode, 10)
        ]);

        const byActivityType = activityRes.items || [];
        const byProdi = prodiRes.items || [];
        const byFaculty = [];
        const byMitra = mitraRes.mitraData || [];
        const byStatus = statusRes.items || [];

        return res.status(200).json({
            success: true,
            selectedPeriode,
            byActivityType,
            byProdi,
            byFaculty,
            byMitra,
            byStatus,
            data: {
                byActivityType,
                byProdi,
                byFaculty,
                byMitra,
                byStatus
            }
        });
    } catch (error) {
        return sendError(res, 500, 'Gagal mengambil gabungan distribusi MBKM.', error, 'mbkm/getMbkmDistribution');
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
    getMbkmDistributionHandler
};
