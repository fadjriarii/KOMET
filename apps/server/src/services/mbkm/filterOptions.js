const { createFilterOptionsSource } = require('../filterOptionsSource');
const { JENJANGS } = require('@komet/shared/constants');

const hasMbkmActivity = { mbkmActivities: { some: {} } };

const mbkmQueries = {
  periode: {
    model: 'mbkmActivity',
    field: 'periode',
    orderBy: { periode: 'desc' },
    rawOrder: true,
  },
  fakultas: { model: 'mbkmActivity', field: 'fakultas' },
  programStudi: { model: 'mbkmActivity', field: 'programStudi' },
  angkatan: { model: 'student', field: 'angkatan', where: hasMbkmActivity, desc: true },
  statusAktivitas: { model: 'mbkmActivity', field: 'statusAktivitas' },
  jenjang: { model: 'mbkmActivity', field: 'jenjang', where: { jenjang: { in: JENJANGS } } },
};

const mbkmFilterOptions = createFilterOptionsSource({ queries: mbkmQueries });

module.exports = {
  getMbkmFilterOptions: mbkmFilterOptions.getFilterOptions,
  clearMbkmFilterCache: mbkmFilterOptions.clearFilterCache,
};
