const prisma = require('../../config/prisma');
const sevimaApi = require('../../config/sevimaApi');
const logger = require('../../utils/logger');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
 * Helper untuk memformat Angkatan dari kode periode Sevima.
 * Ambil 4 digit pertama sebagai tahun saja (misal: "20261" -> "2026", "20262" -> "2026").
 */
function formatAngkatan(idPeriode) {
    if (!idPeriode || idPeriode.length < 4) return '';
    return idPeriode.substring(0, 4);
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
 * Semester Ganjil (term 1): Agustus–Januari → digit ke-5 = "1"
 * Semester Genap  (term 2): Februari–Juli   → digit ke-5 = "2"
 * @returns {string} kode periode 5 digit (contoh "20261" atau "20252")
 */
function getCurrentAcademicPeriode() {
    const now = new Date();
    const bulan = now.getMonth() + 1; // 1–12
    const tahun = now.getFullYear();
    // Ganjil = semester yang dimulai Agustus tahun ini
    // Genap  = semester yang dimulai Februari tahun ini
    const term = bulan >= 8 ? 1 : 2;
    return `${tahun}${term}`;
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
 * @returns {number} semester (minimal 1)
 */
function hitungSemester(periodeMasuk, periodeTerakhir) {
    if (!periodeMasuk) return 1;

    try {
        const tahunMasuk = parseInt(periodeMasuk.substring(0, 4));
        const termMasuk  = parseInt(periodeMasuk.substring(4, 5)) || 1;

        if (isNaN(tahunMasuk)) return 1;

        // Tentukan periode referensi untuk kalkulasi
        const refPeriode = (periodeTerakhir && periodeTerakhir.length >= 5)
            ? periodeTerakhir
            : getCurrentAcademicPeriode();

        const tahunAkhir = parseInt(refPeriode.substring(0, 4));
        const termAkhir  = parseInt(refPeriode.substring(4, 5)) || 1;

        if (isNaN(tahunAkhir)) return 1;

        const totalSemester = ((tahunAkhir - tahunMasuk) * 2) + (termAkhir - termMasuk) + 1;
        return totalSemester > 0 ? totalSemester : 1;
    } catch (e) {
        return 1;
    }
}

/**
 * Menentukan apakah status mahasiswa termasuk "sudah keluar" (lulus/DO/putus studi/dll.)
 * berdasarkan id_status_mahasiswa dari Sevima.
 * @param {string} idStatus kode status dari Sevima (misal "A"=Aktif, "L"=Lulus, "D"=DO)
 * @returns {boolean}
 */
function isStatusKeluar(idStatus) {
    if (!idStatus) return false;
    // "L"=Lulus, "D"=Drop Out, "K"=Keluar, "M"=Meninggal, "P"=Pindah, "T"=Tidak Lanjut
    const statusKeluar = ['L', 'D', 'K', 'M', 'P', 'T'];
    return statusKeluar.includes(idStatus.toUpperCase());
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

/**
 * Memeriksa apakah nama Program Studi atau Fakultas mengandung teks
 * yang menandakan "akun lama" (data legacy yang harus dibuang).
 * @param {string} text  nama program studi atau fakultas
 * @returns {boolean} true jika mengandung tanda "akun lama"
 */
function isAkunLama(text) {
    if (!text) return false;
    return /keterangan akun lama|akun lama/i.test(text);
}

// Helper Resolver NIM Bulk (Pre-fetch In-Memory Map) untuk Batch Sync tanpa N+1 Query
async function resolveTargetNimBatch(items, extractNimFn, extractNamaFn, extraDataFn = () => ({})) {
    if (!items || items.length === 0) return new Map();

    const nimsToLookup = new Set();
    items.forEach(item => {
        const rawNim = extractNimFn(item);
        if (rawNim) {
            nimsToLookup.add(rawNim);
            const cleanNim = rawNim.replace(/x/gi, '');
            if (cleanNim) nimsToLookup.add(cleanNim);
        }
    });

    const existingStudents = await prisma.student.findMany({
        where: { nim: { in: Array.from(nimsToLookup) } },
        select: { nim: true }
    });

    const existingNimSet = new Set(existingStudents.map(s => s.nim));
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
                const prodi = extraData.programStudi || extraData.prodiName || '';
                const jenjang = extraData.jenjang || extraData.id_jenjang_program_studi || '';
                const statusKeaktifan = extraData.defaultStatusKeaktifan || 'Aktif';
                const semester = extraData.defaultSemester || 1;

                studentsToCreate.push({
                    nim: targetNim,
                    nama: extractNamaFn(item) || '',
                    jenjang,
                    periodeMasuk: idPeriode,
                    angkatan: formatAngkatan(idPeriode),
                    periode: extractPeriode(idPeriode),
                    programStudi: prodi,
                    fakultas: extraData.fakultas || '',
                    statusKeaktifan,
                    semester,
                    kewarganegaraan: 'Indonesia'
                });
            }
        }
    }

    if (studentsToCreate.length > 0) {
        await prisma.student.createMany({
            data: studentsToCreate,
            skipDuplicates: true
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
    if (!forceRefresh && prodiCache && (now - prodiCacheTime < CACHE_TTL_MS)) {
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

            map.set(cleanText(rawName), namaFakultas);
            map.set(rawName.trim().toLowerCase(), namaFakultas);
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
        const batchResults = await Promise.all(batch.map(item => asyncFn(item)));
        results.push(...batchResults);
    }
    return results;
}

module.exports = {
    sleep,
    cleanText,
    sanitizeText,
    formatAngkatan,
    extractPeriode,
    hitungSemester,
    getCurrentAcademicPeriode,
    isStatusKeluar,
    isAkunLama,
    mapKewarganegaraan,
    resolveTargetNimBatch,
    getProdiFakultasMap,
    processInBatches
};
