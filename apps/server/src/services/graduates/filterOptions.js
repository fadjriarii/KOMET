const { createFilterOptionsSource } = require('../filterOptionsSource');
const { JENJANGS } = require('@komet/shared/constants');

const hasGraduate = { graduate: { isNot: null } };
// Scope opsi harus sama dengan scope data: daftar nilai jenjang hanya berisi
// JENJANGS, supaya pilihan di UI tidak pernah menunjuk populasi yang kosong.
const inScope = { jenjang: { in: JENJANGS } };

const graduateQueries = {
  programStudi: { model: 'student', field: 'programStudi', where: hasGraduate },
  tahunLulus: { model: 'graduate', field: 'tahunLulus', desc: true },
  periodeWisuda: { model: 'graduate', field: 'periodeWisuda', desc: true },
  statusKelulusan: { model: 'graduate', field: 'statusKelulusan' },
  fakultas: { model: 'student', field: 'fakultas', where: hasGraduate },
  periodeMasuk: { model: 'student', field: 'periodeMasuk', where: hasGraduate, desc: true },
  jenjang: { model: 'graduate', field: 'jenjang', where: inScope },
};

const graduateFilterOptions = createFilterOptionsSource({ queries: graduateQueries });

module.exports = {
  getGraduateFilterOptions: graduateFilterOptions.getFilterOptions,
  clearGraduateFilterCache: graduateFilterOptions.clearFilterCache,
};
