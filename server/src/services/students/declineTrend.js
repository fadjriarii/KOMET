/**
 * declineTrend.js
 * 
 * Menghitung persentase penurunan mahasiswa baru selama 5 tahun menggunakan formula rata-rata.
 * 
 * Variabel:
 * - A = intake tahun ke-N (tahun terpilih / terbaru)
 * - B = intake tahun ke-(N-1)
 * - C = intake tahun ke-(N-2)
 * - D = intake tahun ke-(N-3)
 * - E = intake tahun ke-(N-4)
 *
 * Formula:
 * % Perubahan MB = rata-rata dari perubahan tahun lama ke tahun terbaru:
 *   (A - B) / B, (B - C) / C, (C - D) / D, (D - E) / E
 *
 * Nilai negatif = terjadi penurunan mahasiswa baru.
 * Nilai positif = terjadi kenaikan mahasiswa baru.
 *
 * FIX BUG calcChange:
 * - `changeFromPrev` pada setiap titik menunjukkan perubahan dari titik tersebut (lebih lama)
 *   ke titik BERIKUTNYA (lebih baru/terkini).
 * - Contoh: B.changeFromPrev = perubahan dari B ke A = (A - B) / B * 100
 *   (positif = naik dari B ke A, negatif = turun)
 */

const { getIntakeCountsForYears } = require('./intakeTrend');
const { calculatePercentageChange } = require('../../utils/trendCalculation');
const logger = require('../../utils/logger');

/**
 * Dapatkan tahun akademik terbaru dari data intakeTrend.
 * Digunakan sebagai default jika selectedPeriode tidak diberikan.
 */
function getDefaultYear(intakeTrendData) {
    if (!intakeTrendData || intakeTrendData.length === 0) return null;
    // ambil yang tahun terbesar (paling akhir, sudah tersort ascending)
    return intakeTrendData[intakeTrendData.length - 1].tahun;
}

/**
 * Hitung penurunan mahasiswa baru 5 tahun ke belakang dari periode terpilih.
 * 
 * @param {string|null} selectedPeriode - Tahun akademik pilihan user format "YYYY/YYYY", atau null untuk default terbaru
 * @param {object} baseFilter - Filter dari buildBaseFilter() (tanpa semester & statusKeaktifan)
 * @param {Array} intakeTrendData - Hasil `trend` dari getIntakeTrend(). Ketika
 * kosong, tahun yang tidak tersedia di cache diambil dalam satu batch query.
 * @returns {Promise<object|null>} Data decline atau null jika tidak ada data
 */
async function getNewStudentDecline(selectedPeriode, baseFilter, intakeTrendData) {
    // Tentukan tahun yang akan dijadikan acuan (periode A = terbaru)
    let selectedYear = selectedPeriode;
    if (!selectedYear || !selectedYear.match(/^\d{4}\/\d{4}$/)) {
        selectedYear = getDefaultYear(intakeTrendData);
    }

    if (!selectedYear) {
        logger.info('[declineTrend] Tidak ada data intake trend, mengembalikan null.');
        return null;
    }

    const startYear = parseInt(selectedYear.split('/')[0]);
    if (isNaN(startYear)) {
        logger.warn(`[declineTrend] selectedPeriode tidak valid: ${selectedYear}`);
        return null;
    }

    const academicYears = Array.from({ length: 6 }, (_, index) => {
        const year = startYear - index;
        return `${year}/${year + 1}`;
    });
    const trendCounts = new Map(
        (Array.isArray(intakeTrendData) ? intakeTrendData : [])
            .map(({ tahun, intakeCount }) => [tahun, intakeCount])
    );
    // Reuse A–E from getIntakeTrend when available. Usually only F (the
    // comparison year for E) needs a database lookup, avoiding five queries.
    const missingYears = academicYears.filter((academicYear) => !trendCounts.has(academicYear));
    const queriedCounts = await getIntakeCountsForYears(missingYears, baseFilter);
    const counts = academicYears.map((academicYear) => (
        trendCounts.has(academicYear) ? trendCounts.get(academicYear) : (queriedCounts.get(academicYear) || 0)
    ));
    const [A, B, C, D, E, F] = counts;

    const terms = [A, B, C, D, E]
        .slice(0, -1)
        .map((newerCount, index) => calculateChange(newerCount, [B, C, D, E][index]))
        .filter(term => term !== null);

    const validTerms = terms;

    // Handle edge case: tidak ada data yang cukup untuk menghitung
    if (validTerms.length === 0) {
        logger.info(`[declineTrend] Tidak cukup data untuk menghitung penurunan MB pada periode ${selectedYear}.`);
        const hist = buildHistory(startYear, [A, B, C, D, E], false, F);
        return {
            selectedPeriod: selectedYear,
            declinePercentage: null,
            history: hist,
            historyOldestFirst: [...hist].reverse(),
            historyNewestFirst: hist,
            formula: 'avg((A-B)/B + (B-C)/C + (C-D)/D + (D-E)/E)'
        };
    }

    const declinePercentage = parseFloat((validTerms.reduce((sum, term) => sum + term, 0) / validTerms.length * 100).toFixed(2));

    const historyOldestFirst = buildHistory(startYear, [A, B, C, D, E], true, F).reverse();
    const historyNewestFirst = [...historyOldestFirst].reverse();

    return {
        selectedPeriod: selectedYear,
        declinePercentage,
        history: historyNewestFirst,          // Backward compatibility
        historyOldestFirst,                   // For charts
        historyNewestFirst,                   // For tables
        formula: 'avg((A-B)/B + (B-C)/C + (C-D)/D + (D-E)/E)'
    };
}

function calculateChange(newerCount, olderCount) {
    const result = calculatePercentageChange(newerCount, olderCount);
    return result ? result.rawGrowth : null;
}

function calculateAverageChange(counts) {
    const terms = counts.slice(0, -1)
        .map((newerCount, index) => calculateChange(newerCount, counts[index + 1]))
        .filter(term => term !== null);

    return terms.length
        ? parseFloat((terms.reduce((sum, term) => sum + term, 0) / terms.length * 100).toFixed(2))
        : null;
}

function buildHistory(startYear, counts, includeChanges, olderCount = null) {
    return counts.map((intakeCount, index) => ({
        label: String.fromCharCode(65 + index),
        academicYear: `${startYear - index}/${startYear + 1 - index}`,
        intakeCount,
        intakeCountFormatted: `${new Intl.NumberFormat('id-ID').format(intakeCount)} mhs`,
        // Perubahan tahun ini dibandingkan tahun akademik sebelumnya.
        // Dengan demikian tahun terbaru tetap memiliki persentase jika
        // tahun sebelumnya tersedia.
        changeFromPrev: includeChanges && (index < counts.length - 1 || olderCount !== null)
            ? toPercentage(calculateChange(intakeCount, index < counts.length - 1 ? counts[index + 1] : olderCount))
            : null
    }));
}

function toPercentage(value) {
    return value === null ? null : Number((value * 100).toFixed(2));
}

module.exports = { getNewStudentDecline, calculateAverageChange };
