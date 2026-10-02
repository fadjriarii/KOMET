const sevimaApi = require('../../config/sevimaApi');
const prisma = require('../../config/prisma');
const logger = require('../../utils/logger');
const syncJobTracker = require('../../utils/syncJobTracker');
const { deduplicateStudents } = require('../../services/studentDeduplicationService');
const {
    sleep,
    cleanText,
    sanitizeText,
    sanitizeProdiName,
    getPeriodeFromTanggalTransfer,
    formatAngkatan,
    normalizeAcademicPeriod,
    extractPeriode,
    hitungSemester,
    isStatusKeluar,
    mapKewarganegaraan,
    getProdiFakultasMap,
    processInBatches
} = require('./helpers');

// 1. ETL Sinkronisasi Mahasiswa dengan Data Cleansing & Transformation
const executeSyncStudents = async (startPage = 1) => {
    logger.info('🔄 Memulai proses ETL: Mahasiswa dari SEVIMA API (dengan Data Cleansing & Transformation)...');
    const prodiFakultasMap = await getProdiFakultasMap();

    let currentPage = startPage;
    let totalSynced = 0;
    let totalSkipped = 0;
    let hasMorePages = true;

    syncJobTracker.updateProgress('students', { status: 'running', page: currentPage });

    while (hasMorePages) {
        logger.info(`📥 [Mahasiswa] Mengambil halaman ke-${currentPage}...`);
        const response = await sevimaApi.get(`/siakadcloud/v1/mahasiswa?page=${currentPage}`);
        const responseData = response.data;
        const listData = responseData.data;
        const meta = responseData.meta;

        if (!listData || listData.length === 0) {
            break;
        }

        const validItems = [];
        for (const item of listData) {
            const attr = item.attributes;

            // ─── RULE 1: Filter NIM — buang record yang NIM-nya kosong ───
            const nim = (attr.nim || '').trim();
            if (!nim) {
                totalSkipped++;
                continue;
            }

            // ─── RULE 2: Normalisasi Nama Program Studi & Lookup Fakultas ───
            const rawProdi = attr.program_studi || '';
            const prodiName = sanitizeProdiName(rawProdi);
            const namaFakultas = sanitizeText(
                prodiFakultasMap.get(cleanText(rawProdi))
                || prodiFakultasMap.get(cleanText(prodiName))
                || prodiFakultasMap.get(rawProdi.trim().toLowerCase())
                || prodiFakultasMap.get(prodiName.trim().toLowerCase())
                || attr.nama_fakultas
                || ''
            );

            // ─── RULE 3: Angkatan & Periode Masuk — Khusus S2 gunakan tanggal_transfer jika ada (atau fallback ke id_periode) ───
            const jenjang = (attr.id_jenjang || 'S1').trim().toUpperCase();
            const tanggalTransfer = (attr.tanggal_transfer || '').trim();
            const periodeFromTransfer = (jenjang === 'S2' && tanggalTransfer)
                ? getPeriodeFromTanggalTransfer(tanggalTransfer)
                : '';
            const periodeMasuk = normalizeAcademicPeriod(periodeFromTransfer || attr.id_periode);

            // ─── RULE 4: Periode — field baru "Ganjil"/"Genap" dari digit ke-5 periodeMasuk ───
            const periode = extractPeriode(periodeMasuk);

            // Angkatan = hanya 4 digit tahun masuk (contoh "2026")
            const angkatan = formatAngkatan(periodeMasuk);

            // ─── RULE 5: Status Keaktifan & Semester — kalkulasi dinamis berdasarkan status ───
            const idStatus = (attr.id_status_mahasiswa || '').trim();
            const statusName = (attr.status_mahasiswa || '').trim();
            const periodeTerakhir = normalizeAcademicPeriod(attr.id_periode_terakhir);
            const isKeluar = isStatusKeluar(idStatus) || /lulus|drop\s*out|keluar|putus\s*studi|meninggal/i.test(statusName);

            let statusKeaktifan = statusName;
            if (!statusKeaktifan) {
                if (idStatus === 'L') statusKeaktifan = 'Lulus';
                else if (idStatus === 'D') statusKeaktifan = 'Drop Out';
                else if (idStatus === 'C') statusKeaktifan = 'Cuti';
                else if (idStatus === 'K') statusKeaktifan = 'Keluar';
                else if (idStatus === 'A') statusKeaktifan = 'Aktif';
                else statusKeaktifan = isKeluar ? 'Lulus' : 'Aktif';
            }

            // Gunakan periode terakhir untuk mahasiswa keluar maupun aktif bila tersedia;
            // jika kosong, helper memakai periode akademik berjalan sebagai fallback.
            const semesterAktif = hitungSemester(periodeMasuk, periodeTerakhir || null);

            // ─── RULE 6: Kewarganegaraan — konversi ke nama negara spesifik ───
            const kewarganegaraan = mapKewarganegaraan(
                attr.id_negara || '',
                attr.nama_negara || ''
            );

            validItems.push({
                nim,
                nama: attr.nama || '',
                jenjang: attr.id_jenjang || 'S1',
                periodeMasuk,
                periodeTerakhir,
                angkatan,
                periode,
                programStudi: prodiName,
                fakultas: namaFakultas,
                statusKeaktifan,
                semester: semesterAktif,
                kewarganegaraan,
                nik: (attr.nik || '').trim(),
                tanggalLahir: (attr.tanggal_lahir || '').trim()
            });
        }

        // Parallel Batch Processing Database Upsert (25 per batch)
        if (validItems.length > 0) {
            await processInBatches(validItems, 25, async (student) => {
                return prisma.student.upsert({
                    where: { nim: student.nim },
                    update: student,
                    create: student
                });
            });
            totalSynced += validItems.length;
        }

        syncJobTracker.updateProgress('students', {
            page: currentPage,
            totalPages: meta?.last_page || currentPage,
            synced: totalSynced,
            skipped: totalSkipped
        });

        if (meta && currentPage >= meta.last_page) {
            hasMorePages = false;
        } else {
            currentPage++;
            await sleep(350);
        }
    }

    // Jalankan deduplikasi in-memory setelah seluruh data dari API masuk ke database
    const deduplicationResult = await deduplicateStudents();

    // Invalidate in-memory filter cache agar data filter baru langsung terbaca
    try {
        const { clearFilterCache } = require('../../services/students/filterOptions');
        clearFilterCache();
    } catch (e) {
        logger.warn('Gagal membersihkan cache filter options:', e.message);
    }

    syncJobTracker.updateProgress('students', { status: 'completed', synced: totalSynced, skipped: totalSkipped });
    logger.success(`[Mahasiswa] Selesai! ${totalSynced} data disinkronkan, ${totalSkipped} dilewati, ${deduplicationResult.deletedStudentsCount || 0} duplikat dibersihkan.`);
    return { totalSynced, totalSkipped, deduplication: deduplicationResult };
};

const syncStudents = async (req, res) => {
    const isAsync = req?.body?.async === true || req?.query?.async === 'true';
    const isInternal = req?.isInternal === true;

    if (!isInternal && syncJobTracker.isRunning()) {
        if (res) {
            return res.status(409).json({
                success: false,
                message: 'Proses sinkronisasi lain sedang berjalan. Tunggu hingga selesai.',
                statusUrl: '/api/sync/status'
            });
        }
        throw new Error('Proses sinkronisasi lain sedang berjalan.');
    }

    if (isAsync && res) {
        syncJobTracker.startJob('students');
        setImmediate(() => {
            executeSyncStudents()
                .then(() => {
                    try { syncJobTracker.finishJob(true); } catch (e) { logger.error('Gagal memanggil finishJob:', e); }
                })
                .catch((err) => {
                    logger.error('[AsyncJob:students] Error tidak tertangani:', err.message);
                    try { syncJobTracker.finishJob(false, err.message); } catch (_) {}
                });
        });

        return res.status(202).json({
            success: true,
            message: 'Sinkronisasi mahasiswa dimulai di background (Asynchronous Job).',
            statusUrl: '/api/sync/status'
        });
    }

    try {
        if (!isInternal) syncJobTracker.startJob('students');
        const result = await executeSyncStudents();
        if (!isInternal) syncJobTracker.finishJob(true);

        if (res) {
            return res.status(200).json({
                success: true,
                message: `Sinkronisasi sukses! Total ${result.totalSynced} data mahasiswa disinkronkan, ${result.totalSkipped} dilewati (${result.deduplication?.deletedStudentsCount || 0} duplikat dan ${result.deduplication?.deletedMbkmCount || 0} duplikat MBKM dibersihkan).`,
                data: result
            });
        }
        return result.totalSynced;
    } catch (error) {
        const errorMsg = error.response?.data || error.message;
        if (!isInternal) syncJobTracker.finishJob(false, errorMsg);
        logger.error('Gagal sinkronisasi mahasiswa:', errorMsg);

        if (res) {
            return res.status(500).json({
                success: false,
                message: typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg)
            });
        }
        throw error;
    }
};

module.exports = syncStudents;
