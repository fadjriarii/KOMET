const { Prisma } = require('@prisma/client');
const prisma = require('../../config/prisma');
const sevimaApi = require('../../config/sevimaApi');
const logger = require('../../utils/logger');
const { STUDENT_STATUS } = require('@komet/shared/constants');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function envInt(name, fallback) {
  const parsed = Number.parseInt(process.env[name], 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

// Berapa halaman SEVIMA yang boleh ada di jaringan sekaligus. Window ini yang
// membuat latensi ambil halaman berikutnya tumpang tindih dengan tulis DB halaman sekarang.
const SYNC_FETCH_WINDOW = Math.max(1, envInt('SEVIMA_FETCH_WINDOW', 3));
const SYNC_PAGE_DELAY_MS = envInt('SEVIMA_PAGE_DELAY_MS', 150);
const DB_CHUNK_SIZE = Math.max(1, envInt('SEVIMA_DB_CHUNK_SIZE', 200));

function chunkBy(items, size = DB_CHUNK_SIZE) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

const toStr = (value) => String(value ?? '');
const toNum = (value) => Number(value) || 0;
const sqlIdent = (name) => Prisma.raw(`\`${String(name).replace(/[^A-Za-z0-9_]/g, '')}\``);

// Helper untuk membersihkan teks dan mencocokkan HTML entities
function cleanText(str) {
  if (!str) return '';
  return str.replace(/&amp;/g, '&').trim().toLowerCase();
}

function sanitizeText(str) {
  if (!str) return '';
  return str.replace(/&amp;/g, '&').trim();
}

/**
 * Placeholder "tidak diisi" dari SEVIMA (`-`, `–`) ditulis apa adanya ke kolom
 * teks bebas, sehingga read-path dulu harus mengenal dua cara menuliskan kosong.
 * Sekarang dinormalisasi sekali di jalur tulis: kosong selalu `''`.
 */
function normalizeOptionalText(value) {
  const text = sanitizeText(value);
  return text === '-' || text === '–' ? '' : text;
}

const PRODI_RENAME_MAP = {
  biomanajemen: 'Magister Bio Manajemen',
  'magister biomanajemen': 'Magister Bio Manajemen',
  'magister bio manajemen': 'Magister Bio Manajemen',
  apoteker: 'Pendidikan Profesi Apoteker',
  'pendidikan profesi apoteker': 'Pendidikan Profesi Apoteker',
};

/**
 * Helper untuk menormalisasi nama Program Studi dari Sevima API.
 * Menghapus label seperti "(Akun Lama)" atau "(keterangan akun lama)"
 * dan memetakan nama lama ke nama program studi resmi terbaru (misal Biomanajemen -> Magister Bio Manajemen).
 */
function sanitizeProdiName(str) {
  if (!str) return '';
  const cleaned = str
    .replace(/&amp;/g, '&')
    .replace(/\s*\((?:keterangan\s+)?akun\s+lama\)/gi, '')
    .trim();

  const lowerKey = cleaned.toLowerCase();
  if (PRODI_RENAME_MAP[lowerKey]) {
    return PRODI_RENAME_MAP[lowerKey];
  }
  return cleaned;
}

/**
 * Kode periode akademik (YYYY1 / YYYY2) dari tanggal transfer, mis. "2024-09-02".
 *
 * Satu aturan untuk seluruh aplikasi — sama dengan getCurrentAcademicPeriode():
 * - Ganjil: September tahun Y s.d. Februari tahun Y+1 -> kode tahun Y.
 *   2024-09-02 -> 20241, 2025-02-10 -> 20241
 * - Genap: Maret s.d. Agustus tahun Y -> kode tahun Y-1.
 *   2025-03-01 -> 20242, 2024-04-10 -> 20232
 * Tanggal kosong/invalid menghasilkan '' supaya caller memakai fallback id_periode.
 */
function getPeriodeFromTanggalTransfer(tanggalTransferStr) {
  if (!tanggalTransferStr) return '';
  const date = new Date(tanggalTransferStr);
  return Number.isNaN(date.getTime()) ? '' : getCurrentAcademicPeriode(date);
}

/**
 * Helper untuk memformat Angkatan dari kode periode Sevima.
 * Ambil 4 digit pertama sebagai tahun saja (misal: "20261" -> "2026", "20262" -> "2026").
 */
function formatAngkatan(idPeriode) {
  if (!idPeriode || idPeriode.length < 4) return '';
  return idPeriode.substring(0, 4);
}

function normalizeAcademicPeriod(value, defaultTerm = '1') {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  const compact = raw.replace(/[/\-\s]+/g, '');
  if (/^\d{5}$/.test(compact) && ['1', '2'].includes(compact[4])) return compact;
  if (/^\d{4}$/.test(compact)) return `${compact}${defaultTerm}`;
  const match = raw.match(/^(\d{4}).*?([12])$/);
  return match ? `${match[1]}${match[2]}` : raw;
}

/**
 * Ekstrak field "Periode" dari kode periode Sevima.
 * Digit ke-5: 1 → "Ganjil", 2 → "Genap".
 * @param {string} idPeriode contoh "20251" atau "20252"
 * @returns {"Ganjil"|"Genap"|""}
 */
function extractPeriode(idPeriode) {
  if (!idPeriode || idPeriode.length < 5) return '';
  const digitTerm = idPeriode.substring(4, 5);
  if (digitTerm === '1') return 'Ganjil';
  if (digitTerm === '2') return 'Genap';
  return '';
}

/**
 * Mengembalikan kode periode akademik berjalan saat ini.
 * Aturan:
 * - September (bulan 9) hingga Februari (bulan 2): Ganjil (YYYY1).
 *   - Sep-Des tahun Y -> YYYY1 (misal Okt 2026 -> 20261)
 *   - Jan-Feb tahun Y -> (YYYY-1)1 (misal Jan 2027 -> 20261)
 * - Maret (bulan 3) hingga Agustus (bulan 8): Genap (YYYY2).
 *   - Mar-Agu tahun Y -> (YYYY-1)2 (misal Mar 2027 -> 20262)
 * @returns {string} kode periode 5 digit (contoh "20261" atau "20262")
 */
function getCurrentAcademicPeriode(date = new Date()) {
  const d = new Date(date);
  const bulan = d.getMonth() + 1; // 1–12
  const tahun = d.getFullYear();

  if (bulan >= 9 && bulan <= 12) {
    return `${tahun}1`;
  }
  if (bulan >= 1 && bulan <= 2) {
    return `${tahun - 1}1`;
  }
  // Bulan 3 (Maret) s.d. 8 (Agustus)
  return `${tahun - 1}2`;
}

/**
 * Menghitung semester mahasiswa berdasarkan periode masuk dan periode referensi.
 *
 * - Mahasiswa Aktif / tanpa periodeTerakhir: gunakan periode akademik berjalan saat ini.
 * - Mahasiswa Lulus/Keluar: gunakan periodeTerakhir (periode saat mereka lulus/keluar).
 *
 * Rumus: ((tahunAkhir - tahunMasuk) × 2) + (termAkhir - termMasuk) + 1
 *
 * @param {string} periodeMasuk       kode periode masuk (contoh "20221")
 * @param {string} periodeTerakhir    kode periode akhir; jika kosong/sama = pakai periode berjalan
 * @param {string} periodeMasukAwal   kode periode masuk awal jika mahasiswa transfer
 * @returns {number} semester (minimal 1)
 */
function hitungSemester(periodeMasuk, periodeTerakhir, periodeMasukAwal = null) {
  const startPeriode = periodeMasukAwal || periodeMasuk;
  if (!startPeriode) return 1;

  try {
    const tahunMasuk = parseInt(startPeriode.substring(0, 4));
    const termMasuk = parseInt(startPeriode.substring(4, 5)) || 1;

    if (isNaN(tahunMasuk)) return 1;

    // Tentukan periode referensi untuk kalkulasi
    const refPeriode =
      periodeTerakhir && periodeTerakhir.length >= 5
        ? periodeTerakhir
        : getCurrentAcademicPeriode();

    const tahunAkhir = parseInt(refPeriode.substring(0, 4));
    const termAkhir = parseInt(refPeriode.substring(4, 5)) || 1;

    if (isNaN(tahunAkhir)) return 1;

    const totalSemester = (tahunAkhir - tahunMasuk) * 2 + (termAkhir - termMasuk) + 1;
    return totalSemester > 0 ? totalSemester : 1;
  } catch {
    return 1;
  }
}

/**
 * Menentukan apakah status mahasiswa termasuk "sudah keluar" (lulus/DO/putus studi/dll.)
 * berdasarkan id_status_mahasiswa dari Sevima.
 * @param {string} idStatus kode status dari Sevima (misal "L"=Lulus, "D"=DO)
 * @returns {boolean}
 */
function isStatusKeluar(idStatus) {
  if (!idStatus) return false;
  // "L"=Lulus, "D"=Drop Out, "K"=Keluar, "M"=Meninggal, "P"=Pindah, "T"=Tidak Lanjut
  const statusKeluar = ['L', 'D', 'K', 'M', 'P', 'T'];
  return statusKeluar.includes(idStatus.toUpperCase());
}

/**
 * Memeriksa apakah nama Program Studi atau Fakultas mengandung teks "akun lama".
 * @param {string} text  nama program studi atau fakultas
 * @returns {boolean} true jika mengandung tanda "akun lama"
 */
function isAkunLama(text) {
  if (!text) return false;
  return /keterangan akun lama|akun lama/i.test(text);
}

/**
 * Mapping kewarganegaraan: konversi kode negara / nama bahasa Inggris dari Sevima
 * ke nama negara spesifik dalam Bahasa Indonesia.
 *
 * Strategi:
 *   1. Gunakan nama_negara dari Sevima jika tersedia dan bukan kosong.
 *   2. Fallback ke lookup tabel ISO-3 → nama Bahasa Indonesia.
 *   3. Default: "Indonesia".
 *
 * @param {string} idNegara   kode ISO-3 negara (misal "IDN", "USA", "MYS")
 * @param {string} namaNegara nama negara dari Sevima (misal "Indonesia", "Malaysia")
 * @returns {string} Nama negara spesifik dalam Bahasa Indonesia
 */
function mapKewarganegaraan(idNegara, namaNegara) {
  // Gunakan nama langsung dari Sevima jika valid
  if (namaNegara && namaNegara.trim() !== '') {
    return namaNegara.trim();
  }

  // Fallback: lookup berdasarkan kode ISO-3
  if (idNegara) {
    const kode = idNegara.toUpperCase().trim();
    const iso3Map = {
      IDN: 'Indonesia',
      USA: 'Amerika Serikat',
      MYS: 'Malaysia',
      SGP: 'Singapura',
      AUS: 'Australia',
      GBR: 'Inggris',
      DEU: 'Jerman',
      FRA: 'Prancis',
      JPN: 'Jepang',
      KOR: 'Korea Selatan',
      CHN: 'Tiongkok',
      IND: 'India',
      THA: 'Thailand',
      PHL: 'Filipina',
      VNM: 'Vietnam',
      NLD: 'Belanda',
      CAN: 'Kanada',
      NZL: 'Selandia Baru',
      SAU: 'Arab Saudi',
      ARE: 'Uni Emirat Arab',
      PAK: 'Pakistan',
      BGD: 'Bangladesh',
      NPL: 'Nepal',
      LKA: 'Sri Lanka',
      MMR: 'Myanmar',
      KHM: 'Kamboja',
      LAO: 'Laos',
      BRN: 'Brunei Darussalam',
      TLS: 'Timor-Leste',
    };
    if (iso3Map[kode]) return iso3Map[kode];
  }

  // Default: Indonesia
  return 'Indonesia';
}

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

// Helper untuk menjalankan batch database operasi secara paralel dalam kelompok kecil (misal 25 per batch)
async function processInBatches(items, batchSize = 25, asyncFn) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((item) => asyncFn(item)));
    results.push(...batchResults);
  }
  return results;
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

const STUDENT_COLUMNS = [
  'nim',
  'nama',
  'jenjang',
  'periodeMasuk',
  'periodeTerakhir',
  'angkatan',
  'periode',
  'programStudi',
  'fakultas',
  'statusKeaktifan',
  'semester',
  'kewarganegaraan',
  'nik',
  'tanggalLahir',
];

/**
 * Tulis satu halaman mahasiswa dengan satu statement per chunk.
 * upsert() per baris membuat 1 roundtrip per mahasiswa; ON DUPLICATE KEY UPDATE
 * menurunkan seluruh halaman menjadi beberapa statement saja.
 */
async function bulkUpsertStudents(rows) {
  if (!rows || rows.length === 0) return 0;
  const columnList = Prisma.join([...STUDENT_COLUMNS.map(sqlIdent), sqlIdent('updatedAt')], ', ');
  const updateList = Prisma.join(
    [
      ...STUDENT_COLUMNS.filter((column) => column !== 'nim').map((column) =>
        Prisma.raw(`${sqlIdent(column)} = VALUES(${sqlIdent(column)})`),
      ),
      Prisma.raw(`${sqlIdent('updatedAt')} = CURRENT_TIMESTAMP(3)`),
    ],
    ', ',
  );

  for (const chunk of chunkBy(rows)) {
    const values = Prisma.join(
      chunk.map(
        (row) => Prisma.sql`(
        ${toStr(row.nim)}, ${toStr(row.nama)}, ${toStr(row.jenjang)}, ${toStr(row.periodeMasuk)},
        ${toStr(row.periodeTerakhir)}, ${toStr(row.angkatan)}, ${toStr(row.periode)},
        ${toStr(row.programStudi)}, ${toStr(row.fakultas)}, ${toStr(row.statusKeaktifan)},
        ${toNum(row.semester)}, ${toStr(row.kewarganegaraan)}, ${toStr(row.nik)},
        ${toStr(row.tanggalLahir)}, CURRENT_TIMESTAMP(3)
      )`,
      ),
      ', ',
    );
    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO ${sqlIdent('students')} (${columnList})
      VALUES ${values}
      ON DUPLICATE KEY UPDATE ${updateList}
    `);
  }
  return rows.length;
}

const GRADUATE_COLUMNS = [
  'nim',
  'jenjang',
  'statusKelulusan',
  'tahunLulus',
  'periodeWisuda',
  'ipk',
  'sksLulus',
];

/**
 * Tulis kelulusan secara massal, lalu tandai mahasiswa terkait sebagai Lulus.
 * periodeTerakhir dikelompokkan per nilainya agar satu UPDATE menutupi banyak NIM.
 */
async function bulkUpsertGraduates(rows) {
  if (!rows || rows.length === 0) return 0;
  const columnList = Prisma.join(GRADUATE_COLUMNS.map(sqlIdent), ', ');
  const updateList = Prisma.join(
    GRADUATE_COLUMNS.filter((column) => column !== 'nim').map((column) =>
      Prisma.raw(`${sqlIdent(column)} = VALUES(${sqlIdent(column)})`),
    ),
    ', ',
  );

  for (const chunk of chunkBy(rows)) {
    const values = Prisma.join(
      chunk.map(
        (row) => Prisma.sql`(
          ${toStr(row.nim)}, ${toStr(row.jenjang)}, ${toStr(row.statusKelulusan)},
          ${toStr(row.tahunLulus)}, ${toStr(row.periodeWisuda)}, ${toNum(row.ipk)},
          ${toNum(row.sksLulus)}
        )`,
      ),
      ', ',
    );
    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO ${sqlIdent('graduates')} (${columnList})
      VALUES ${values}
      ON DUPLICATE KEY UPDATE ${updateList}
    `);

    const nims = chunk.map((row) => toStr(row.nim));
    await prisma.$executeRaw(Prisma.sql`
      UPDATE ${sqlIdent('students')}
      SET ${sqlIdent('statusKeaktifan')} = ${STUDENT_STATUS.LULUS}
      WHERE ${sqlIdent('nim')} IN (${Prisma.join(nims)})
    `);

    const nimsByPeriode = new Map();
    chunk.forEach((row, index) => {
      const periode = toStr(row.periodeTerakhir);
      if (!periode) return;
      if (!nimsByPeriode.has(periode)) nimsByPeriode.set(periode, []);
      nimsByPeriode.get(periode).push(nims[index]);
    });
    for (const [periode, subset] of nimsByPeriode) {
      await prisma.$executeRaw(Prisma.sql`
        UPDATE ${sqlIdent('students')}
        SET ${sqlIdent('periodeTerakhir')} = ${periode}
        WHERE ${sqlIdent('nim')} IN (${Prisma.join(subset)})
      `);
    }
  }
  return rows.length;
}

/**
 * MBKM selalu di-truncate sebelum sinkronisasi, jadi cukup satu createMany per chunk
 * tanpa upsert per baris.
 */
async function bulkCreateMbkmActivities(rows) {
  if (!rows || rows.length === 0) return 0;
  for (const chunk of chunkBy(rows)) {
    await prisma.mbkmActivity.createMany({
      data: chunk.map((row) => ({
        nim: toStr(row.nim),
        periode: toStr(row.periode),
        programStudi: toStr(row.programStudi),
        fakultas: toStr(row.fakultas),
        jenjang: toStr(row.jenjang),
        statusKeaktifan: toStr(row.statusKeaktifan),
        jenisAktivitas: toStr(row.jenisAktivitas),
        judulAktivitas: toStr(row.judulAktivitas),
        mitra: toStr(row.mitra),
        statusAktivitas: toStr(row.statusAktivitas),
      })),
    });
  }
  return rows.length;
}

/**
 * Invalidate cache opsi filter ketiga tab. Setelah sync, isi kolom (prodi, fakultas,
 * angkatan, periode) bisa berubah, jadi cache wajib dibaca ulang — bukan cuma milik
 * modul yang disinkronkan.
 */
function clearFilterCaches() {
  require('../../services/students/filterOptions').clearFilterCache();
  require('../../services/graduates/filterOptions').clearGraduateFilterCache();
  require('../../services/mbkm/filterOptions').clearMbkmFilterCache();
}

module.exports = {
  sleep,
  cleanText,
  sanitizeText,
  normalizeOptionalText,
  sanitizeProdiName,
  getPeriodeFromTanggalTransfer,
  formatAngkatan,
  normalizeAcademicPeriod,
  extractPeriode,
  hitungSemester,
  getCurrentAcademicPeriode,
  isStatusKeluar,
  isAkunLama,
  mapKewarganegaraan,
  resolveTargetNimBatch,
  getProdiFakultasMap,
  processInBatches,
  chunkBy,
  paginateSevimaPages,
  bulkUpsertStudents,
  bulkUpsertGraduates,
  bulkCreateMbkmActivities,
  clearFilterCaches,
  SYNC_FETCH_WINDOW,
  SYNC_PAGE_DELAY_MS,
};
