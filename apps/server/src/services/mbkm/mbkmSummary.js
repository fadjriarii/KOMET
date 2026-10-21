/**
 * mbkmSummary.js
 *
 * Menyusun seluruh isi `GET /api/mbkm/summary`: periode efektif, angka kartu,
 * dan opsi filter. Controller tidak menghitung maupun merakit apa pun.
 *
 * `eligibleCount` hanya dihitung satu kali — lewat `getMbkmRate()` — memakai
 * proyeksi periode yang sama dengan pembilangnya. Saat user memilih tahun
 * ajaran tanpa periode, kedua periode (Ganjil + Genap) digabung.
 */
const { buildStudentFilterFromMbkmQuery, resolveMbkmQuery } = require('./filterBuilder');
const { getMbkmFilterOptions } = require('./filterOptions');
const { getMbkmRate } = require('./mbkmRate');
const { getMitraDistribution } = require('./mbkmMitra');

/**
 * Param query yang dibaca agregasi kartu Persentase MBKM — dasar badge
 * "Terfilter" di client. Penyebut hanya mengikuti filter populasi; pembilang
 * juga mengikuti search dan status aktivitas.
 */
const ACTIVITY_PARAMS = [
  'search',
  'fakultas',
  'programStudi',
  'angkatan',
  'statusAktivitas',
  'jenjang',
  'periode',
  'tahunAjaran',
];
/** Eligible hanya mengikuti filter populasi mahasiswa, bukan search/status aktivitas. */
const ELIGIBLE_PARAMS = [
  'fakultas',
  'programStudi',
  'angkatan',
  'jenjang',
  'periode',
  'tahunAjaran',
];
async function getMbkmSummary(query = {}) {
  const { selectedPeriode, selectedPeriods, whereFilter } = await resolveMbkmQuery(query);
  const topN = query.topN;

  const [filterOptions, rateData, mitra] = await Promise.all([
    getMbkmFilterOptions(false, {
      tahunAjaran: query.tahunAjaran,
      periode: query.periode,
    }),
    getMbkmRate(whereFilter, selectedPeriods, buildStudentFilterFromMbkmQuery(query)),
    getMitraDistribution(selectedPeriods, topN),
  ]);

  const { count, disetujuiCount, selesaiCount, evaluasiCount } = rateData.participantStats;
  const { numPercentage } = rateData.eligibleRate;
  const eligibleCount = rateData.eligibleCount;
  const totalMitra = mitra.totalPartners;

  return {
    selectedPeriode,
    selectedPeriods,
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
      eligibleCount,
      totalMitra,
    },
    kpiFilterScope: {
      // Pembilang dan rasio ikut berubah oleh filter aktivitas.
      totalParticipants: ACTIVITY_PARAMS,
      rate: ACTIVITY_PARAMS,
      // Penyebut tidak ikut search/status aktivitas.
      eligible: ELIGIBLE_PARAMS,
      // Distribusi mitra mengikuti periode yang sama dengan kartu lainnya.
      mitra: ['periode', 'tahunAjaran'],
    },
    filterOptions,
  };
}

module.exports = { getMbkmSummary };
