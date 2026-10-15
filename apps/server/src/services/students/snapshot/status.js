const { STUDENT_STATUS } = require('@komet/shared/constants');

/**
 * Satu encoding untuk "semua status": sentinel ALL dari klien. Nilai kosong
 * atau tidak dikirim berarti populasi default dashboard (DEFAULT_STATUS).
 */
const ALL_STATUSES = 'ALL';
const DEFAULT_STATUS = STUDENT_STATUS.AKTIF;

module.exports = { ALL_STATUSES, DEFAULT_STATUS };
