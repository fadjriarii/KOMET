/**
 * Menghitung tahun awal tahun akademik berjalan berdasarkan tanggal rollover 1 September.
 * Jika bulan >= September (bulan 8 di index 0-11, atau getMonth() + 1 >= 9): tahun sekarang (misal: 2026 -> 2026/2027, awal = 2026).
 * Jika bulan < September: tahun sekarang - 1 (misal Januari-Agustus 2026 -> 2025/2026, awal = 2025).
 *
 * @param {Date} date
 * @returns {number} Tahun awal akademik berjalan (misal 2026 untuk 2026/2027)
 */
function getCurrentAcademicYearStart(date = new Date()) {
    const d = new Date(date);
    const month = d.getMonth() + 1; // 1-12
    const year = d.getFullYear();
    return month >= 9 ? year : year - 1;
}

/**
 * Menghitung 5 tahun akademik bergulir (5-year rolling academic years) berbasis data aktual.
 *
 * Logika Data-Driven:
 * - Menentukan tahun akademik terbaru yang ada di data database (misal: '2024/2025' atau '2025/2026').
 * - Membentuk rentang 5 tahun ke belakang dari tahun terbaru tersebut.
 * - Ketika sinkronisasi data baru memasukkan tahun yang lebih baru (misal '2025/2026' baru masuk),
 *   jendela 5 tahun otomatis bergeser maju dan tahun terlama otomatis tereliminasi.
 *
 * @param {string[]|null} availableAcademicYears - Array tahun akademik yang ada di data (contoh: ['2020/2021', '2021/2022', ...])
 * @returns {string[]} Array 5 tahun akademik berurutan
 */
function get5YearRollingAcademicYears(availableAcademicYears = []) {
    let latestStartYear = null;

    if (Array.isArray(availableAcademicYears) && availableAcademicYears.length > 0) {
        const startYears = availableAcademicYears
            .map(ay => {
                const match = String(ay).match(/^(\d{4})\/(\d{4})$/);
                return match ? parseInt(match[1], 10) : parseInt(String(ay).substring(0, 4), 10);
            })
            .filter(y => !isNaN(y) && y > 1900);

        if (startYears.length > 0) {
            latestStartYear = Math.max(...startYears);
        }
    }

    if (!latestStartYear) {
        latestStartYear = new Date().getFullYear();
    }

    return Array.from({ length: 5 }, (_, i) => {
        const start = latestStartYear - 4 + i;
        return `${start}/${start + 1}`;
    });
}

/**
 * Menghitung rentang 5 tahun ke belakang dari tahun lalu.
 * @returns {string[]} Array 5 string tahun
 */
function getYearRange() {
    const refYear = new Date().getFullYear() - 1;
    return Array.from({ length: 5 }, (_, i) => String(refYear - 4 + i));
}

/**
 * Mengembalikan tahun referensi (tahun lalu).
 * @returns {number}
 */
function getReferenceYear() {
    return new Date().getFullYear() - 1;
}

/**
 * Konversi kode periodeMasuk ke format tahun akademik.
 * Contoh: "20241" → "2024/2025"
 * @param {string} periodeMasuk 
 * @returns {string|null}
 */
function toAcademicYear(periodeMasuk) {
    const normalized = String(periodeMasuk ?? '').trim();
    if (normalized.length < 4) return null;
    const yr = parseInt(normalized.substring(0, 4), 10);
    return isNaN(yr) ? null : `${yr}/${yr + 1}`;
}

module.exports = {
    getCurrentAcademicYearStart,
    get5YearRollingAcademicYears,
    getYearRange,
    getReferenceYear,
    toAcademicYear
};
