/**
 * graduateSummary.js
 *
 * Satu tempat perhitungan KPI tab Lulusan: controller hanya serialisasi hasil.
 * "Tidak ada data" dikirim sebagai null, bukan 0 — 0 adalah nilai metrik yang
 * sah dan tidak boleh dipakai untuk menutupi kegagalan atau data kosong.
 */

const { getGraduateFilterOptions } = require('./filterOptions');
const { getTotalLulusan } = require('./totalLulusan');
const { getAvgIpk } = require('./ipkTrend');
const { getTepatWaktu } = require('./tepatWaktu');
const { getKeberhasilanStudi } = require('./keberhasilanStudi');
const { getYearRange, getReferenceYear } = require('../../utils/academicUtils');

const sumOrNull = (values) => {
  const known = values.filter((value) => typeof value === 'number');
  return known.length ? known.reduce((acc, value) => acc + value, 0) : null;
};

/**
 * Param query yang dibaca tiap agregasi — dasar badge "Terfilter" di client.
 * Keberhasilan studi menghitung kohort angkatan, jadi `tahunLulus`,
 * `periodeWisuda` dan `statusKelulusan` tidak mempersempitnya (lihat
 * `getCohortScope`); memakainya sebagai pembilang akan memaksa rasio mendekati
 * 100%.
 */
const GRADUATE_PARAMS = [
  'search',
  'fakultas',
  'programStudi',
  'jenjang',
  'tahunLulus',
  'periodeWisuda',
  'statusKelulusan',
  'periodeMasuk',
];
const COHORT_PARAMS = ['search', 'fakultas', 'programStudi', 'jenjang', 'periodeMasuk'];

async function getGraduateSummary(whereFilter) {
  const [filterOptions, totalLulusan, avgIpk, tepatWaktu, keberhasilanStudi] = await Promise.all([
    getGraduateFilterOptions(),
    getTotalLulusan(whereFilter),
    getAvgIpk(whereFilter),
    getTepatWaktu(whereFilter),
    getKeberhasilanStudi(whereFilter),
  ]);

  return {
    referenceYear: getReferenceYear(),
    yearRange: getYearRange(),
    summary: { totalLulusan, avgIpk, tepatWaktu, keberhasilanStudi },
    kpis: {
      totalGraduates: sumOrNull([totalLulusan.s1, totalLulusan.s2]),
      totalGraduatesS1: totalLulusan.s1,
      totalGraduatesS2: totalLulusan.s2,
      onTimeGraduationRateS1: tepatWaktu.s1,
      onTimeGraduationRateS2: tepatWaktu.s2,
      studySuccessRateS1: keberhasilanStudi.s1,
      averageGpaS1: avgIpk.s1.average,
      averageGpaS2: avgIpk.s2.average,
    },
    kpiFilterScope: {
      total: GRADUATE_PARAMS,
      gpa: GRADUATE_PARAMS,
      onTime: GRADUATE_PARAMS,
      studySuccess: COHORT_PARAMS,
    },
    filterOptions,
  };
}

module.exports = { getGraduateSummary };
