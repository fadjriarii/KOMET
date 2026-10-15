/**
 * Jalur tulis DB pipeline sinkronisasi — barrel. Statement generik di `bulk`,
 * satu penulis per tabel (`studentWriter`, `graduateWriter`, `mbkmWriter`).
 */
const { bulkUpsertStudents } = require('./bulkWrite/studentWriter');
const { bulkUpsertGraduates } = require('./bulkWrite/graduateWriter');
const { bulkCreateMbkmActivities } = require('./bulkWrite/mbkmWriter');

module.exports = { bulkUpsertStudents, bulkUpsertGraduates, bulkCreateMbkmActivities };
