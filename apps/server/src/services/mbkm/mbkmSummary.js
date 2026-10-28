/**
 * mbkmSummary.js
 *
 * Menyusun seluruh isi `GET /api/mbkm/summary`: periode efektif, empat kartu,
 * dan opsi filter. Kartu dihitung dari satu populasi (`population.js`), jadi
 * angka kartu, popup, dan tabel berasal dari definisi yang sama (ADR 0005).
 */
const prisma = require('../../config/prisma');
const { resolvePeriods } = require('./filterBuilder');
const { getMbkmFilterOptions } = require('./filterOptions');
const { loadMbkmPopulation, periodsLabel } = require('./population');
const { buildMbkmCards, KPI_FILTER_SCOPE } = require('./mbkmCards');

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

async function getMbkmSummary(query = {}) {
  const selectedPeriods = await resolvePeriods(query);
  const [filterOptions, jenisAktivitas, population] = await Promise.all([
    getMbkmFilterOptions(false, { tahunAjaran: query.tahunAjaran, periode: query.periode }),
    jenisOptionsAt(selectedPeriods),
    loadMbkmPopulation(query, selectedPeriods),
  ]);

  return {
    selectedPeriode: selectedPeriods[0] ?? null,
    selectedPeriods,
    periodLabel: periodsLabel(selectedPeriods),
    summary: {},
    kpis: { cards: buildMbkmCards(population) },
    kpiFilterScope: KPI_FILTER_SCOPE,
    filterOptions: { ...filterOptions, jenisAktivitas },
  };
}

module.exports = { getMbkmSummary };
