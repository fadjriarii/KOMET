const sevimaApi = require('../../config/sevimaApi');
const prisma = require('../../config/prisma');
const logger = require('../../utils/logger');
const syncJobTracker = require('../../utils/syncJobTracker');
const { deduplicateStudents } = require('../../services/studentDeduplicationService');
const {
    sleep,
    cleanText,
    formatAngkatan,
    hitungSemester,
    getProdiFakultasMap,
    processInBatches
} = require('./helpers');

// 1. ETL Sinkronisasi Mahasiswa
const executeSyncStudents = async (startPage = 1) => {
    logger.info('🔄 Memulai proses ETL: Mahasiswa dari SEVIMA API (Seluruh data disinkronkan)...');
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
            const prodiName = attr.program_studi || '';

            const periodeMasuk = attr.id_periode || '';
            const periodeTerakhir = attr.id_periode_terakhir || periodeMasuk;
            const angkatan = formatAngkatan(periodeMasuk);
            const kewarganegaraan = (attr.nama_negara && attr.nama_negara.toLowerCase() === 'indonesia') ? 'WNI' : 'WNA';
            const semesterAktif = hitungSemester(periodeMasuk, periodeTerakhir);
            const fakultas = prodiFakultasMap.get(cleanText(prodiName)) || prodiFakultasMap.get(prodiName.trim().toLowerCase()) || '';

            validItems.push({
                nim: attr.nim,
                nama: attr.nama || '',
                jenjang: attr.id_jenjang || '',
                periodeMasuk,
                angkatan,
                programStudi: prodiName,
                fakultas,
                statusKeaktifan: attr.status_mahasiswa || '',
                semester: semesterAktif,
                kewarganegaraan
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

    syncJobTracker.updateProgress('students', { status: 'completed', synced: totalSynced, skipped: totalSkipped });
    logger.success(`[Mahasiswa] Selesai! ${totalSynced} data disinkronkan, ${deduplicationResult.deletedStudentsCount || 0} duplikat dibersihkan.`);
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
                message: `Sinkronisasi sukses! Total ${result.totalSynced} data mahasiswa disinkronkan (${result.deduplication?.deletedStudentsCount || 0} duplikat mahasiswa dan ${result.deduplication?.deletedMbkmCount || 0} duplikat MBKM dibersihkan).`,
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
