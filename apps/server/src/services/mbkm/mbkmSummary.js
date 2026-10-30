/**
 * mbkmSummary.js
 *
 * Menyusun seluruh isi `GET /api/mbkm/summary`: periode efektif, empat kartu,
 * dan opsi filter. Kartu dihitung dari populasi `population.js` dengan scope
 * kartunya (`cardQuery`, ADR 0007), jadi angka kartu sama dengan popup-nya.
 */
const prisma = require('../../config/prisma');
const { resolvePeriods } = require('./filterBuilder');
const { getMbkmFilterOptions } = require('./filterOptions');
const { loadMbkmPopulation, periodsLabel } = require('./population');
const { buildMbkmCards, cardQuery, KPI_FILTER_SCOPE } = require('./mbkmCards');

/**
 * Opsi Jenis Aktivitas mengikuti periode terpilih (semua status, terbanyak
 * dulu), supaya filter tidak menawarkan jenis yang tidak ada di tahun itu.
 */
async function jenisOptionsAt(periods) {
  if (!periods.length) return [];
  const groups = await prisma.mbkmActivity.groupBy({
    by: ['jenisAktivitas'],
    where: { periode: { in: periods }, jenisAktivitas: { not: '' } },
    _count: { jenisAktivitas: true },
    orderBy: [{ _count: { jenisAktivitas: 'desc' } }, { jenisAktivitas: 'asc' }],
  });
  return groups.map((group) => group.jenisAktivitas);
}

/** Populasi kartu; kedua (tanpa filter jenis) hanya dimuat bila jenis difilter. */
async function loadCardPopulations(query, periods) {
  const base = cardQuery(query, 'participation');
  const withoutJenis = cardQuery(query, 'jenis');
  const [population, jenisPopulation] = await Promise.all([
    loadMbkmPopulation(base, periods),
    base.jenisAktivitas ? loadMbkmPopulation(withoutJenis, periods) : null,
  ]);
  return { population, jenisPopulation: jenisPopulation || population };
}

async function getMbkmSummary(query = {}) {
  const selectedPeriods = await resolvePeriods(query);
  const [filterOptions, jenisAktivitas, { population, jenisPopulation }] = await Promise.all([
    getMbkmFilterOptions(false, { tahunAjaran: query.tahunAjaran, periode: query.periode }),
    jenisOptionsAt(selectedPeriods),
    loadCardPopulations(query, selectedPeriods),
  ]);

  return {
    selectedPeriode: selectedPeriods[0] ?? null,
    selectedPeriods,
    periodLabel: periodsLabel(selectedPeriods),
    summary: {},
    kpis: {
      cards: buildMbkmCards(population, {
        jenisPopulation,
        selectedJenis: query.jenisAktivitas,
      }),
    },
    kpiFilterScope: KPI_FILTER_SCOPE,
    filterOptions: { ...filterOptions, jenisAktivitas },
  };
}

module.exports = { getMbkmSummary };
