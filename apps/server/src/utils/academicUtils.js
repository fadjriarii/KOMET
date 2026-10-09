/**
 * Util akademik khas Sevima: kode periode `YYYYT`, tahun referensi kartu, dan
 * jendela yang ditentukan dari data DB.
 *
 * Aturan tahun akademik itu sendiri (bulan rollover, label `YYYY/YYYY`,
 * jendela N tahun) hidup di `@komet/shared/academicYear` — server dan client
 * tidak boleh punya matematikanya masing-masing — kalau ada dua implementasi,
 * label tahun di client bisa menunjuk tahun yang berbeda dari snapshot yang
 * dihitung server.
 */
const {
  getCurrentAcademicYearStart,
  getAcademicYearWindow,
  formatAcademicYearLabel,
  parseAcademicYear: getAcademicYearStart,
} = require('@komet/shared/academicYear');

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
 * Jendela 5 label ajaran ke belakang dari tahun referensi label ajaran
 * (mis. `"2025/2026"`), dipakai kartu lulusan yang membaca kolom `tahunLulus`
 * yang kini menyimpan label. Bukan `getYearRange` (label kalender mentah).
 */
function getLabelYearRange(referenceLabel) {
  const refStart = getAcademicYearStart(referenceLabel);
  const anchor = refStart === null ? getReferenceLabelStart() : refStart;
  return Array.from({ length: TREND_WINDOW_YEARS }, (_, i) =>
    formatAcademicYearLabel(anchor - (TREND_WINDOW_YEARS - 1 - i)),
  );
}

/**
 * Tahun awal label ajaran terbaru yang ada di data (mis. `"2025/2026"` →
 * `2025`), atau tahun lalu bila tidak ada label yang valid. Jendela kartu
 * lulusan ikut data, bukan kalender.
 */
function getReferenceLabelStart(labels = []) {
  const starts = (Array.isArray(labels) ? labels : [])
    .map(getAcademicYearStart)
    .filter((year) => year !== null && year > 1900);
  return starts.length ? Math.max(...starts) : new Date().getFullYear() - 1;
}

/**
 * Label ajaran referensi kalender (tahun lalu), mis. `"2025/2026"`.
 * Padanan label dari `getReferenceYear` untuk kolom yang menyimpan label.
 */
function getReferenceLabel() {
  return formatAcademicYearLabel(getReferenceLabelStart());
}

/**
 * Menghitung rentang 5 tahun kalender ke belakang dari tahun referensi.
 * @returns {string[]} Array 5 string tahun
 */
function getYearRange() {
  const refYear = getReferenceYear();
  return Array.from({ length: TREND_WINDOW_YEARS }, (_, i) =>
    String(refYear - (TREND_WINDOW_YEARS - 1 - i)),
  );
}

/**
 * Mengembalikan tahun referensi (tahun lalu).
 * @returns {number}
 */
function getReferenceYear() {
  return new Date().getFullYear() - 1;
}

/**
 * Parsing satu-satunya untuk kode periode akademik Sevima "YYYYT"
 * (T = 1 Ganjil, 2 Genap). Nilai parsial/invalid menjadi null, bukan
 * tahun ajaran yang terlihat valid.
 *
 * @param {string|number|null} value
 * @returns {{year: number, term: '1'|'2', academicYear: string, isGanjil: boolean}|null}
 */
function parsePeriode(value) {
  const normalized = String(value ?? '').trim();
  if (!/^\d{5}$/.test(normalized)) return null;
  const year = Number(normalized.substring(0, 4));
  const term = normalized[4];
  if (year < 1900 || (term !== '1' && term !== '2')) return null;
  return {
    year,
    term,
    academicYear: `${year}/${year + 1}`,
    isGanjil: term === '1',
  };
}

/** Tahun dari kode periode, atau null bila tidak dapat diparse. */
function getPeriodeYear(value) {
  return parsePeriode(value)?.year ?? null;
}

/** Tahun awal studi: `periodeMasuk` bila ada, kalau tidak `angkatan` (label ajaran). */
function getStudyStartYear(student) {
  const fromPeriode = getPeriodeYear(student?.periodeMasuk);
  if (fromPeriode !== null) return fromPeriode;
  const labelStart = getAcademicYearStart(String(student?.angkatan ?? '').trim());
  if (labelStart !== null) return labelStart;
  const angkatan = Number(String(student?.angkatan ?? '').trim());
  return Number.isInteger(angkatan) && angkatan >= 1900 ? angkatan : null;
}

/**
 * Konversi kode periodeMasuk ke format tahun akademik.
 * Contoh: "20241" → "2024/2025"
 * @param {string} periodeMasuk
 * @returns {string|null}
 */
function toAcademicYear(periodeMasuk) {
  return parsePeriode(periodeMasuk)?.academicYear ?? null;
}

module.exports = {
  TREND_WINDOW_YEARS,
  getCurrentAcademicYearStart,
  getAcademicYearWindow,
  getAcademicYearStart,
  get5YearRollingAcademicYears,
  getLabelYearRange,
  getReferenceLabelStart,
  getReferenceLabel,
  getYearRange,
  getReferenceYear,
  parsePeriode,
  getPeriodeYear,
  getStudyStartYear,
  toAcademicYear,
};
