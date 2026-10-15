const sevimaApi = require('../../../config/sevimaApi');
const logger = require('../../../utils/logger');
const { cleanText, sanitizeText, sanitizeProdiName } = require('../text');

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

module.exports = { getProdiFakultasMap, resolveFakultas };
