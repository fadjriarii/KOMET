const { createFilterOptionsSource } = require('../filterOptionsSource');
const { get5YearRollingAcademicYears, toAcademicYear } = require('../../utils/academicUtils');
const { JENJANGS } = require('@komet/shared/constants');

const hasMbkmActivity = { mbkmActivities: { some: {} } };

const mbkmQueries = {
  periode: {
    model: 'mbkmActivity',
    field: 'periode',
    orderBy: { periode: 'desc' },
    rawOrder: true,
  },
  fakultas: { model: 'mbkmActivity', field: 'fakultas', byCount: true },
  programStudi: { model: 'mbkmActivity', field: 'programStudi', byCount: true },
  angkatan: { model: 'student', field: 'angkatan', where: hasMbkmActivity, desc: true },
  statusAktivitas: { model: 'mbkmActivity', field: 'statusAktivitas' },
  jenjang: { model: 'mbkmActivity', field: 'jenjang', where: { jenjang: { in: JENJANGS } } },
};

/** Tahun ajaran diturunkan dari periode aktivitas agar opsi header ikut data. */
function deriveMbkmOptions({ periode }) {
  const academicYears = periode.map(toAcademicYear).filter(Boolean);
  return {
    academicYearOptions: get5YearRollingAcademicYears(academicYears).reverse(),
  };
}

const mbkmFilterOptions = createFilterOptionsSource({
  queries: mbkmQueries,
  derive: deriveMbkmOptions,
});

module.exports = {
  getMbkmFilterOptions: mbkmFilterOptions.getFilterOptions,
  clearMbkmFilterCache: mbkmFilterOptions.clearFilterCache,
};
