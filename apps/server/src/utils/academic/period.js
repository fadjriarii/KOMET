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

/**
 * Titik awal studi sebagai {year, term}: periode masuk awal rantai transfer bila
 * ada, lalu `periodeMasuk`, lalu label `angkatan` (dianggap mulai Ganjil).
 */
function studyStartPoint(student) {
  const periode = parsePeriode(student?.periodeMasukAwal) ?? parsePeriode(student?.periodeMasuk);
  if (periode) return { year: periode.year, term: Number(periode.term) };
  const labelStart = getAcademicYearStart(String(student?.angkatan ?? '').trim());
  return labelStart === null ? null : { year: labelStart, term: 1 };
}

/** Semester pendek (`YYYY3`) tidak dihitung sebagai semester: dibaca Genap tahun itu. */
const withoutShortTerm = (code) =>
  String(code ?? '')
    .trim()
    .replace(/^(\d{4})3$/, '$12');

/**
 * Titik akhir studi sebagai {year, term}: periode wisuda (`/kelulusan`), lalu
 * periode terakhir dari `/mahasiswa` (lulusan yang tidak pernah diterbitkan
 * `/kelulusan`), lalu label `tahunLulus` sebagai Genap.
 */
function studyEndPoint(student, graduate) {
  const lulus =
    parsePeriode(withoutShortTerm(graduate?.periodeWisuda)) ??
    parsePeriode(withoutShortTerm(student?.periodeTerakhir));
  if (lulus) return { year: lulus.year, term: Number(lulus.term) };
  const year = getAcademicYearStart(String(graduate?.tahunLulus ?? '').trim());
  return year === null || year === undefined ? null : { year, term: 2 };
}

const toCode = ({ year, term }) => `${year}${term}`;

/**
 * Rentang studi `{ start, end }` dalam kode periode (`YYYYT`), atau null bila
 * datanya tidak lengkap atau periode lulus sebelum periode masuk.
 */
function studyPeriodRange(student, graduate) {
  const start = studyStartPoint(student);
  const end = studyEndPoint(student, graduate);
  if (!start || !end) return null;
  const semesters = (end.year - start.year) * 2 + (end.term - start.term) + 1;
  return semesters >= 1 ? { start: toCode(start), end: toCode(end), semesters } : null;
}

/**
 * Jumlah semester yang ditempuh sampai lulus, inklusif: masuk 20201 → lulus
 * 20232 = 8 semester. Data tak lengkap atau periode lulus sebelum periode
 * masuk = null, bukan durasi palsu (ADR 0004).
 *
 * @param {{periodeMasukAwal?: string, periodeMasuk?: string, angkatan?: string, periodeTerakhir?: string}} student
 * @param {{periodeWisuda?: string, tahunLulus?: string}} graduate
 * @returns {number|null}
 */
function studySemesters(student, graduate) {
  return studyPeriodRange(student, graduate)?.semesters ?? null;
}

module.exports = {
  parsePeriode,
  getPeriodeYear,
  getStudyStartYear,
  studySemesters,
  studyPeriodRange,
  toAcademicYear,
};
