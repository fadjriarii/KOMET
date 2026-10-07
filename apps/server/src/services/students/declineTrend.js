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

const { getAcademicYearWindow, getAcademicYearStart } = require('../../utils/academicUtils');
const { calculatePercentageChange } = require('../../utils/trendCalculation');
const logger = require('../../utils/logger');

/** Tahun akademik terbaru yang ada di data — jangkar default kartu. */
function getDefaultAcademicYear(yearCounts) {
  let latest = null;
  let latestStart = -1;
  for (const academicYear of yearCounts.keys()) {
    const start = getAcademicYearStart(academicYear);
    if (start !== null && start > latestStart) {
      latestStart = start;
      latest = academicYear;
    }
  }
  return latest;
}

/**
 * Hitung penurunan mahasiswa baru 5 tahun ke belakang dari periode terpilih.
 *
 * @param {string|null} selectedPeriode - Tahun akademik "YYYY/YYYY" atau null (terbaru di data)
 * @param {Map<string, {total: number}>} yearCounts - Peta intake per tahun akademik
 * @returns {object|null} Data decline atau null jika tidak ada data
 */
function getNewStudentDecline(selectedPeriode, yearCounts = new Map()) {
  const selectedYear = getAcademicYearStart(selectedPeriode) === null ? null : selectedPeriode;
  const anchorYear = selectedYear || getDefaultAcademicYear(yearCounts);

  if (!anchorYear) {
    logger.info('[declineTrend] Tidak ada data intake, mengembalikan null.');
    return null;
  }

  // Terbaru → terlama; chart membalik urutannya sendiri di client.
  const academicYears = getAcademicYearWindow(getAcademicYearStart(anchorYear)).reverse();
  // `undefined` = tahun tidak ada di data, `0` = tahun ada tapi kosong. Hanya
  // tahun yang ada yang boleh menjadi pembanding — aturan yang sama dengan
  // deret tren intake (`buildIntakeRow`).
  const counts = academicYears.map((academicYear) => yearCounts.get(academicYear)?.total);
  // Elemen `slice(0, -1)` adalah tahun yang lebih baru; pembandingnya satu
  // indeks berikutnya (tahun yang lebih tua).
  const changes = counts
    .slice(0, -1)
    .map((newerCount, index) => calculateChange(newerCount ?? 0, counts[index + 1]));
  const usedChanges = changes.filter((change) => change !== null);

  if (!usedChanges.length) {
    logger.info(
      `[declineTrend] Tidak cukup data untuk menghitung penurunan MB pada periode ${anchorYear}.`,
    );
  }

  return {
    selectedPeriod: anchorYear,
    declinePercentage: average(usedChanges),
    comparisonsUsed: usedChanges.length,
    comparisonsTotal: changes.length,
    history: academicYears.map((academicYear, index) => ({
      // Satu titik per tahun akademik. `changeFromPrev` = perubahan dari tahun
      // akademik sebelumnya (lebih tua) ke tahun ini; titik terlama tidak punya
      // pembanding di dalam jendela, sehingga bernilai null.
      label: String.fromCharCode(65 + index),
      academicYear,
      intakeCount: counts[index] ?? 0,
      changeFromPrev: index < changes.length ? toPercentage(changes[index]) : null,
    })),
  };
}

function calculateChange(newerCount, olderCount) {
  const result = calculatePercentageChange(newerCount, olderCount);
  return result ? result.rawGrowth : null;
}

function average(changes) {
  if (!changes.length) return null;
  return parseFloat(
    ((changes.reduce((sum, change) => sum + change, 0) / changes.length) * 100).toFixed(2),
  );
}

function toPercentage(value) {
  return value === null ? null : Number((value * 100).toFixed(2));
}

/**
 * Rata-rata perubahan dari deret angka mentah (terbaru → terlama). Dipakai
 * sebagai aturan aritmetika yang sama di luar jalur summary.
 */
function calculateAverageChange(counts) {
  const changes = counts
    .slice(0, -1)
    .map((newerCount, index) => calculateChange(newerCount, counts[index + 1]))
    .filter((change) => change !== null);

  return average(changes);
}

module.exports = {
  getNewStudentDecline,
  getDefaultAcademicYear,
  calculateAverageChange,
};
