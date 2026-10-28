const logger = require('../../utils/logger');
const { paginateSevimaPages } = require('./sevimaLookup');
const { getCurrentAcademicPeriode } = require('./academicPeriod');
const { sleep } = require('./config');

const CUTI_FETCH_CONCURRENCY = 1;
const CUTI_PERIOD_DELAY_MS = 500;

/**
 * NIM berstatus Cuti pada periode berjalan. Status Cuti tidak ada di endpoint
 * `/mahasiswa` (di sana tetap `A / Aktif`); satu-satunya sumbernya `/perwalian`.
 * Perwalian bisa mengembalikan baris ganda untuk satu NIM, jadi hasilnya Set.
 */
async function fetchCutiNims(periode = getCurrentAcademicPeriode()) {
  const nims = new Set();
  await paginateSevimaPages({
    endpoint: '/siakadcloud/v1/perwalian',
    params: { 'f-id_periode': periode, 'f-id_status_mahasiswa': 'C' },
    window: 1,
    onPage: (listData) => {
      for (const item of listData) {
        const attr = item.attributes || {};
        const nim = String(attr.nim || '').trim();
        const status = String(attr.id_status_mahasiswa || '')
          .trim()
          .toUpperCase();
        if (nim && status === 'C') nims.add(nim);
      }
    },
  });
  return nims;
}

/** Daftar periode Ganjil/Genap dari `startPeriode` sampai `endPeriode`, inklusif. */
function buildPeriodRange(startPeriode, endPeriode = getCurrentAcademicPeriode()) {
  const end = /^\d{4}[12]$/.test(String(endPeriode || '')) ? String(endPeriode) : null;
  if (!end) return [];
  const start = /^\d{4}[12]$/.test(String(startPeriode || '')) ? String(startPeriode) : end;
  if (start > end) return [end];
  const periods = [];
  for (let year = Number(start.slice(0, 4)); year <= Number(end.slice(0, 4)); year += 1) {
    for (const term of ['1', '2']) {
      const periode = `${year}${term}`;
      if (periode >= start && periode <= end) periods.push(periode);
    }
  }
  return periods;
}

/**
 * Riwayat cuti per periode. Nilai `null` menandai periode yang gagal diambil;
 * pemanggil tidak boleh menghapus riwayat lama untuk periode itu.
 */
async function fetchCutiHistory(periods = []) {
  const result = new Map();
  const queue = [...new Set(periods)];
  const worker = async () => {
    while (queue.length) {
      const periode = queue.shift();
      try {
        result.set(periode, await fetchCutiNims(periode));
      } catch (error) {
        result.set(periode, null);
        logger.warn(`[Mahasiswa] Gagal mengambil cuti periode ${periode}: ${error.message}`);
      }
      if (queue.length) await sleep(CUTI_PERIOD_DELAY_MS);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(CUTI_FETCH_CONCURRENCY, queue.length) }, () => worker()),
  );
  return result;
}

module.exports = { fetchCutiNims, fetchCutiHistory, buildPeriodRange };
