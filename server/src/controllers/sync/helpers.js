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

const PRODI_RENAME_MAP = {
    'biomanajemen': 'Magister Bio Manajemen',
    'magister biomanajemen': 'Magister Bio Manajemen',
    'magister bio manajemen': 'Magister Bio Manajemen',
    'apoteker': 'Pendidikan Profesi Apoteker',
    'pendidikan profesi apoteker': 'Pendidikan Profesi Apoteker'
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
 * Helper untuk menghitung kode periode (YYYY1 / YYYY2) dari tanggal transfer (misal "2024-09-02").
 * Aturan:
 * - September (bulan 9) hingga Maret (bulan 3): Ganjil (YYYY1). Note: Sep-Des tahun Y, Jan-Mar tahun Y+1?
 *   Khususnya: Sep–Des Y -> Y1. Jan–Mar Y -> (Y-1)1.
 * - Maret (bulan 3) ke September (bulan 9): Genap (YYYY2). Maret–Agustus Y -> (Y-1)2.
 *
 * Penjelasan Tahun Akademik berdasarkan Tanggal Transfer:
 * - September Y s.d. Maret Y+1 -> Semester Ganjil Tahun Akademik Y (YYYY1).
 *   - Jika bulan Sep-Des Y: YYYY1 (misal 2024-09-02 -> 20241)
 *   - Jika bulan Jan-Mar Y: (Y-1)1 (misal 2025-01-15 -> 20241)
 * - Maret Y s.d. September Y -> Semester Genap Tahun Akademik Y-1 (YYYY2).
 *   - Jika bulan Mar-Agu Y: (Y-1)2 (misal 2024-04-10 -> 20232)
 */
function getPeriodeFromTanggalTransfer(tanggalTransferStr) {
    if (!tanggalTransferStr) return '';
    const date = new Date(tanggalTransferStr);
    if (isNaN(date.getTime())) return '';

    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 1-12

    // September (9) s.d. Desember (12) -> year + "1"
    if (month >= 9 && month <= 12) {
        return `${year}1`;
    }
    // Januari (1) s.d. Maret (3) -> (year - 1) + "1"
    if (month >= 1 && month <= 3) {
        return `${year - 1}1`;
    }
    // April (4) s.d. Agustus (8) -> (year - 1) + "2"
    if (month >= 4 && month <= 8) {
        return `${year - 1}2`;
    }
    return '';
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
        const termMasuk  = parseInt(startPeriode.substring(4, 5)) || 1;

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
                const rawProdi = extraData.programStudi || extraData.prodiName || '';
                const prodi = sanitizeProdiName(rawProdi);
                const jenjang = extraData.jenjang || extraData.id_jenjang_program_studi || 'S1';
                const statusKeaktifan = extraData.defaultStatusKeaktifan || 'Aktif';
                const fakultas = extraData.fakultas
                    || prodiFakultasMap.get(cleanText(rawProdi))
                    || prodiFakultasMap.get(cleanText(prodi))
                    || '';
                const semester = extraData.defaultSemester
                    || (statusKeaktifan === 'Lulus' ? hitungSemester(idPeriode, idPeriode) : 1);

                studentsToCreate.push({
                    nim: targetNim,
                    nama: extractNamaFn(item) || '',
                    jenjang,
                    periodeMasuk: idPeriode,
                    periodeTerakhir: statusKeaktifan === 'Lulus' ? idPeriode : '',
                    angkatan: formatAngkatan(idPeriode),
                    periode: extractPeriode(idPeriode),
                    programStudi: prodi,
                    fakultas,
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
        const batchResults = await Promise.all(batch.map(item => asyncFn(item)));
        results.push(...batchResults);
    }
    return results;
}

module.exports = {
    sleep,
    cleanText,
    sanitizeText,
    sanitizeProdiName,
    getPeriodeFromTanggalTransfer,
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
