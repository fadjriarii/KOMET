const { ALL_STATUSES, DEFAULT_STATUS, parseStatusSelection } = require('../snapshotConditions');

function buildStatusFilter(statusValues) {
  const { isAll, statuses } = parseStatusSelection(statusValues);
  // "Semua status" dikirim sebagai predikat eksplisit, bukan ketiadaan key,
  // supaya ensurePopulationFilter tidak mengumpulkannya kembali ke default.
  if (isAll) return { not: '' };
  return statuses.length === 1 ? statuses[0] : { in: statuses };
}

/**
 * True bila filter memuat batas snapshot tahun akademik. Satu-satunya produsen
 * `periodeMasuk: { lte }` adalah `buildAcademicYearFilter()`, jadi cukup
 * ditanya begitu — tanpa mencocokkan serialisasi kondisi.
 */
function isAcademicSnapshot(where = {}) {
  const conditions = Array.isArray(where.AND) ? where.AND : [];
  return conditions.some((condition) => Boolean(condition?.periodeMasuk?.lte));
}

/**
 * Ensure consistent population filter across all student services.
 * If statusKeaktifan is not explicitly set and we're not in academic snapshot mode,
 * default to 'Aktif' status.
 *
 * This eliminates duplicate logic in activeStudents.js and internationalTrend.js.
 *
 * @param {object} baseFilter - The base filter from buildStudentFilter()
 * @returns {object} Filter with guaranteed statusKeaktifan handling
 */
function ensurePopulationFilter(baseFilter = {}) {
  if (baseFilter.statusKeaktifan || isAcademicSnapshot(baseFilter)) {
    return baseFilter;
  }
  return { ...baseFilter, statusKeaktifan: DEFAULT_STATUS };
}

module.exports = { ALL_STATUSES, buildStatusFilter, ensurePopulationFilter };
