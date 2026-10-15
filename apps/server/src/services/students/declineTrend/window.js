const {
  getBounded5YearRollingAcademicYears,
  getAcademicYearStart,
} = require('../../../utils/academicUtils');
const { getDefaultAcademicYear, calculateChange, average, toPercentage } = require('./stats');
const logger = require('../../../utils/logger');

/**
 * Cabang jendela 5 tahun: rata-rata dari perubahan tahun lama ke tahun
 * berikutnya di dalam jendela — (A-B)/B, (B-C)/C, (C-D)/D, (D-E)/E dengan
 * A = tahun terpilih. Nilai negatif = penurunan, positif = kenaikan.
 */
function declineForRollingWindow(selectedPeriode, yearCounts) {
  const selectedYear = getAcademicYearStart(selectedPeriode) === null ? null : selectedPeriode;
  const anchorYear = selectedYear || getDefaultAcademicYear(yearCounts, getAcademicYearStart);

  if (!anchorYear) {
    logger.info('[declineTrend] Tidak ada data intake, mengembalikan null.');
    return null;
  }

  // Terbaru → terlama; chart membalik urutannya sendiri di client. Awal
  // jendela dijepit di tahun berdiri kampus (2014/2015): filter 2016/2017
  // menghasilkan 3 titik, bukan 5 titik berisi tahun kosong.
  const academicYears = getBounded5YearRollingAcademicYears([anchorYear]).reverse();
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

  // Baseline titik terlama: tahun tepat sebelum jendela. `undefined` = tahun
  // tidak ada di data (tetap null, bukan 0) — aturan yang sama dengan
  // `buildIntakeRow` sehingga baris tertua konsisten dengan tabel intake.
  // Rata-rata kartu (4 pembanding di dalam jendela) tidak ikut berubah.
  const oldestStart = getAcademicYearStart(academicYears[academicYears.length - 1]);
  const oldestBaseline =
    oldestStart === null ? undefined : yearCounts.get(`${oldestStart - 1}/${oldestStart}`)?.total;
  const oldestChange =
    oldestBaseline === undefined
      ? null
      : calculateChange(counts[counts.length - 1] ?? 0, oldestBaseline);

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
    yearsCount: academicYears.length,
    history: academicYears.map((academicYear, index) => ({
      // Satu titik per tahun akademik. `changeFromPrev` = perubahan dari tahun
      // akademik sebelumnya (lebih tua) ke tahun ini. Titik terlama memakai
      // baseline tepat di luar jendela (aturan yang sama dengan `buildIntakeRow`)
      // bila tahun itu ada di data; bila tidak ada, tetap null. Rata-rata kartu
      // (4 pembanding di dalam jendela) tidak berubah oleh tambahan tampilan ini.
      label: String.fromCharCode(65 + index),
      academicYear,
      intakeCount: counts[index] ?? 0,
      changeFromPrev:
        index < changes.length ? toPercentage(changes[index]) : toPercentage(oldestChange),
    })),
  };
}

module.exports = { declineForRollingWindow };
