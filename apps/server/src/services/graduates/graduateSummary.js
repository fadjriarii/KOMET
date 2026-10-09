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
const { getGraduateLabelWindow } = require('./yearJenjangSeries');

const sumOrNull = (values) => {
  const known = values.filter((value) => typeof value === 'number');
  return known.length ? known.reduce((acc, value) => acc + value, 0) : null;
};

/**
 * Param query yang dibaca tiap agregasi — dasar badge "Terfilter" di client.
 * Keberhasilan studi menghitung kohort angkatan, jadi `tahunLulus`,
 * `periodeWisuda` dan `predikat` tidak mempersempitnya (lihat
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
  'predikat',
  'angkatanTahun',
];
const COHORT_PARAMS = ['search', 'fakultas', 'programStudi', 'jenjang', 'angkatanTahun'];

async function getGraduateSummary(whereFilter) {
  const [filterOptions, totalLulusan, avgIpk, tepatWaktu, keberhasilanStudi, labelRange] =
    await Promise.all([
      getGraduateFilterOptions(),
      getTotalLulusan(whereFilter),
      getAvgIpk(whereFilter),
      getTepatWaktu(whereFilter),
      getKeberhasilanStudi(whereFilter),
      getGraduateLabelWindow(),
    ]);

  // Total = seluruh jenjang populasi (dinamis incl `Prof`) — bukan S1+S2 saja.
  const jenjangCounts = Object.entries(totalLulusan).filter(
    ([key, value]) => key !== 'tahunScope' && typeof value === 'number',
  );

  return {
    referenceLabel: labelRange[labelRange.length - 1],
    labelRange,
    summary: { totalLulusan, avgIpk, tepatWaktu, keberhasilanStudi },
    kpis: {
      totalGraduates: sumOrNull(jenjangCounts.map(([, value]) => value)),
      totalGraduatesS1: totalLulusan.s1 ?? null,
      totalGraduatesS2: totalLulusan.s2 ?? null,
      totalGraduatesByJenjang: Object.fromEntries(jenjangCounts),
      onTimeGraduationRateS1: tepatWaktu.s1 ?? null,
      onTimeGraduationRateS2: tepatWaktu.s2 ?? null,
      onTimeByJenjang: Object.fromEntries(
        Object.entries(tepatWaktu).filter(
          ([key, value]) =>
            key !== 'referenceLabel' &&
            key !== 'tahunScope' &&
            (typeof value === 'number' || value === null),
        ),
      ),
      studySuccessRateS1: keberhasilanStudi.s1 ?? null,
      averageGpaS1: avgIpk.s1?.average ?? null,
      averageGpaS2: avgIpk.s2?.average ?? null,
      averageGpaByJenjang: Object.fromEntries(
        Object.entries(avgIpk)
          .filter(([key, value]) => key !== 'tahunScope' && value && typeof value === 'object')
          .map(([key, value]) => [key, value.average ?? null]),
      ),
      totalScopeLabel: totalLulusan.tahunScope?.label ?? null,
      totalScopePhrase: totalLulusan.tahunScope?.phrase ?? null,
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
