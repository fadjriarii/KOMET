/**
 * Jalur tulis DB pipeline sinkronisasi — barrel. Statement generik di `bulk`,
 * satu penulis per tabel (`studentWriter`, `graduateWriter`, `mbkmWriter`).
 */
const { bulkUpsertStudents } = require('./bulkWrite/studentWriter');
const { bulkUpsertGraduates } = require('./bulkWrite/graduateWriter');
const { replaceMbkmActivities } = require('./bulkWrite/mbkmWriter');
const { replaceCutiPeriods } = require('./bulkWrite/studentCutiWriter');

module.exports = {
  bulkUpsertStudents,
  bulkUpsertGraduates,
  replaceMbkmActivities,
  replaceCutiPeriods,
};
