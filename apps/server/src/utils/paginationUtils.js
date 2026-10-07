const { DEFAULT_PAGE, MAX_PAGE_SIZE, TABLE_LIMIT } = require('@komet/shared/constants');

/**
 * Normalisasi parameter pagination dari query params.
 * @param {object} query - req.query object
 * @returns {{ page: number, limit: number, skip: number }}
 */
function getPaginationParams(query) {
  const page = Math.max(DEFAULT_PAGE, parseInt(query.page) || DEFAULT_PAGE);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(query.limit) || TABLE_LIMIT));
  return { page, limit, skip: (page - 1) * limit };
}

module.exports = { getPaginationParams };
