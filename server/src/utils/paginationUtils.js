/**
 * Normalisasi parameter pagination dari query params.
 * @param {object} query - req.query object
 * @returns {{ page: number, limit: number, skip: number }}
 */
function getPaginationParams(query) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    return { page, limit, skip: (page - 1) * limit };
}

module.exports = { getPaginationParams };
