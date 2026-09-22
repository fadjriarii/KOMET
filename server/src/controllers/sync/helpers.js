const prisma = require('../../config/prisma');
const sevimaApi = require('../../config/sevimaApi');
const logger = require('../../utils/logger');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper untuk membersihkan teks dan mencocokkan HTML entities
function cleanText(str) {
    if (!str) return '';
    return str.replace(/&amp;/g, '&').trim().toLowerCase();
}

// Helper untuk memformat Angkatan sesuai mapping.xlsx:
// "Ekstrak 4 digit pertama (contoh: "20261" -> "2026") dan digit belakang sebagai pendanda Genap/Ganjil (1 = Genap & 2 = Ganjil)"
function formatAngkatan(idPeriode) {
    if (!idPeriode || idPeriode.length < 4) return '';
    const tahun = idPeriode.substring(0, 4);
    const digitTerm = idPeriode.substring(4, 5);
    let termText = '';
    if (digitTerm === '1') {
        termText = 'Genap';
    } else if (digitTerm === '2') {
        termText = 'Ganjil';
    }
    return termText ? `${tahun} ${termText}` : tahun;
}

// Helper Kalkulasi Semester Akademik
function hitungSemester(periodeMasuk, periodeTerakhir) {
    if (!periodeMasuk) return 1;
    if (!periodeTerakhir) periodeTerakhir = periodeMasuk;

    try {
        const tahunMasuk = parseInt(periodeMasuk.substring(0, 4));
        const termMasuk = parseInt(periodeMasuk.substring(4, 5)) || 1;

        const tahunAkhir = parseInt(periodeTerakhir.substring(0, 4));
        const termAkhir = parseInt(periodeTerakhir.substring(4, 5)) || termMasuk;

        const selisihTahun = tahunAkhir - tahunMasuk;
        const selisihTerm = termAkhir - termMasuk;

        const totalSemester = (selisihTahun * 2) + selisihTerm + 1;
        return totalSemester > 0 ? totalSemester : 1;
    } catch (e) {
        return 1;
    }
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
                    programStudi: prodi,
                    fakultas: extraData.fakultas || '',
                    statusKeaktifan,
                    semester,
                    kewarganegaraan: 'WNI'
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
    formatAngkatan,
    hitungSemester,
    resolveTargetNimBatch,
    getProdiFakultasMap,
    processInBatches
};

