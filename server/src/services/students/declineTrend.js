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
 * % Penurunan MB = rata-rata dari:
 *   (B - A) / A   ← perubahan dari tahun A ke B (B adalah tahun lebih lama)
 *   (C - B) / B
 *   (D - C) / C
 *   (E - D) / D
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
    const [A, B, C, D, E] = await Promise.all([
        getIntakeForYear(`${startYear}/${startYear + 1}`, baseFilter),
        getIntakeForYear(`${startYear - 1}/${startYear}`, baseFilter),
        getIntakeForYear(`${startYear - 2}/${startYear - 1}`, baseFilter),
        getIntakeForYear(`${startYear - 3}/${startYear - 2}`, baseFilter),
        getIntakeForYear(`${startYear - 4}/${startYear - 3}`, baseFilter)
    ]);

    // Hitung tiap term perubahan sesuai formula requirement:
    // % Penurunan MB = rata-rata dari (B-A)/A + (C-B)/B + (D-C)/C + (E-D)/D
    const term1 = A > 0 ? (B - A) / A : null;  // perubahan dari A ke B (arah historis)
    const term2 = B > 0 ? (C - B) / B : null;
    const term3 = C > 0 ? (D - C) / C : null;
    const term4 = D > 0 ? (E - D) / D : null;

    const validTerms = [term1, term2, term3, term4].filter(t => t !== null);

    // Handle edge case: tidak ada data yang cukup untuk menghitung
    if (validTerms.length === 0) {
        logger.info(`[declineTrend] Tidak cukup data untuk menghitung penurunan MB pada periode ${selectedYear}.`);
        return {
            selectedPeriod: selectedYear,
            declinePercentage: null,
            history: [
                { label: 'A', academicYear: `${startYear}/${startYear + 1}`, intakeCount: A, changeFromPrev: null },
                { label: 'B', academicYear: `${startYear - 1}/${startYear}`, intakeCount: B, changeFromPrev: null },
                { label: 'C', academicYear: `${startYear - 2}/${startYear - 1}`, intakeCount: C, changeFromPrev: null },
                { label: 'D', academicYear: `${startYear - 3}/${startYear - 2}`, intakeCount: D, changeFromPrev: null },
                { label: 'E', academicYear: `${startYear - 4}/${startYear - 3}`, intakeCount: E, changeFromPrev: null }
            ],
            formula: 'avg((B-A)/A + (C-B)/B + (D-C)/C + (E-D)/D)'
        };
    }

    const avgChange = validTerms.reduce((sum, t) => sum + t, 0) / validTerms.length;
    const declinePercentage = parseFloat((avgChange * 100).toFixed(2));

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
        history: [
            { label: 'A', academicYear: `${startYear}/${startYear + 1}`, intakeCount: A, changeFromPrev: null },
            { label: 'B', academicYear: `${startYear - 1}/${startYear}`, intakeCount: B, changeFromPrev: calcChange(A, B) },
            { label: 'C', academicYear: `${startYear - 2}/${startYear - 1}`, intakeCount: C, changeFromPrev: calcChange(B, C) },
            { label: 'D', academicYear: `${startYear - 3}/${startYear - 2}`, intakeCount: D, changeFromPrev: calcChange(C, D) },
            { label: 'E', academicYear: `${startYear - 4}/${startYear - 3}`, intakeCount: E, changeFromPrev: calcChange(D, E) }
        ],
        formula: 'avg((B-A)/A + (C-B)/B + (D-C)/C + (E-D)/D)'
    };
}

module.exports = { getNewStudentDecline };