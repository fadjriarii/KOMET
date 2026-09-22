const sevimaApi = require('../../config/sevimaApi');
const prisma = require('../../config/prisma');
const logger = require('../../utils/logger');
const syncJobTracker = require('../../utils/syncJobTracker');
const { deduplicateStudents } = require('../../services/studentDeduplicationService');
const {
    sleep,
    formatAngkatan,
    resolveTargetNimBatch,
    processInBatches
} = require('./helpers');

// 2. ETL Sinkronisasi Kelulusan (Graduate)
const executeSyncGraduates = async (startPage = 1) => {
    logger.info('🔄 Memulai proses ETL: Data Kelulusan dari SEVIMA API...');

    let currentPage = startPage;
    let totalSynced = 0;
    let totalSkipped = 0;
    let hasMorePages = true;

    syncJobTracker.updateProgress('graduates', { status: 'running', page: currentPage });

    while (hasMorePages) {
        logger.info(`📥 [Kelulusan] Mengambil halaman ke-${currentPage}...`);
        const response = await sevimaApi.get(`/siakadcloud/v1/kelulusan?page=${currentPage}`);
        const responseData = response.data;
        const listData = responseData.data;
        const meta = responseData.meta;

        if (!listData || listData.length === 0) {
            break;
        }

        const validItems = [];
        for (const item of listData) {
            const attr = item.attributes;
            if (!attr.nim) continue;

            const prodiName = attr.program_studi || '';

            // Ekstrak Tahun Lulus
            let tahunLulus = '';
            if (attr.id_periode_akademik && attr.id_periode_akademik.length >= 4) {
                tahunLulus = attr.id_periode_akademik.substring(0, 4);
            } else if (attr.tanggal_keluar) {
                tahunLulus = attr.tanggal_keluar.substring(0, 4);
            } else if (attr.tanggal_sk_yudisium) {
                tahunLulus = attr.tanggal_sk_yudisium.substring(0, 4);
            }

            const statusKelulusan = attr.nama_predikat || attr.nama_status_mahasiswa || 'Lulus';
            const ipk = parseFloat(attr.ipk_lulusan) || 0;
            const sksLulus = parseInt(attr.sks_total) || 0;

            validItems.push({
                nim: attr.nim,
                nama: attr.nama || '',
                jenjang: attr.id_jenjang || '',
                id_periode_akademik: attr.id_periode_akademik || '',
                programStudi: prodiName,
                statusKelulusan,
                tahunLulus,
                ipk,
                sksLulus
            });
        }

        // Bulk Pre-fetch NIM Resolution (Menghilangkan N+1 Query)
        if (validItems.length > 0) {
            const nimMap = await resolveTargetNimBatch(
                validItems,
                item => item.nim,
                item => item.nama,
                item => ({ ...item, defaultStatusKeaktifan: 'Lulus', defaultSemester: 8 })
            );

            await processInBatches(validItems, 25, async (item) => {
                const targetNim = nimMap.get(item) || item.nim;

                return prisma.graduate.upsert({
                    where: { nim: targetNim },
                    update: {
                        jenjang: item.jenjang,
                        statusKelulusan: item.statusKelulusan,
                        tahunLulus: item.tahunLulus,
                        periodeWisuda: item.id_periode_akademik || '',
                        ipk: item.ipk,
                        sksLulus: item.sksLulus
                    },
                    create: {
                        nim: targetNim,
                        jenjang: item.jenjang,
                        statusKelulusan: item.statusKelulusan,
                        tahunLulus: item.tahunLulus,
                        periodeWisuda: item.id_periode_akademik || '',
                        ipk: item.ipk,
                        sksLulus: item.sksLulus
                    }
                });
            });
            totalSynced += validItems.length;
        }

        syncJobTracker.updateProgress('graduates', {
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

    // Jalankan deduplikasi untuk membersihkan sisa record duplikat
    const deduplicationResult = await deduplicateStudents();

    syncJobTracker.updateProgress('graduates', { status: 'completed', synced: totalSynced, skipped: totalSkipped });
    logger.success(`[Kelulusan] Selesai! ${totalSynced} data disinkronkan, ${deduplicationResult.deletedCount} duplikat dibersihkan.`);
    return { totalSynced, totalSkipped, deduplication: deduplicationResult };
};

const syncGraduates = async (req, res) => {
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
        syncJobTracker.startJob('graduates');
        setImmediate(() => {
            executeSyncGraduates()
                .then(() => {
                    try { syncJobTracker.finishJob(true); } catch (e) { logger.error('Gagal memanggil finishJob:', e); }
                })
                .catch((err) => {
                    logger.error('[AsyncJob:graduates] Error tidak tertangani:', err.message);
                    try { syncJobTracker.finishJob(false, err.message); } catch (_) {}
                });
        });

        return res.status(202).json({
            success: true,
            message: 'Sinkronisasi kelulusan dimulai di background (Asynchronous Job).',
            statusUrl: '/api/sync/status'
        });
    }

    try {
        if (!isInternal) syncJobTracker.startJob('graduates');
        const result = await executeSyncGraduates();
        if (!isInternal) syncJobTracker.finishJob(true);

        if (res) {
            return res.status(200).json({
                success: true,
                message: `Sinkronisasi sukses! Total ${result.totalSynced} data kelulusan berhasil diperbarui.`,
                data: result
            });
        }
        return result.totalSynced;
    } catch (error) {
        const errorMsg = error.response?.data || error.message;
        if (!isInternal) syncJobTracker.finishJob(false, errorMsg);
        logger.error('Gagal sinkronisasi kelulusan:', errorMsg);

        if (res) {
            return res.status(500).json({
                success: false,
                message: typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg)
            });
        }
        throw error;
    }
};

module.exports = syncGraduates;
