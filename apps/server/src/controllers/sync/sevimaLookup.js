/**
 * Semua yang harus "ditebak" dari SEVIMA sebelum sebuah baris bisa ditulis:
 * NIM target yang sebenarnya, mapping prodi→fakultas, dan cara mengambil
 * halaman berturut-turut tanpa menunggu satu halaman selesai ditulis.
 */
const prisma = require('../../config/prisma');
const sevimaApi = require('../../config/sevimaApi');
const logger = require('../../utils/logger');
const { STUDENT_STATUS } = require('@komet/shared/constants');
const { cleanText, sanitizeText, sanitizeProdiName } = require('./text');
const { formatAngkatan, extractPeriode, hitungSemester } = require('./academicPeriod');
const { SYNC_FETCH_WINDOW, SYNC_PAGE_DELAY_MS, sleep } = require('./config');

// Helper Resolver NIM Bulk (Pre-fetch In-Memory Map) untuk Batch Sync tanpa N+1 Query
async function resolveTargetNimBatch(items, extractNimFn, extractNamaFn, extraDataFn = () => ({})) {
  if (!items || items.length === 0) return new Map();

  const prodiFakultasMap = await getProdiFakultasMap();

  const nimsToLookup = new Set();
  items.forEach((item) => {
    const rawNim = extractNimFn(item);
    if (rawNim) {
      nimsToLookup.add(rawNim);
      const cleanNim = rawNim.replace(/x/gi, '');
      if (cleanNim) nimsToLookup.add(cleanNim);
    }
  });

  const existingStudents = await prisma.student.findMany({
    where: { nim: { in: Array.from(nimsToLookup) } },
    select: { nim: true },
  });

  const existingNimSet = new Set(existingStudents.map((s) => s.nim));
  const resolvedMap = new Map();
  const studentsToCreate = [];

  for (const item of items) {
    const rawNim = extractNimFn(item);
    if (!rawNim) continue;

    const cleanNim = rawNim.replace(/x/gi, '');

    if (existingNimSet.has(rawNim)) {
      resolvedMap.set(item, rawNim);
    } else if (cleanNim && existingNimSet.has(cleanNim)) {
      resolvedMap.set(item, cleanNim);
    } else {
      const targetNim = cleanNim || rawNim;
      resolvedMap.set(item, targetNim);

      if (!existingNimSet.has(targetNim)) {
        existingNimSet.add(targetNim); // Hindari duplikat create dalam batch yang sama
        const extraData = extraDataFn(item) || {};
        const idPeriode = extraData.id_periode_akademik || extraData.id_periode || '';
        const rawProdi = extraData.programStudi || extraData.prodiName || '';
        const prodi = sanitizeProdiName(rawProdi);
        const jenjang = extraData.jenjang || extraData.id_jenjang_program_studi || 'S1';
        const statusKeaktifan = extraData.defaultStatusKeaktifan || STUDENT_STATUS.AKTIF;
        const fakultas =
          extraData.fakultas ||
          prodiFakultasMap.get(cleanText(rawProdi)) ||
          prodiFakultasMap.get(cleanText(prodi)) ||
          '';
        const semester =
          extraData.defaultSemester ||
          (statusKeaktifan === STUDENT_STATUS.LULUS ? hitungSemester(idPeriode, idPeriode) : 1);

        studentsToCreate.push({
          nim: targetNim,
          nama: extractNamaFn(item) || '',
          jenjang,
          periodeMasuk: idPeriode,
          periodeTerakhir: statusKeaktifan === STUDENT_STATUS.LULUS ? idPeriode : '',
          angkatan: formatAngkatan(idPeriode),
          periode: extractPeriode(idPeriode),
          programStudi: prodi,
          fakultas,
          statusKeaktifan,
          semester,
          kewarganegaraan: 'Indonesia',
        });
      }
    }
  }

  if (studentsToCreate.length > 0) {
    await prisma.student.createMany({
      data: studentsToCreate,
      skipDuplicates: true,
    });
  }

  return resolvedMap;
}

// In-Memory Cache untuk Program Studi & Fakultas (TTL: 1 jam)
let prodiCache = null;
let prodiCacheTime = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 Jam

// Helper untuk fetch seluruh Program Studi & buat lookup Fakultas dengan In-Memory Caching
async function getProdiFakultasMap(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && prodiCache && now - prodiCacheTime < CACHE_TTL_MS) {
    logger.info('🧠 Membaca mapping Program Studi dari In-Memory Cache.');
    return prodiCache;
  }

  try {
    logger.info('🌐 Mengambil data Program Studi dari SEVIMA API...');
    const response = await sevimaApi.get('/siakadcloud/v1/program-studi');
    const listData = response.data.data || [];
    const map = new Map();

    for (const item of listData) {
      const attr = item.attributes;
      const rawName = attr.nama_program_studi || '';
      const namaFakultas = attr.nama_fakultas || '';
      const cleanName = sanitizeProdiName(rawName);

      if (rawName) {
        map.set(cleanText(rawName), namaFakultas);
        map.set(rawName.trim().toLowerCase(), namaFakultas);
      }
      if (cleanName) {
        map.set(cleanText(cleanName), namaFakultas);
        map.set(cleanName.trim().toLowerCase(), namaFakultas);
      }
    }

    prodiCache = map;
    prodiCacheTime = now;
    logger.success(`🧠 Berhasil memuat ${listData.length} data Program Studi ke In-Memory Cache.`);
    return map;
  } catch (error) {
    logger.error('⚠️ Gagal mengambil mapping program-studi:', error.message);
    return prodiCache || new Map();
  }
}

/**
 * Fakultas sebuah baris SEVIMA dari peta prodi→fakultas: coba nama mentah lalu
 * nama hasil sanitasi, masing-masing bentuk bersih dan lowercase. `fallback`
 * dipakai bila peta tidak mengenal prodi ini (baris mahasiswa masih membawa
 * `nama_fakultas` dari API).
 */
function resolveFakultas(attr, prodiName, prodiFakultasMap, fallback = '') {
  const rawProdi = attr.program_studi || '';
  return sanitizeText(
    prodiFakultasMap.get(cleanText(rawProdi)) ||
      prodiFakultasMap.get(cleanText(prodiName)) ||
      prodiFakultasMap.get(rawProdi.trim().toLowerCase()) ||
      prodiFakultasMap.get(prodiName.trim().toLowerCase()) ||
      fallback ||
      '',
  );
}

/**
 * Ambil halaman sebuah endpoint SEVIMA secara berurutan dengan window kecil.
 * Halaman ke-N+1 diminta sebelum halaman ke-N ditulis ke DB, sehingga waktu jaring
 * dan waktu tulis saling menimpa (bukan berantai).
 */
async function paginateSevimaPages({ endpoint, startPage = 1, onPage }) {
  const inflight = new Map();
  const swallowRemaining = () => {
    for (const promise of inflight.values()) promise.catch(() => {});
    inflight.clear();
  };
  const fetchPage = (page) => sevimaApi.get(`${endpoint}?page=${page}`).then((r) => r.data);

  let lastPage = Number.POSITIVE_INFINITY;
  let nextPage = startPage;
  let pagesProcessed = 0;

  while (inflight.size < SYNC_FETCH_WINDOW && nextPage <= lastPage) {
    inflight.set(nextPage, fetchPage(nextPage));
    nextPage += 1;
  }

  try {
    while (inflight.size > 0) {
      const page = Math.min(...inflight.keys());
      const payload = await inflight.get(page);
      inflight.delete(page);

      const numericLastPage = Number(payload?.meta?.last_page);
      if (Number.isFinite(numericLastPage) && numericLastPage > 0) lastPage = numericLastPage;

      const listData = payload?.data;
      if (!listData || listData.length === 0) break;

      await onPage(listData, {
        page,
        totalPages: Number.isFinite(lastPage) ? lastPage : 0,
        meta: payload?.meta,
      });
      pagesProcessed += 1;

      if (nextPage <= lastPage) {
        inflight.set(nextPage, fetchPage(nextPage));
        nextPage += 1;
      }
      if (inflight.size > 0 && SYNC_PAGE_DELAY_MS > 0) await sleep(SYNC_PAGE_DELAY_MS);
    }
  } catch (error) {
    swallowRemaining();
    throw error;
  }

  swallowRemaining();
  return { pagesProcessed };
}

module.exports = {
  resolveTargetNimBatch,
  getProdiFakultasMap,
  resolveFakultas,
  paginateSevimaPages,
};
