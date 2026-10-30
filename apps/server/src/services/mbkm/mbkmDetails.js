/**
 * mbkmDetails.js
 *
 * Isi popup satu kartu MBKM (`GET /api/mbkm/analytics/:card`): kartunya sendiri
 * (angka banner = angka kartu) dan `breakdowns` dari populasi yang sama.
 */
const { getAcademicYearPeriods, resolvePeriods } = require('./filterBuilder');
const { loadMbkmPopulation, periodsLabel } = require('./population');
const { buildMbkmCards, cardQuery } = require('./mbkmCards');
const { roundedRate } = require('../../utils/percentageUtils');
const {
  TREND_WINDOW_YEARS,
  getAcademicYearStart,
  getAcademicYearWindow,
  toAcademicYear,
} = require('../../utils/academicUtils');
const {
  participationBreakdowns,
  totalBreakdowns,
  jenisBreakdowns,
  mitraBreakdowns,
} = require('./mbkmBreakdowns');

const MBKM_DETAIL_CARDS = ['participation', 'total', 'mitra', 'jenis'];

/** Lima tahun ajaran yang berakhir di tahun ajaran periode terpilih, urut kronologis. */
function trendYears(periods) {
  const start = getAcademicYearStart(toAcademicYear(periods[0]));
  return start === null ? [] : getAcademicYearWindow(start, TREND_WINDOW_YEARS);
}

/** Tingkat partisipasi per tahun ajaran dalam jendela tren, dengan scope kartu yang sama. */
async function rateTrend(query, periods) {
  const years = trendYears(periods);
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

async function breakdownsFor(card, population, query, periods) {
  if (card === 'participation') {
    const [fakultas, prodi, ...rest] = participationBreakdowns(population);
    return [fakultas, prodi, await rateTrend(query, periods), ...rest];
  }
  if (card === 'total') return totalBreakdowns(population);
  if (card === 'jenis') return jenisBreakdowns(population);
  return mitraBreakdowns(population, query.topN);
}

async function getMbkmDetail(card, query = {}) {
  const selectedPeriods = await resolvePeriods(query);
  // Scope kartu yang sama dengan summary, jadi angka banner = angka kartu.
  const scoped = cardQuery(query, card);
  const population = await loadMbkmPopulation(scoped, selectedPeriods);
  const cards = buildMbkmCards(population, { selectedJenis: query.jenisAktivitas });
  return {
    selectedPeriode: selectedPeriods[0] ?? null,
    selectedPeriods,
    periodLabel: periodsLabel(selectedPeriods),
    card: cards[card],
    breakdowns: await breakdownsFor(
      card,
      population,
      { ...scoped, topN: query.topN },
      selectedPeriods,
    ),
  };
}

module.exports = { MBKM_DETAIL_CARDS, getMbkmDetail, trendYears };
