/**
 * mbkmCards.js
 *
 * Empat kartu KPI MBKM Data dari satu populasi (`population.js`): partisipasi
 * semester 7 (persentase, partisipan, dan eligible dalam satu kartu), total
 * mahasiswa MBKM semua semester, mitra, dan bentuk kegiatan. Bentuk kegiatan
 * memakai populasi yang sama tanpa filter jenis (ADR 0007). Semua keputusan
 * domain dibuat di sini; client hanya menyusun kalimat. Tidak ada target:
 * halaman ini early warning system.
 */
const { MBKM_TABLE_ONLY_FILTERS } = require('@komet/shared/constants');
const { roundedRate } = require('../../utils/percentageUtils');
const { jenisItems, partnerSummary } = require('./mbkmBreakdowns');

/** Semua param query MBKM yang menyaring data (tabel membaca semuanya). */
const MBKM_PARAMS = [
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

/** Param yang dibaca kartu: kartu selalu memakai partisipan Disetujui/Selesai (ADR 0007). */
const CARD_PARAMS = MBKM_PARAMS.filter((param) => !MBKM_TABLE_ONLY_FILTERS.includes(param));

const KPI_FILTER_SCOPE = {
  participation: CARD_PARAMS,
  total: CARD_PARAMS,
  mitra: CARD_PARAMS,
  // Bentuk Kegiatan menghitung semua jenis; jenis terpilih hanya disorot.
  jenis: CARD_PARAMS.filter((param) => param !== 'jenisAktivitas'),
};

/** Query yang dibaca satu kartu: hanya param dalam scope-nya. */
function cardQuery(query = {}, card) {
  return Object.fromEntries(
    KPI_FILTER_SCOPE[card]
      .filter((key) => query[key] !== undefined)
      .map((key) => [key, query[key]]),
  );
}

/**
 * @param {object} population populasi dengan scope kartu partisipasi
 * @param {object} [options]
 * @param {object} [options.jenisPopulation] populasi tanpa filter jenis (kartu Bentuk Kegiatan)
 * @param {string[]} [options.selectedJenis] jenis yang sedang difilter, untuk disorot
 */
function buildMbkmCards(population, { jenisPopulation = population, selectedJenis = [] } = {}) {
  const eligible = population.eligible.length;
  const participants = population.participants.size;
  const all = population.allParticipants.size;
  const partners = partnerSummary(population.allParticipants);
  const jenis = jenisItems(jenisPopulation.allParticipants);
  const selected = [selectedJenis]
    .flat()
    .filter(Boolean)
    .map((name) => String(name).trim());

  return {
    participation: {
      value: roundedRate(participants, eligible, null),
      isEmpty: eligible === 0,
      participants,
      eligible,
      notParticipating: eligible - participants,
      pending: population.pendingNims.size,
    },
    total: { value: all, isEmpty: all === 0, semester7: participants },
    mitra: { ...partners, value: partners.totalPartners, isEmpty: all === 0 },
    jenis: {
      value: jenis.length,
      isEmpty: jenisPopulation.allParticipants.size === 0,
      top: jenis.slice(0, 2),
      // Persentase relatif ke semua partisipan, sama dengan tab popup.
      selected: selected.length ? jenis.filter((item) => selected.includes(item.name)) : [],
    },
  };
}

module.exports = { buildMbkmCards, cardQuery, KPI_FILTER_SCOPE };
