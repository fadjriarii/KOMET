const sevimaApi = require('../../../config/sevimaApi');
const logger = require('../../../utils/logger');
const { cleanText, sanitizeText, sanitizeProdiName, normalizeProdiCode } = require('../text');

// In-Memory Cache untuk Program Studi & Fakultas (TTL: 1 jam). Dua indeks dari
// satu fetch: byName (kompatibilitas jalur lama) dan byCode (identitas stabil
// untuk resolve nama resmi + fakultas — rename tidak memecahnya).
let prodiCache = null;
let prodiCodeCache = null;
let prodiCacheTime = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 Jam

// Helper untuk fetch seluruh Program Studi & buat lookup Fakultas dengan In-Memory Caching
async function getProdiFakultasMap(forceRefresh = false) {
  const { byName } = await loadProdiMaps(forceRefresh);
  return byName;
}

/** Peta kode ternormalisasi → { nama, fakultas } dari payload `/program-studi` terkini. */
async function getProdiCodeMap(forceRefresh = false) {
  const { byCode } = await loadProdiMaps(forceRefresh);
  return byCode;
}

async function loadProdiMaps(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && prodiCache && now - prodiCacheTime < CACHE_TTL_MS) {
    logger.info('🧠 Membaca mapping Program Studi dari In-Memory Cache.');
    return { byName: prodiCache, byCode: prodiCodeCache };
  }

  try {
    logger.info('🌐 Mengambil data Program Studi dari SEVIMA API...');
    const response = await sevimaApi.get('/siakadcloud/v1/program-studi');
    const listData = response.data.data || [];
    const byName = new Map();
    const byCode = new Map();

    for (const item of listData) {
      const attr = item.attributes;
      const rawName = attr.nama_program_studi || '';
      const namaFakultas = attr.nama_fakultas || '';
      const cleanName = sanitizeProdiName(rawName);

      if (rawName) {
        byName.set(cleanText(rawName), namaFakultas);
        byName.set(rawName.trim().toLowerCase(), namaFakultas);
      }
      if (cleanName) {
        byName.set(cleanText(cleanName), namaFakultas);
        byName.set(cleanName.trim().toLowerCase(), namaFakultas);
      }

      const code = normalizeProdiCode(attr.kode_program_studi);
      if (code) {
        const hasX = /x/i.test(attr.kode_program_studi || '');
        // Entri berkode-X adalah label lama; nama resmi (tanpa X) selalu menang.
        // Nama dibersihkan seperti jalur fallback supaya ejaannya identik.
        const officialName = sanitizeProdiName(rawName);
        if (!byCode.has(code) || !hasX) {
          byCode.set(code, { nama: officialName, fakultas: namaFakultas });
        }
      }
    }

    prodiCache = byName;
    prodiCodeCache = byCode;
    prodiCacheTime = now;
    logger.success(`🧠 Berhasil memuat ${listData.length} data Program Studi ke In-Memory Cache.`);
    return { byName, byCode };
  } catch (error) {
    logger.error('⚠️ Gagal mengambil mapping program-studi:', error.message);
    return { byName: prodiCache || new Map(), byCode: prodiCodeCache || new Map() };
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

module.exports = { getProdiFakultasMap, getProdiCodeMap, resolveFakultas };
