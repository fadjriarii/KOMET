/**
 * graduateUtils.js
 * 
 * Helper utilitas untuk domain lulusan (Graduates).
 */

/**
 * Menghitung predikat kelulusan berdasarkan nilai IPK.
 * @param {number} ipk 
 * @param {boolean} fullLabel - Apakah menggunakan label lengkap ("Dengan Pujian (Cum Laude)")
 * @returns {string} Predikat kelulusan
 */
function calculatePredikat(ipk, fullLabel = false) {
    if (ipk >= 3.51) return fullLabel ? 'Dengan Pujian (Cum Laude)' : 'Cum Laude';
    if (ipk >= 3.01) return 'Sangat Memuaskan';
    return 'Memuaskan';
}

module.exports = { calculatePredikat };
