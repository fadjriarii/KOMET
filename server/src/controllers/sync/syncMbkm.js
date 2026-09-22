const sevimaApi = require('../../config/sevimaApi');
const prisma = require('../../config/prisma');
const logger = require('../../utils/logger');
const syncJobTracker = require('../../utils/syncJobTracker');
const { deduplicateStudents } = require('../../services/studentDeduplicationService');
const {
    sleep,
    cleanText,
    formatAngkatan,
    resolveTargetNimBatch,
    getProdiFakultasMap,
    processInBatches
} = require('./helpers');

// 3. ETL Sinkronisasi MBKM (MbkmActivity)
const executeSyncMbkm = async (startPage = 1) => {
    logger.info('🔄 Memulai proses ETL: Data Aktivitas MBKM dari SEVIMA API...');
    const prodiFakultasMap = await getProdiFakultasMap();

    let currentPage = startPage;
    let totalSynced = 0;
    let totalSkipped = 0;
    let hasMorePages = true;

    // Bersihkan data aktivitas MBKM lama sebelum sinkronisasi ulang agar id selalu valid
    await prisma.mbkmActivity.deleteMany({});
    syncJobTracker.updateProgress('mbkm', { status: 'running', page: currentPage });

    while (hasMorePages) {
        logger.info(`📥 [MBKM] Mengambil halaman ke-${currentPage}...`);
        const response = await sevimaApi.get(`/siakadcloud/v1/aktivitas-mbkm?page=${currentPage}`);
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
            const fakultas = prodiFakultasMap.get(cleanText(prodiName)) || prodiFakultasMap.get(prodiName.trim().toLowerCase()) || '';

            validItems.push({
                nim: attr.nim,
                nama_mahasiswa: attr.nama_mahasiswa || '',
                id_jenjang_program_studi: attr.id_jenjang_program_studi || '',
                id_periode: attr.id_periode || '',
                prodiName,
                fakultas,
                statusKeaktifan: attr.judul_aktivitas || attr.status_aktivitas || '',
                jenisAktivitas: attr.jenis_kegiatan || '',
                judulAktivitas: attr.judul_aktivitas || '',
                mitra: attr.nama_mitra || '',
                statusAktivitas: attr.status_aktivitas || ''
            });
        }

        // Bulk Pre-fetch NIM Resolution (Menghilangkan N+1 Query)
        if (validItems.length > 0) {
            const nimMap = await resolveTargetNimBatch(
                validItems,
                item => item.nim,
                item => item.nama_mahasiswa,
                item => item
            );

            await processInBatches(validItems, 25, async (item) => {
                const targetNim = nimMap.get(item) || item.nim;

                return prisma.mbkmActivity.create({
                    data: {
                        nim: targetNim,
                        periode: item.id_periode,
                        programStudi: item.prodiName,
                        fakultas: item.fakultas,
                        jenjang: item.id_jenjang_program_studi,
                        statusKeaktifan: item.statusKeaktifan,
                        jenisAktivitas: item.jenisAktivitas,
                        judulAktivitas: item.judulAktivitas,
                        mitra: item.mitra,
                        statusAktivitas: item.statusAktivitas
                    }
                });
            });
            totalSynced += validItems.length;
        }

        syncJobTracker.updateProgress('mbkm', {
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

    syncJobTracker.updateProgress('mbkm', { status: 'completed', synced: totalSynced, skipped: totalSkipped });
    logger.success(`[MBKM] Selesai! ${totalSynced} data aktivitas MBKM disinkronkan, ${deduplicationResult.deletedCount} duplikat dibersihkan.`);
    return { totalSynced, totalSkipped, deduplication: deduplicationResult };
};

const syncMbkm = async (req, res) => {
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
        syncJobTracker.startJob('mbkm');
        setImmediate(() => {
            executeSyncMbkm()
                .then(() => {
                    try { syncJobTracker.finishJob(true); } catch (e) { logger.error('Gagal memanggil finishJob:', e); }
                })
                .catch((err) => {
                    logger.error('[AsyncJob:mbkm] Error tidak tertangani:', err.message);
                    try { syncJobTracker.finishJob(false, err.message); } catch (_) {}
                });
        });

        return res.status(202).json({
            success: true,
            message: 'Sinkronisasi MBKM dimulai di background (Asynchronous Job).',
            statusUrl: '/api/sync/status'
        });
    }

    try {
        if (!isInternal) syncJobTracker.startJob('mbkm');
        const result = await executeSyncMbkm();
        if (!isInternal) syncJobTracker.finishJob(true);

        if (res) {
            return res.status(200).json({
                success: true,
                message: `Sinkronisasi sukses! Total ${result.totalSynced} data aktivitas MBKM berhasil diperbarui.`,
                data: result
            });
        }
        return result.totalSynced;
    } catch (error) {
        const errorMsg = error.response?.data || error.message;
        if (!isInternal) syncJobTracker.finishJob(false, errorMsg);
        logger.error('Gagal sinkronisasi MBKM:', errorMsg);

        if (res) {
            return res.status(500).json({
                success: false,
                message: typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg)
            });
        }
        throw error;
    }
};

module.exports = syncMbkm;
