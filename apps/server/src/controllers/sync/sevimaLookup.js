/**
 * Semua yang harus "ditebak" dari SEVIMA sebelum sebuah baris bisa ditulis:
 * NIM target yang sebenarnya, mapping prodi→fakultas, dan cara mengambil
 * halaman berturut-turut tanpa menunggu satu halaman selesai ditulis.
 *
 * File ini hanya barrel: implementasi di `sevimaLookup/` per topik.
 */
const { resolveTargetNimBatch } = require('./sevimaLookup/nimResolver');
const { getProdiFakultasMap, resolveFakultas } = require('./sevimaLookup/prodiMap');
const { paginateSevimaPages } = require('./sevimaLookup/pageFetcher');

module.exports = {
  resolveTargetNimBatch,
  getProdiFakultasMap,
  resolveFakultas,
  paginateSevimaPages,
};
