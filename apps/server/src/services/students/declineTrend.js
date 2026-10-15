/**
 * declineTrend.js
 *
 * Menghitung rata-rata perubahan intake mahasiswa baru pada jendela 5 tahun
 * (kartu "Penurunan Mahasiswa Baru").
 *
 * Formula: rata-rata dari perubahan tahun lama ke tahun berikutnya di dalam
 * jendela — (A-B)/B, (B-C)/C, (C-D)/D, (D-E)/E dengan A = tahun terpilih.
 * Nilai negatif = penurunan, positif = kenaikan.
 *
 * Jumlah perbandingan yang benar-benar masuk ke rata-rata ikut dikirim
 * (`comparisonsUsed`): tahun yang tidak ada di data tidak menjadi pembanding
 * dan tidak mengubah pembagi secara diam-diam.
 *
 * Fungsi ini murni: seluruh angka dibaca dari peta intake hasil
 * `getIntakeYearCounts()` (satu `groupBy` mencakup semua tahun), jadi tidak ada
 * query susulan yang membuat pemanggil harus menunggu setelah batch paralel.
 */
const { declineForSingleCohort, declineForMultiCohort } = require('./declineTrend/cohorts');
const { declineForRollingWindow } = require('./declineTrend/window');

/**
 * Hitung penurunan mahasiswa baru 5 tahun ke belakang dari periode terpilih,
 * atau sesuaikan dengan tahun angkatan yang dipilih user.
 *
 * @param {string|null} selectedPeriode - Tahun akademik "YYYY/YYYY" atau null (terbaru di data)
 * @param {Map<string, {total: number}>} yearCounts - Peta intake per tahun akademik
 * @param {string[]} [selectedCohortYears=[]] - Filter angkatan eksplisit dari query
 * @returns {object|null} Data decline atau null jika tidak ada data
 */
function getNewStudentDecline(selectedPeriode, yearCounts = new Map(), selectedCohortYears = []) {
  // Jika user memilih 1 angkatan: bandingkan dengan tahun sebelumnya
  if (selectedCohortYears.length === 1) {
    return declineForSingleCohort(selectedCohortYears[0], yearCounts);
  }

  // Jika user memilih lebih dari 1 angkatan: rata-rata persentase perubahan tahun terpilih
  if (selectedCohortYears.length > 1) {
    return declineForMultiCohort(selectedCohortYears, yearCounts);
  }

  return declineForRollingWindow(selectedPeriode, yearCounts);
}

module.exports = {
  getNewStudentDecline,
};
