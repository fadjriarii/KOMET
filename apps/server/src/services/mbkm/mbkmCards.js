/**
 * mbkmCards.js
 *
 * Empat kartu KPI MBKM Data dari satu populasi (`population.js`): partisipasi
 * semester 7 (persentase, partisipan, dan eligible dalam satu kartu), total
 * mahasiswa MBKM semua semester, mitra, dan bentuk kegiatan. Semua keputusan
 * domain dibuat di sini; client hanya menyusun kalimat. Tidak ada target:
 * halaman ini early warning system.
 */
const { roundedRate } = require('../../utils/percentageUtils');
const { jenisItems, partnerSummary } = require('./mbkmBreakdowns');

/**
 * Param yang dibaca semua kartu. Penyebut eligible tidak ikut jenis, status,
 * atau pencarian, tetapi pembilangnya ikut, jadi angka kartu berubah.
 */
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

const KPI_FILTER_SCOPE = {
  participation: MBKM_PARAMS,
  total: MBKM_PARAMS,
  mitra: MBKM_PARAMS,
  jenis: MBKM_PARAMS,
};

function buildMbkmCards(population) {
  const eligible = population.eligible.length;
  const participants = population.participants.size;
  const all = population.allParticipants.size;
  const partners = partnerSummary(population.allParticipants);
  const jenis = jenisItems(population.allParticipants);

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
    jenis: { value: jenis.length, isEmpty: all === 0, top: jenis.slice(0, 2) },
  };
}

module.exports = { buildMbkmCards, KPI_FILTER_SCOPE };
