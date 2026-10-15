const { calculatePercentageChange } = require('../../../utils/trendCalculation');

/** Tahun akademik terbaru yang ada di data — jangkar default kartu. */
function getDefaultAcademicYear(yearCounts, getAcademicYearStart) {
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

function calculateChange(newerCount, olderCount) {
  const result = calculatePercentageChange(newerCount, olderCount);
  return result ? result.rawGrowth : null;
}

/**
 * Rata-rata perubahan dalam persen, dikirim penuh seperti angka dari
 * `percentageUtils`: pembulatan adalah hak tampilan, dan di sini nilainya
 * dibulatkan dua kali sebelum sampai ke satu desimal.
 */
function average(changes) {
  if (!changes.length) return null;
  return (changes.reduce((sum, change) => sum + change, 0) / changes.length) * 100;
}

function toPercentage(value) {
  return value === null ? null : value * 100;
}

module.exports = { getDefaultAcademicYear, calculateChange, average, toPercentage };
