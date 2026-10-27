const logger = require('../utils/logger');
const { getCurrentAcademicYear } = require('@komet/shared/academicYear');

/**
 * Isi cache opsi filter sebelum pengguna pertama datang. Hanya dipanggil di
 * produksi: server pengembangan sering restart dan tidak perlu query tambahan.
 */
async function warmFilterOptions() {
  const { getFilterOptions } = require('./students/filterOptions');
  const { getGraduateFilterOptions } = require('./graduates/filterOptions');
  const { getMbkmFilterOptions } = require('./mbkm/filterOptions');

  const results = await Promise.allSettled([
    getFilterOptions(),
    getGraduateFilterOptions(),
    getMbkmFilterOptions(),
  ]);
  const failed = results.find((result) => result.status === 'rejected');
  if (failed) {
    logger.warn('Sebagian cache opsi filter gagal dipanaskan:', failed.reason?.message);
  }
}

/**
 * Panaskan summary default (tahun ajaran berjalan untuk Student, tahun ajaran
 * terbaru di data untuk MBKM, Tahun Lulus terbaru untuk Graduate) supaya kunjungan pertama tidak membayar query
 * dingin. Cache tetap dibuang setelah sync.
 */
async function warmSummaryCaches() {
  const { getOrLoad } = require('./summaryCache');
  const { getStudentSummary } = require('./students/studentSummary');
  const { getGraduateFilterOptions } = require('./graduates/filterOptions');
  const { buildGraduateFilter } = require('./graduates/filterBuilder');
  const { getGraduateSummary } = require('./graduates/graduateSummary');
  const { getMbkmSummary } = require('./mbkm/mbkmSummary');
  const { getMbkmFilterOptions } = require('./mbkm/filterOptions');

  const tahunAjaran = getCurrentAcademicYear();
  const graduateOptions = await getGraduateFilterOptions();
  const tahunLulus = graduateOptions?.rollingYears?.[0];

  // MBKM: tahun ajaran terbaru di data, sama dengan default client (ADR 0005).
  const mbkmYear = (await getMbkmFilterOptions()).academicYearOptions?.[0];

  const tasks = [
    getOrLoad('students', { tahunAjaran, statusKeaktifan: 'Aktif' }, () =>
      getStudentSummary({ tahunAjaran, statusKeaktifan: 'Aktif' }),
    ),
  ];
  if (mbkmYear) {
    const query = { tahunAjaran: mbkmYear };
    tasks.push(getOrLoad('mbkm', query, () => getMbkmSummary(query)));
  }
  if (tahunLulus) {
    const query = { tahunLulus };
    tasks.push(getOrLoad('graduates', query, () => getGraduateSummary(buildGraduateFilter(query))));
  }

  const results = await Promise.allSettled(tasks);
  const failed = results.find((result) => result.status === 'rejected');
  if (failed) {
    logger.warn('Sebagian cache summary gagal dipanaskan:', failed.reason?.message);
  }
}

async function warmServerCaches() {
  try {
    await warmFilterOptions();
  } catch (error) {
    logger.warn('Cache opsi filter tidak siap:', error.message);
  }
  try {
    await warmSummaryCaches();
  } catch (error) {
    logger.warn('Cache summary tidak siap:', error.message);
  }
}

module.exports = { warmServerCaches };
