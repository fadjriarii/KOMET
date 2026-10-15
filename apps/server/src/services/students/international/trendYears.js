const prisma = require('../../../config/prisma');
const {
  toAcademicYear,
  getBounded5YearRollingAcademicYears,
} = require('../../../utils/academicUtils');
const {
  FILTER_SCOPES,
  buildStudentFilter,
  ensurePopulationFilter,
  getSelectedAcademicYear,
} = require('../filterBuilder');

/**
 * Jendela 5 tahun mengikuti tahun ajaran yang dipilih user (mis. pilih
 * 2021/2022 → 2017/2018 s.d. 2021/2022). Tanpa pilihan, ikut data terbaru
 * di DB seperti sebelumnya. Awal jendela dijepit di tahun berdiri kampus
 * (2014/2015): filter 2016/2017 menghasilkan 3 titik, bukan 5 titik berisi
 * tahun kosong. Satu agregat `_max` hanya dibutuhkan untuk mode tanpa
 * pilihan — bukan `distinct periodeMasuk` tiap request.
 */
async function resolveTrendYears(query) {
  const selectedAcademicYear = getSelectedAcademicYear(query);
  if (selectedAcademicYear) {
    return {
      selectedAcademicYear,
      rollingYears: getBounded5YearRollingAcademicYears([selectedAcademicYear]),
    };
  }
  const baseQuery = { ...query };
  delete baseQuery.kewarganegaraan;
  const windowFilter = buildStudentFilter(baseQuery, { scope: FILTER_SCOPES.ALL_YEARS });
  const latestPeriode = await prisma.student.aggregate({
    where: ensurePopulationFilter(windowFilter),
    _max: { periodeMasuk: true },
  });
  const availableAcademicYears = [toAcademicYear(latestPeriode._max.periodeMasuk)].filter(Boolean);
  return {
    selectedAcademicYear,
    rollingYears: getBounded5YearRollingAcademicYears(availableAcademicYears),
  };
}

module.exports = { resolveTrendYears };
