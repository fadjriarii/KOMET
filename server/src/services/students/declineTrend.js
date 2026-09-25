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

const { getIntakeForYear } = require('./intakeTrend');
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
 * @param {Array} intakeTrendData - Hasil dari getIntakeTrend() — digunakan untuk menentukan tahun default
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

    // Ambil intake untuk 5 tahun (A = terbaru, E = paling lama)
    const [A, B, C, D, E, F] = await Promise.all([
        getIntakeForYear(`${startYear}/${startYear + 1}`, baseFilter),
        getIntakeForYear(`${startYear - 1}/${startYear}`, baseFilter),
        getIntakeForYear(`${startYear - 2}/${startYear - 1}`, baseFilter),
        getIntakeForYear(`${startYear - 3}/${startYear - 2}`, baseFilter),
        getIntakeForYear(`${startYear - 4}/${startYear - 3}`, baseFilter),
        // Satu tahun tambahan hanya digunakan sebagai pembanding untuk
        // baris tahun paling lama di tabel 5 tahun.
        getIntakeForYear(`${startYear - 5}/${startYear - 4}`, baseFilter)
    ]);

    const terms = [A, B, C, D, E]
        .slice(0, -1)
        .map((newerCount, index) => calculateChange(newerCount, [B, C, D, E][index]))
        .filter(term => term !== null);

    const validTerms = terms;

    // Handle edge case: tidak ada data yang cukup untuk menghitung
    if (validTerms.length === 0) {
        logger.info(`[declineTrend] Tidak cukup data untuk menghitung penurunan MB pada periode ${selectedYear}.`);
        return {
            selectedPeriod: selectedYear,
            declinePercentage: null,
            history: [
            ...buildHistory(startYear, [A, B, C, D, E], false, null, F)
            ],
            formula: 'avg((A-B)/B + (B-C)/C + (C-D)/D + (D-E)/E)'
        };
    }

    const declinePercentage = parseFloat((validTerms.reduce((sum, term) => sum + term, 0) / validTerms.length * 100).toFixed(2));

    /**
     * FIX BUG calcChange direction:
     * changeFromPrev pada setiap titik menunjukkan perubahan dari titik TERSEBUT ke titik BERIKUTNYA (lebih baru).
     * - B.changeFromPrev = (A - B) / B * 100  → perubahan dari tahun B ke tahun A
     * - C.changeFromPrev = (B - C) / C * 100  → perubahan dari tahun C ke tahun B
     * - dst.
     * Positif = naik menuju tahun yang lebih baru, negatif = turun.
     * A.changeFromPrev = null karena A adalah titik terbaru (tidak ada titik setelahnya).
     */
    const calcChange = (newerCount, olderCount) =>
        olderCount > 0
            ? parseFloat(((newerCount - olderCount) / olderCount * 100).toFixed(2))
            : null;

    return {
        selectedPeriod: selectedYear,
        declinePercentage,
        history: buildHistory(startYear, [A, B, C, D, E], true, calcChange, F),
        formula: 'avg((A-B)/B + (B-C)/C + (C-D)/D + (D-E)/E)'
    };
}

function calculateChange(newerCount, olderCount) {
    return olderCount > 0 ? (newerCount - olderCount) / olderCount : null;
}

function calculateAverageChange(counts) {
    const terms = counts.slice(0, -1)
        .map((newerCount, index) => calculateChange(newerCount, counts[index + 1]))
        .filter(term => term !== null);
    return terms.length
        ? parseFloat((terms.reduce((sum, term) => sum + term, 0) / terms.length * 100).toFixed(2))
        : null;
}

function buildHistory(startYear, counts, includeChanges, calcChange, olderCount = null) {
    return counts.map((intakeCount, index) => ({
        label: String.fromCharCode(65 + index),
        academicYear: `${startYear - index}/${startYear + 1 - index}`,
        intakeCount,
        intakeCountFormatted: `${new Intl.NumberFormat('id-ID').format(intakeCount)} mhs`,
        // Perubahan tahun ini dibandingkan tahun akademik sebelumnya.
        // Dengan demikian tahun terbaru tetap memiliki persentase jika
        // tahun sebelumnya tersedia.
        changeFromPrev: includeChanges && (index < counts.length - 1 || olderCount !== null)
            ? calcChange(intakeCount, index < counts.length - 1 ? counts[index + 1] : olderCount)
            : null
    }));
}

module.exports = { getNewStudentDecline, calculateAverageChange };
