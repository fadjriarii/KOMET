/**
 * filterOptionsSource.js
 *
 * Satu implementasi cache "opsi filter" untuk tab Student, Graduate, dan MBKM.
 * Sebelumnya ada tiga file dengan struktur yang sama; selisihnya cuma model,
 * kolom, dan urutan — jadi selisih itu yang dideklarasikan, implementasinya disatukan.
 */

const prisma = require('../config/prisma');

const CACHE_TTL_MS = 5 * 60 * 1000;

async function fetchDistinctValues(spec) {
  // `groupBy` beragregat di database. `findMany` + `distinct` pada MySQL justru
  // mengirim seluruh baris (primary key ikut ter-select) lalu membuang duplikat
  // di Node, jadi biayanya tumbuh bersama jumlah mahasiswa, bukan jumlah nilai.
  const rows = await prisma[spec.model].groupBy({
    by: [spec.field],
    ...(spec.where ? { where: spec.where } : {}),
    ...(spec.orderBy ? { orderBy: spec.orderBy } : {}),
    _count: { [spec.field]: true },
  });
  return rows.map((row) => row[spec.field]);
}

function shapeValues(spec, rawValues) {
  const filtered = rawValues.filter(Boolean);
  if (spec.rawOrder) return filtered;
  const sorted = [...filtered].sort(spec.comparator || undefined);
  return spec.desc ? sorted.reverse() : sorted;
}

/**
 * @param {object} options
 * @param {Record<string, object>} options.queries peta key respons -> spesifikasi kolom
 * @param {(values: Record<string, any[]>) => object} [options.derive] opsi tambahan hasil olahan
 */
function createFilterOptionsSource({ queries, derive }) {
  let cache = null;
  let cacheTime = 0;

  async function getFilterOptions(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && cache && now - cacheTime < CACHE_TTL_MS) return cache;

    const keys = Object.keys(queries);
    const fetched = await Promise.all(keys.map((key) => fetchDistinctValues(queries[key])));

    const values = {};
    keys.forEach((key, index) => {
      values[key] = shapeValues(queries[key], fetched[index]);
    });

    cache = derive ? { ...values, ...derive(values) } : values;
    cacheTime = now;
    return cache;
  }

  function clearFilterCache() {
    cache = null;
    cacheTime = 0;
  }

  return { getFilterOptions, clearFilterCache };
}

const numericAsc = (a, b) => a - b;

module.exports = { createFilterOptionsSource, numericAsc, CACHE_TTL_MS };
