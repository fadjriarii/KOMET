const { buildStudentFilter, buildBaseFilter, getPaginationParams } = require('../services/students/filterBuilder');
const { getFilterOptions } = require('../services/students/filterOptions');
const { getTotalActiveStudents, getActiveStudentsMultisector } = require('../services/students/activeStudents');
const { getInternationalStudentsTrend, getTotalInternationalStudents } = require('../services/students/internationalTrend');
const { getIntakeTrend, getIntakeCountsForYears } = require('../services/students/intakeTrend');
const { getNewStudentDecline } = require('../services/students/declineTrend');
const { getStudentList } = require('../services/students/studentList');
const { sendError } = require('../utils/errorHandler');

function buildStudentPopulationFilter(query) {
    return buildBaseFilter(query);
}

// GET /api/students/summary — Data 4 card utama dashboard + filter options
const getSummary = async (req, res) => {
    try {
        const baseFilter = buildBaseFilter(req.query);
        // Seluruh KPI berbasis populasi yang sama dengan filter status pengguna.
        // Nilai __ALL__ dari UI diterjemahkan oleh buildBaseFilter menjadi semua
        // status yang tidak kosong, bukan dipaksa kembali ke status Aktif.
        const studentPopulationFilter = buildStudentPopulationFilter(req.query);
        // `selectedPeriode` is retained for backward-compatible detail links;
        // the header now sends `tahunAjaran`. Both identify the same academic
        // year in this endpoint, while `periodeMasuk` remains the Ganjil/Genap
        // intake filter and may legitimately differ from either value.
        const selectedPeriode = req.query.selectedPeriode || req.query.tahunAjaran;
        
        const selectedStartYear = /^\d{4}\/\d{4}$/.test(selectedPeriode || '')
            ? Number(selectedPeriode.slice(0, 4))
            : null;
        const declineYears = selectedStartYear
            ? Array.from({ length: 6 }, (_, index) => `${selectedStartYear - index}/${selectedStartYear + 1 - index}`)
            : [];
        const [
            totalActiveStudents,
            totalInternationalStudents,
            internationalTrend,
            intakeTrendResult,
            declineCounts
        ] = await Promise.all([
            getTotalActiveStudents(studentPopulationFilter),
            getTotalInternationalStudents(studentPopulationFilter),
            getInternationalStudentsTrend(studentPopulationFilter),
            getIntakeTrend(baseFilter),                // Card 3: Intake Mahasiswa Baru
            // Fetch the six decline cohorts alongside the other KPI queries.
            // getNewStudentDecline then performs only in-memory calculation.
            getIntakeCountsForYears(declineYears, baseFilter)
        ]);
        
        // Destructure since getIntakeTrend returns { trend, rechartsData }
        const intakeTrend = intakeTrendResult.trend || [];
        const declineTrendCache = [...intakeTrend];
        declineCounts.forEach((intakeCount, tahun) => {
            if (!declineTrendCache.some((item) => item.tahun === tahun)) declineTrendCache.push({ tahun, intakeCount });
        });
        
        // Card 4: Persentase Penurunan Mahasiswa Baru (Rentang 5 Tahun)
        const newStudentDecline = await getNewStudentDecline(selectedPeriode, baseFilter, declineTrendCache);

        const activeStudentsCount = totalActiveStudents;
        const foreignStudentsCount = totalInternationalStudents;
        const foreignRate = totalActiveStudents > 0
            ? (totalInternationalStudents / totalActiveStudents) * 100
            : 0;
        // Card Intake mengikuti tahun ajaran yang dipilih, bukan selalu tahun
        // terakhir pada rolling trend.
        let selectedIntake = selectedPeriode
            ? intakeTrend.find((item) => item.tahun === selectedPeriode)
            : null;
        // Tahun pilihan bisa berada di luar rolling window trend. Reuse the
        // already-fetched cohort counts instead of adding a serial query.
        if (!selectedIntake && selectedPeriode) {
            const intakeCount = declineCounts.get(selectedPeriode) || 0;
            selectedIntake = {
                tahun: selectedPeriode,
                intakeCount,
            };
        }
        const latestIntake = selectedIntake || intakeTrend[intakeTrend.length - 1];
        const intakeCohortCount = latestIntake ? (latestIntake.intakeCount || latestIntake.count || 0) : 0;
        // A missing comparison baseline is materially different from a 0%
        // fluctuation. Keep that distinction in the API so the UI can explain
        // that the historical data is insufficient instead of implying a flat
        // trend.
        const declinePct = newStudentDecline?.declinePercentage;
        const hasEnoughDeclineData = Number.isFinite(declinePct);
        const isFluctuationPositive = hasEnoughDeclineData && declinePct >= 0;

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
                foreignRate,
                foreignStudentsCount,
                intakeCohortCount,
                declinePercentage: hasEnoughDeclineData ? declinePct : null,
                isFluctuationPositive,
                foreignCount: foreignStudentsCount,
                intakeCount: intakeCohortCount,
                intakePeriod: latestIntake?.tahun || null,
                declinePeriod: newStudentDecline?.selectedPeriod || null,
                hasEnoughDeclineData
            }
        });
    } catch (error) {
        return sendError(res, 500, 'Gagal mengambil summary statistik.', error, 'students/getSummary');
    }
};

// GET /api/students/international-detail — Detail chart mahasiswa asing per negara (TODO-12)
const getInternationalDetail = async (req, res) => {
    try {
        const baseFilter = buildStudentPopulationFilter(req.query);
        const result = await getInternationalStudentsTrend(baseFilter);
        return res.status(200).json({ success: true, ...result });
    } catch (error) {
        return sendError(res, 500, 'Gagal mengambil detail mahasiswa internasional.', error, 'students/getInternationalDetail');
    }
};

// GET /api/students/active-students — Detail chart totalActiveStudents (multisector breakdown)
const getActiveStudentsDetail = async (req, res) => {
    try {
        const baseFilter = buildStudentPopulationFilter(req.query);
        const multisector = await getActiveStudentsMultisector(baseFilter);
        return res.status(200).json({ success: true, ...multisector });
    } catch (error) {
        return sendError(res, 500, 'Gagal mengambil data mahasiswa aktif.', error, 'students/getActiveStudentsDetail');
    }
};

// GET /api/students/international-trend — Detail chart internationalStudentsTrend
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
        // getNewStudentDecline reuses the five-year intake trend and only
        // queries a year that is absent from that cache when necessary.
        const { trend: intakeTrend } = await getIntakeTrend(baseFilter);
        const selectedPeriode = req.query.selectedPeriode || req.query.tahunAjaran;
        const data = await getNewStudentDecline(selectedPeriode, baseFilter, intakeTrend);
        
        const declinePercentage = data?.declinePercentage;
        const isPositive = declinePercentage === null || declinePercentage === undefined || declinePercentage >= 0;
        const trendBadge = isPositive ? 'Peningkatan' : 'Penurunan';

        const chartData = (data?.history || []).map(h => ({
            year: h.year || h.academicYear,
            absolutCount: h.intakeCount || 0,
            deltaPercentage: h.changeFromPrev || 0
        }));

        return res.status(200).json({
            success: true,
            data,
            declineTrend: data,
            hasEnoughData: Boolean(declinePercentage !== null && declinePercentage !== undefined),
            // Properti persis yang diharapkan oleh IntakeFluctuationView.jsx & apiClient.js:
            isPositive,
            declinePercentage: declinePercentage ?? null,
            trendBadge,
            chartData,
            fluctuationData: {
                isPositive,
                hasEnoughData: Boolean(declinePercentage !== null && declinePercentage !== undefined),
                declinePercentage: declinePercentage ?? null,
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
        const services = req.studentDataServices || {};
        const whereFilter = (services.buildStudentFilter || buildStudentFilter)(req.query);
        const { limit, page } = (services.getPaginationParams || getPaginationParams)(req.query);
        
        const result = await (services.getStudentList || getStudentList)(whereFilter, page, limit, req.query.cursor, req.query);
        return res.status(200).json({ success: true, ...result });
    } catch (error) {
        return sendError(res, error.statusCode || 500, error.statusCode === 400 ? error.message : 'Gagal mengambil daftar mahasiswa.', error, 'students/getStudents');
    }
};

// GET /api/students/filter-options — Filter options untuk dropdown (dapat di-cache lebih lama)
const getFilterOptionsHandler = async (req, res) => {
    try {
        const options = await getFilterOptions();
        return res.status(200).json({
            success: true,
            data: options,
        });
    } catch (error) {
        return sendError(res, 500, 'Gagal mengambil opsi filter.', error, 'students/getFilterOptions');
    }
};

module.exports = {
    getSummary,
    getActiveStudentsDetail,
    getIntakeTrendDetail,
    getDeclineTrendDetail,
    getStudents,
    getInternationalDetail,
    getFilterOptionsHandler
};
