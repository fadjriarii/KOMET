/**
 * mbkmDetails.js
 *
 * Isi popup satu kartu MBKM (`GET /api/mbkm/analytics/:card`): kartunya sendiri
 * (angka banner = angka kartu) dan `breakdowns` dari populasi yang sama.
 */
const { getAcademicYearPeriods, resolvePeriods } = require('./filterBuilder');
const { getMbkmFilterOptions } = require('./filterOptions');
const { loadMbkmPopulation, periodsLabel } = require('./population');
const { buildMbkmCards } = require('./mbkmCards');
const { roundedRate } = require('../../utils/percentageUtils');
const {
  participationBreakdowns,
  totalBreakdowns,
  jenisBreakdowns,
  mitraBreakdowns,
} = require('./mbkmBreakdowns');

const MBKM_DETAIL_CARDS = ['participation', 'total', 'mitra', 'jenis'];

/** Tingkat partisipasi per tahun ajaran (5 tahun data terakhir), urut kronologis. */
async function rateTrend(query) {
  const { academicYearOptions = [] } = await getMbkmFilterOptions();
  const years = [...academicYearOptions].reverse();
  const yearQuery = { ...query, periode: undefined };
  const populations = await Promise.all(
    years.map((tahunAjaran) =>
      loadMbkmPopulation({ ...yearQuery, tahunAjaran }, getAcademicYearPeriods(tahunAjaran)),
    ),
  );
  return {
    key: 'tahunAjaran',
    label: 'Tren per Tahun Ajaran',
    kind: 'rate',
    items: years.map((name, index) => {
      const { participants, eligible } = populations[index];
      return {
        name,
        count: participants.size,
        total: eligible.length,
        percentage: roundedRate(participants.size, eligible.length, null),
      };
    }),
  };
}

async function breakdownsFor(card, population, query) {
  if (card === 'participation') {
    const [fakultas, prodi, ...rest] = participationBreakdowns(population);
    return [fakultas, prodi, await rateTrend(query), ...rest];
  }
  if (card === 'total') return totalBreakdowns(population);
  if (card === 'jenis') return jenisBreakdowns(population);
  return mitraBreakdowns(population, query.topN);
}

async function getMbkmDetail(card, query = {}) {
  const selectedPeriods = await resolvePeriods(query);
  const population = await loadMbkmPopulation(query, selectedPeriods);
  return {
    selectedPeriode: selectedPeriods[0] ?? null,
    selectedPeriods,
    periodLabel: periodsLabel(selectedPeriods),
    card: buildMbkmCards(population)[card],
    breakdowns: await breakdownsFor(card, population, query),
  };
}

module.exports = { MBKM_DETAIL_CARDS, getMbkmDetail };
