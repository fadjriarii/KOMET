/**
 * Menghitung rentang 5 tahun ke belakang dari tahun lalu.
 * Tahun referensi = new Date().getFullYear() - 1
 * Contoh (tahun sekarang 2026): returns ['2021','2022','2023','2024','2025']
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
    if (!periodeMasuk || periodeMasuk.length < 4) return null;
    const yr = parseInt(periodeMasuk.substring(0, 4));
    return isNaN(yr) ? null : `${yr}/${yr + 1}`;
}

module.exports = { getYearRange, getReferenceYear, toAcademicYear };

