/**
 * Util akademik khas Sevima: kode periode `YYYYT`, tahun referensi kartu, dan
 * jendela yang ditentukan dari data DB.
 *
 * Aturan tahun akademik itu sendiri (bulan rollover, label `YYYY/YYYY`,
 * jendela N tahun) hidup di `@komet/shared/academicYear` — server dan client
 * tidak boleh punya matematikanya masing-masing — kalau ada dua implementasi,
 * label tahun di client bisa menunjuk tahun yang berbeda dari snapshot yang
 * dihitung server.
 *
 * File ini hanya barrel: implementasi di `academic/` per topik.
 */
const { getCurrentAcademicYearStart } = require('@komet/shared/academicYear');
const {
  TREND_WINDOW_YEARS,
  MIN_ACADEMIC_YEAR_START,
  getAcademicYearWindow,
  getBoundedAcademicYearWindow,
  get5YearRollingAcademicYears,
  getBounded5YearRollingAcademicYears,
} = require('./academic/windows');
const {
  getLabelYearRange,
  getReferenceLabelStart,
  getYearRange,
  getReferenceYear,
} = require('./academic/reference');
const {
  parsePeriode,
  getPeriodeYear,
  getStudyStartYear,
  studySemesters,
  studyPeriodRange,
  toAcademicYear,
} = require('./academic/period');
const { parseAcademicYear: getAcademicYearStart } = require('@komet/shared/academicYear');

module.exports = {
  TREND_WINDOW_YEARS,
  MIN_ACADEMIC_YEAR_START,
  getCurrentAcademicYearStart,
  getAcademicYearWindow,
  getBoundedAcademicYearWindow,
  getAcademicYearStart,
  get5YearRollingAcademicYears,
  getBounded5YearRollingAcademicYears,
  getLabelYearRange,
  getReferenceLabelStart,
  getYearRange,
  getReferenceYear,
  parsePeriode,
  getPeriodeYear,
  getStudyStartYear,
  studySemesters,
  studyPeriodRange,
  toAcademicYear,
};
