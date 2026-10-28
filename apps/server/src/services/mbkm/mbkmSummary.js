/**
 * mbkmSummary.js
 *
 * Menyusun seluruh isi `GET /api/mbkm/summary`: periode efektif, empat kartu,
 * dan opsi filter. Kartu dihitung dari satu populasi (`population.js`), jadi
 * angka kartu, popup, dan tabel berasal dari definisi yang sama (ADR 0005).
 */
const { resolvePeriods } = require('./filterBuilder');
const { getMbkmFilterOptions } = require('./filterOptions');
const { loadMbkmPopulation, periodsLabel } = require('./population');
const { buildMbkmCards, KPI_FILTER_SCOPE } = require('./mbkmCards');

async function getMbkmSummary(query = {}) {
  const selectedPeriods = await resolvePeriods(query);
  const [filterOptions, population] = await Promise.all([
    getMbkmFilterOptions(false, { tahunAjaran: query.tahunAjaran, periode: query.periode }),
    loadMbkmPopulation(query, selectedPeriods),
  ]);

  return {
    selectedPeriode: selectedPeriods[0] ?? null,
    selectedPeriods,
    periodLabel: periodsLabel(selectedPeriods),
    summary: {},
    kpis: { cards: buildMbkmCards(population) },
    kpiFilterScope: KPI_FILTER_SCOPE,
    filterOptions,
  };
}

module.exports = { getMbkmSummary };
