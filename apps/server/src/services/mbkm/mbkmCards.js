/**
 * mbkmCards.js
 *
 * Empat kartu KPI MBKM Data dari satu populasi (`population.js`). Semua
 * keputusan domain (nilai, rincian, kosong atau tidak, filter yang tidak
 * mengubah angka) dibuat di sini; client hanya merender. Tidak ada target:
 * halaman ini early warning system.
 */
const { roundedRate } = require('../../utils/percentageUtils');
const { partnerSummary } = require('./mbkmBreakdowns');

/** Param yang dibaca kartu partisipasi (pembilang ikut filter aktivitas). */
const PARTICIPATION_PARAMS = [
  'search',
  'fakultas',
  'programStudi',
  'jenisAktivitas',
  'angkatan',
  'statusAktivitas',
  'jenjang',
  'periode',
  'tahunAjaran',
];
/** Eligible hanya mengikuti filter mahasiswa dan periode. */
const ELIGIBLE_PARAMS = [
  'fakultas',
  'programStudi',
  'angkatan',
  'jenjang',
  'periode',
  'tahunAjaran',
];

const KPI_FILTER_SCOPE = {
  rate: PARTICIPATION_PARAMS,
  participants: PARTICIPATION_PARAMS,
  eligible: ELIGIBLE_PARAMS,
  mitra: PARTICIPATION_PARAMS,
};

const isActive = (value) =>
  Array.isArray(value) ? value.length > 0 : typeof value === 'string' && value.trim() !== '';

/** Filter aktif yang tidak dibaca sebuah kartu. */
function ignoredFilters(query, scope) {
  return ['search', 'jenisAktivitas', 'statusAktivitas'].filter(
    (key) => isActive(query[key]) && !scope.includes(key),
  );
}

/** Jumlah partisipan per status terbaiknya, urut rank (Selesai dulu). */
function participantsByStatus(participants) {
  const counts = new Map();
  for (const { best } of participants.values()) {
    const entry = counts.get(best.label) || { key: best.code, label: best.label, rank: best.rank };
    entry.value = (entry.value || 0) + 1;
    counts.set(best.label, entry);
  }
  return [...counts.values()]
    .sort((a, b) => b.rank - a.rank)
    .map(({ key, label, value }) => ({ key, label, value }));
}

function buildMbkmCards(population, query = {}) {
  const eligible = population.eligible.length;
  const participants = population.participants.size;
  const noEligible = eligible === 0;
  const partners = partnerSummary(population.participants);

  return {
    rate: {
      value: roundedRate(participants, eligible, null),
      isEmpty: noEligible,
      participants,
      eligible,
      ignoredFilters: ignoredFilters(query, KPI_FILTER_SCOPE.rate),
    },
    participants: {
      value: noEligible ? null : participants,
      isEmpty: noEligible,
      byStatus: participantsByStatus(population.participants),
      pending: population.pendingNims.size,
      ignoredFilters: ignoredFilters(query, KPI_FILTER_SCOPE.participants),
    },
    eligible: {
      value: eligible,
      isEmpty: noEligible,
      notParticipating: eligible - participants,
      ignoredFilters: ignoredFilters(query, KPI_FILTER_SCOPE.eligible),
    },
    // Mitra unik dari aktivitas terhitung (Disetujui/Selesai), bukan semua status.
    mitra: {
      ...partners,
      value: noEligible ? null : partners.totalPartners,
      isEmpty: noEligible,
      ignoredFilters: ignoredFilters(query, KPI_FILTER_SCOPE.mitra),
    },
  };
}

module.exports = { buildMbkmCards, KPI_FILTER_SCOPE };
