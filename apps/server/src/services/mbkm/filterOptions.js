const { createFilterOptionsSource } = require('../filterOptionsSource');
const {
  get5YearRollingAcademicYears,
  getAcademicYearStart,
  toAcademicYear,
} = require('../../utils/academicUtils');
const { MBKM_STATUS_PARTISIPASI_OPTIONS } = require('@komet/shared/constants');
const { statusRuleOf } = require('./statusRules');

const hasMbkmActivity = { mbkmActivities: { some: {} } };

const mbkmQueries = {
  periode: {
    model: 'mbkmActivity',
    field: 'periode',
    orderBy: { periode: 'desc' },
    rawOrder: true,
  },
  fakultas: { model: 'mbkmActivity', field: 'fakultas', byCount: true },
  programStudi: { model: 'mbkmActivity', field: 'programStudi', byCount: true },
  jenisAktivitas: { model: 'mbkmActivity', field: 'jenisAktivitas', byCount: true },
  angkatan: { model: 'student', field: 'angkatan', where: hasMbkmActivity, desc: true },
  statusAktivitas: { model: 'mbkmActivity', field: 'statusAktivitas' },
  jenjang: { model: 'mbkmActivity', field: 'jenjang' },
};

/**
 * Opsi periode sengaja hanya Ganjil/Genap dan mengikuti tahun ajaran yang
 * sedang dipilih. Tanpa tahun ajaran eksplisit, pakai tahun dari periode yang
 * sedang difilter atau tahun terbaru di data.
 */
function deriveMbkmOptions(
  { periode: rawPeriods, statusAktivitas },
  { tahunAjaran, periode } = {},
) {
  const academicYears = rawPeriods.map(toAcademicYear).filter(Boolean);
  const starts = academicYears
    .map((label) => getAcademicYearStart(label))
    .filter((value) => value !== null);
  const latestStart = starts.length ? Math.max(...starts) : null;
  const selectedStart =
    getAcademicYearStart(tahunAjaran) ??
    getAcademicYearStart(toAcademicYear(periode)) ??
    latestStart;

  return {
    academicYearOptions: get5YearRollingAcademicYears(academicYears).reverse(),
    // Status urut rank aturan (Selesai dulu); status baru = `unclassified` di akhir.
    statusAktivitasOptions: statusAktivitas
      .map((label) => ({ value: label, label, ...statusRuleOf({ statusAktivitas: label }) }))
      .sort((a, b) => b.rank - a.rank || a.label.localeCompare(b.label))
      .map(({ value, label, category }) => ({ value, label, category })),
    statusPartisipasiOptions: MBKM_STATUS_PARTISIPASI_OPTIONS,
    periodeOptions:
      selectedStart === null
        ? []
        : [
            { value: `${selectedStart}1`, label: 'Ganjil' },
            { value: `${selectedStart}2`, label: 'Genap' },
          ],
  };
}

const mbkmFilterOptions = createFilterOptionsSource({
  queries: mbkmQueries,
  derive: deriveMbkmOptions,
});

module.exports = {
  getMbkmFilterOptions: mbkmFilterOptions.getFilterOptions,
  clearMbkmFilterCache: mbkmFilterOptions.clearFilterCache,
};
