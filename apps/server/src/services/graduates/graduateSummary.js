/**
 * graduateSummary.js
 *
 * Satu tempat perhitungan KPI tab Lulusan: controller hanya serialisasi hasil.
 * "Tidak ada data" dikirim sebagai null, bukan 0 — 0 adalah nilai metrik yang
 * sah dan tidak boleh dipakai untuk menutupi kegagalan atau data kosong.
 */

const { getGraduateFilterOptions } = require('./filterOptions');
const { getTahunAjaran } = require('./tahunAjaran');
const { getTotalLulusan } = require('./totalLulusan');
const { getAvgIpk } = require('./ipkTrend');
const { getTepatWaktu } = require('./tepatWaktu');
const { getKeberhasilanStudi } = require('./keberhasilanStudi');
const { getGraduateLabelWindow } = require('./yearJenjangSeries');
const { buildGraduateCards } = require('./graduateCards');

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
  'tahunAjaran',
];
const COHORT_PARAMS = [
  'search',
  'fakultas',
  'programStudi',
  'jenjang',
  'angkatanTahun',
  'tahunAjaran',
];

/**
 * Filter event yang aktif tetapi tidak dibaca Keberhasilan Studi — client
 * menyebutnya di subtitle supaya tidak dikira bug. Tahun Lulus default (tahun
 * terbaru dalam jangkar) bukan pilihan user, jadi tidak disebut.
 */
function ignoredStudySuccessFilters(query = {}, defaultTahunLulus = null) {
  const list = (value) => (Array.isArray(value) ? value : value ? [value] : []).filter(Boolean);
  const tahunLulus = list(query.tahunLulus);
  const ignored = [];
  if (tahunLulus.length && !(tahunLulus.length === 1 && tahunLulus[0] === defaultTahunLulus)) {
    ignored.push('tahunLulus');
  }
  if (list(query.periodeWisuda).length) ignored.push('periodeWisuda');
  if (list(query.predikat).length) ignored.push('predikat');
  return ignored;
}

async function getGraduateSummary(whereFilter, query = {}) {
  const [filterOptions, totalLulusan, avgIpk, tepatWaktu, keberhasilanStudi, labelRange] =
    await Promise.all([
      getGraduateFilterOptions(getTahunAjaran(whereFilter)),
      getTotalLulusan(whereFilter),
      getAvgIpk(whereFilter),
      getTepatWaktu(whereFilter),
      getKeberhasilanStudi(whereFilter),
      getGraduateLabelWindow(),
    ]);

  const cards = buildGraduateCards({ totalLulusan, avgIpk, tepatWaktu, keberhasilanStudi });
  cards.total.scope = totalLulusan.tahunScope ?? null;
  cards.gpa.scope = avgIpk.tahunScope ?? null;
  cards.onTime.scope = tepatWaktu.tahunScope ?? null;
  cards.studySuccess.ignoredFilters = ignoredStudySuccessFilters(
    query,
    filterOptions.rollingYears?.[0] ?? null,
  );

  return {
    referenceLabel: labelRange[labelRange.length - 1],
    labelRange,
    summary: {},
    // Satu bentuk kartu (nilai utama, scope kosong, rincian per jenjang terurut).
    kpis: { cards },
    kpiFilterScope: {
      total: GRADUATE_PARAMS,
      gpa: GRADUATE_PARAMS,
      onTime: GRADUATE_PARAMS,
      studySuccess: COHORT_PARAMS,
    },
    filterOptions,
  };
}

module.exports = { getGraduateSummary, ignoredStudySuccessFilters };
