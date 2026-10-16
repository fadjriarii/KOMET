const { ALL_STATUSES, DEFAULT_STATUS, parseStatusSelection } = require('../snapshotConditions');

function buildStatusFilter(statusValues) {
  const { isAll, statuses } = parseStatusSelection(statusValues);
  // "Semua status" dikirim sebagai predikat eksplisit, bukan ketiadaan key,
  // supaya ensurePopulationFilter tidak mengumpulkannya kembali ke default.
  if (isAll) return { not: '' };
  return statuses.length === 1 ? statuses[0] : { in: statuses };
}

/**
 * Syarat baris terhitung mahasiswa internasional. Kunci utamanya KODE negara
 * (`idNegara` terisi dan bukan IDN) agar ejaan nama tak memecah hitungan;
 * baris tanpa kode jatuh ke nama tampilan (bukan ''/Indonesia). Aturan yang
 * sama dipakai filter WNA dan agregat tren — satu sumber.
 */
function foreignCondition() {
  return {
    OR: [
      { idNegara: { notIn: ['', 'IDN'] } },
      {
        AND: [{ idNegara: '' }, { kewarganegaraan: { notIn: ['', 'Indonesia'] } }],
      },
    ],
  };
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

module.exports = { ALL_STATUSES, buildStatusFilter, ensurePopulationFilter, foreignCondition };
