const { formatAcademicYearLabel } = require('@komet/shared/academicYear');
const { parseAcademicYear: getAcademicYearStart } = require('@komet/shared/academicYear');
const { TREND_WINDOW_YEARS } = require('./windows');

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

module.exports = { getLabelYearRange, getReferenceLabelStart, getYearRange, getReferenceYear };
