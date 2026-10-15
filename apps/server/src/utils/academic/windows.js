const {
  getAcademicYearWindow,
  getBoundedAcademicYearWindow,
  MIN_ACADEMIC_YEAR_START,
} = require('@komet/shared/academicYear');
const { parseAcademicYear: getAcademicYearStart } = require('@komet/shared/academicYear');

/**
 * Lebar jendela tren yang dipakai semua chart 5 tahun (intake, penurunan,
 * mahasiswa asing). Satu angka agar jendela tren dan jendela pembanding tidak
 * bisa bergeser sendiri.
 */
const TREND_WINDOW_YEARS = 5;

/**
 * Menghitung rentang 5 tahun akademik bergulir (5-year rolling academic years) berbasis data aktual.
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
  const startYears = (Array.isArray(availableAcademicYears) ? availableAcademicYears : [])
    .map(getAcademicYearStart)
    .filter((year) => year !== null && year > 1900);

  const latestStartYear = startYears.length ? Math.max(...startYears) : new Date().getFullYear();

  return getAcademicYearWindow(latestStartYear, TREND_WINDOW_YEARS);
}

/**
 * Seperti `get5YearRollingAcademicYears`, tapi awal jendela dijepit di tahun
 * berdiri kampus (`MIN_ACADEMIC_YEAR_START`). Filter `2016/2017` menghasilkan
 * 3 titik (`2014/2015`–`2016/2017`), bukan 5 titik berisi tahun kosong.
 */
function getBounded5YearRollingAcademicYears(availableAcademicYears = []) {
  const startYears = (Array.isArray(availableAcademicYears) ? availableAcademicYears : [])
    .map(getAcademicYearStart)
    .filter((year) => year !== null && year > 1900);

  const latestStartYear = startYears.length ? Math.max(...startYears) : new Date().getFullYear();

  return getBoundedAcademicYearWindow(latestStartYear, TREND_WINDOW_YEARS);
}

module.exports = {
  TREND_WINDOW_YEARS,
  MIN_ACADEMIC_YEAR_START,
  getAcademicYearWindow,
  getBoundedAcademicYearWindow,
  get5YearRollingAcademicYears,
  getBounded5YearRollingAcademicYears,
};
