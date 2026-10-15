const { parseAcademicYear: getAcademicYearStart } = require('@komet/shared/academicYear');

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

module.exports = { parsePeriode, getPeriodeYear, getStudyStartYear, toAcademicYear };
