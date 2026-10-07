/**
 * mbkmSummary.js
 *
 * Menyusun seluruh isi `GET /api/mbkm/summary`: periode efektif, angka kartu,
 * dan opsi filter. Controller tidak menghitung maupun merakit apa pun.
 *
 * `eligibleCount` hanya dihitung satu kali — lewat `getMbkmRate()` — karena
 * kartu "% MBKM", "Total Eligible", dan tabel eligible memakai definisi yang
 * sama (`buildEligibleStudentWhere`).
 */
const {
  buildStudentFilterFromMbkmQuery,
  getPreviousPeriode,
  resolveMbkmQuery,
} = require('./filterBuilder');
const { getMbkmFilterOptions } = require('./filterOptions');
const { getMbkmRate } = require('./mbkmRate');
const { getMitraDistribution } = require('./mbkmMitra');

/**
 * Param query yang benar-benar dibaca tiap agregasi — dasar badge "Terfilter" di
 * client. Dulu client menebak sendiri dan menandai semua kartu sama rata, padahal
 * kartu mitra hanya mengikuti periode dan kartu eligible tidak membaca search
 * maupun status aktivitas (lihat `buildStudentFilterFromMbkmQuery`).
 */
const ACTIVITY_PARAMS = [
  'search',
  'fakultas',
  'programStudi',
  'angkatan',
  'statusAktivitas',
  'jenjang',
  'periode',
];
const ELIGIBLE_PARAMS = ['fakultas', 'programStudi', 'angkatan', 'jenjang'];

async function getMbkmSummary(query = {}) {
  const { selectedPeriode, whereFilter } = await resolveMbkmQuery(query);
  const previousPeriode = getPreviousPeriode(selectedPeriode);
  const topN = query.topN;

  const [filterOptions, rateData, mitra] = await Promise.all([
    getMbkmFilterOptions(),
    getMbkmRate(whereFilter, selectedPeriode, buildStudentFilterFromMbkmQuery(query)),
    getMitraDistribution(previousPeriode, topN),
  ]);

  const { count, disetujuiCount, selesaiCount, evaluasiCount } = rateData.participantStats;
  const { numPercentage, meetsTarget, targetIku2 } = rateData.eligibleRate;
  const eligibleCount = rateData.eligibleCount;
  const totalMitra = mitra.totalPartners;

  return {
    selectedPeriode,
    previousPeriode,
    summary: {
      persentaseMbkm: { mbkmCount: count, eligibleCount, percentage: numPercentage },
      totalMbkmAktif: disetujuiCount,
      totalEligible: eligibleCount,
      totalMitra,
    },
    // Flat kpis object persis sesuai harapan MbkmPage.jsx:
    kpis: {
      totalParticipants: count,
      selesaiCount,
      evaluasiCount,
      berjalanCount: disetujuiCount,
      participationRate: numPercentage,
      meetsIkuTarget: meetsTarget,
      targetIku2,
      eligibleCount,
      totalMitra,
    },
    kpiFilterScope: {
      // Rasio = partisipan ∩ eligible; penyebutnya subset param pembilang.
      rate: ACTIVITY_PARAMS,
      participants: ACTIVITY_PARAMS,
      eligible: ELIGIBLE_PARAMS,
      // Distribusi mitra dibangun dari periode tetangga, bukan dari filter populasi.
      mitra: ['periode'],
    },
    filterOptions,
  };
}

module.exports = { getMbkmSummary };
