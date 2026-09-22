const prisma = require('../config/prisma');
const logger = require('../utils/logger');

/**
 * Service Deduplikasi Terpadu (Students, Graduates, & MBKM)
 * 
 * Aturan Deduplikasi:
 * 1. Menghilangkan "X" / "x" dari NIM (nimBersih = nim.toLowerCase().trim().replace(/x/g, '')).
 * 2. Mengelompokkan data berdasarkan (nama, nimBersih).
 * 3. Jika kelompok HANYA berisi 1 data (TIDAK DUPLIKAT):
 *    -> Data TETAP ADA, tidak disentuh atau dihapus sama sekali.
 * 4. Jika kelompok berisi > 1 data (DUPLIKAT):
 *    -> Selamatkan SATU data utama (utamakan NIM yang bersih dari "X", lalu timestamp terbaru).
 *    -> Re-link data relasi (Graduate & MBKM Activity) dari data sisa ke data utama agar tidak ada histori yang hilang.
 *    -> Hapus data duplikat sisa secara masal (bulk delete).
 */
async function deduplicateStudents() {
    logger.info('🧹 Memulai proses deduplikasi terpadu (Students, Graduates, MBKM) di memori...');

    // 1. Ambil seluruh data mahasiswa secara bertahap (batch chunking 500 per iterasi) untuk skalabilitas
    const groupMap = new Map();
    let totalStudentsCount = 0;
    let cursor = null;
    const CHUNK_SIZE = 500;
    let hasMore = true;

    while (hasMore) {
        const queryOptions = {
            take: CHUNK_SIZE,
            orderBy: { nim: 'asc' }
        };

        if (cursor) {
            queryOptions.skip = 1;
            queryOptions.cursor = { nim: cursor };
        }

        const chunk = await prisma.student.findMany(queryOptions);
        if (chunk.length === 0) {
            hasMore = false;
            break;
        }

        totalStudentsCount += chunk.length;
        cursor = chunk[chunk.length - 1].nim;

        for (const student of chunk) {
            const namaBersih = (student.nama || '').toLowerCase().trim();
            const nimBersih = (student.nim || '').toLowerCase().trim().replace(/x/g, '');
            const key = `${namaBersih}_${nimBersih}`;

            if (!groupMap.has(key)) {
                groupMap.set(key, []);
            }
            groupMap.get(key).push(student);
        }

        if (chunk.length < CHUNK_SIZE) {
            hasMore = false;
        }
    }
    logger.info(`📦 Berhasil memproses ${totalStudentsCount} data mahasiswa dari database.`);

    const studentIdsToDelete = [];
    let relinkedGraduatesCount = 0;
    let relinkedMbkmCount = 0;

    // 3. Evaluasi setiap kelompok
    for (const [, group] of groupMap) {
        // Jika HANYA 1 data -> TIDAK DUPLIKAT -> TETAP ADA (Skip)
        if (group.length <= 1) continue;

        // Jika > 1 data -> ADA DUPLIKAT -> Pemilahan & Resolusi
        group.sort((a, b) => {
            const aHasX = /x/i.test(a.nim);
            const bHasX = /x/i.test(b.nim);

            if (!aHasX && bHasX) return -1; // a bersih dari X -> utamakan a
            if (aHasX && !bHasX) return 1;  // b bersih dari X -> utamakan b

            // Jika status X sama, utamakan yang memiliki updatedAt terbaru
            const timeA = new Date(a.updatedAt || 0).getTime();
            const timeB = new Date(b.updatedAt || 0).getTime();

            return timeB - timeA;
        });

        const survivor = group[0]; // 1 Data Utama yang diselamatkan
        const eliminated = group.slice(1); // Data sisa yang tereliminasi

        await prisma.$transaction(async (tx) => {
            for (const duplicateStudent of eliminated) {
                // Re-link / pindahkan relasi Graduate jika survivor belum memiliki Graduate
                const duplicateGraduate = await tx.graduate.findUnique({
                    where: { nim: duplicateStudent.nim }
                });

                if (duplicateGraduate) {
                    const survivorGraduate = await tx.graduate.findUnique({
                        where: { nim: survivor.nim }
                    });

                    if (!survivorGraduate) {
                        // Pindahkan kelulusan ke survivor NIM
                        await tx.graduate.update({
                            where: { id: duplicateGraduate.id },
                            data: { nim: survivor.nim }
                        });
                        relinkedGraduatesCount++;
                    } else {
                        // Jika survivor sudah punya kelulusan, hapus kelulusan duplikat
                        await tx.graduate.delete({
                            where: { id: duplicateGraduate.id }
                        });
                    }
                }

                // Re-link relasi MBKM Activity ke survivor NIM
                const mbkmRes = await tx.mbkmActivity.updateMany({
                    where: { nim: duplicateStudent.nim },
                    data: { nim: survivor.nim }
                });
                relinkedMbkmCount += mbkmRes.count;

                studentIdsToDelete.push(duplicateStudent.nim);
            }
        });
    }

    // 4. Bulk Delete Mahasiswa Duplikat
    let deletedStudentsCount = 0;
    if (studentIdsToDelete.length > 0) {
        const deleteRes = await prisma.student.deleteMany({
            where: { nim: { in: studentIdsToDelete } }
        });
        deletedStudentsCount = deleteRes.count;
        logger.success(`🗑️ Berhasil menghapus ${deletedStudentsCount} record mahasiswa duplikat secara masal.`);
    } else {
        logger.info('✨ Tidak ada data mahasiswa duplikat yang perlu dihapus.');
    }

    // 5. Pembersihan Duplikat pada Aktivitas MBKM
    const mbkmActivities = await prisma.mbkmActivity.findMany();
    const mbkmGroupMap = new Map();

    for (const act of mbkmActivities) {
        const nimBersih = (act.nim || '').toLowerCase().trim().replace(/x/g, '');
        const jenisBersih = (act.jenisAktivitas || '').toLowerCase().trim();
        const judulBersih = (act.judulAktivitas || '').toLowerCase().trim();
        const key = `${nimBersih}_${act.periode}_${jenisBersih}_${judulBersih}`;

        if (!mbkmGroupMap.has(key)) {
            mbkmGroupMap.set(key, []);
        }
        mbkmGroupMap.get(key).push(act);
    }

    const mbkmIdsToDelete = [];
    for (const [, group] of mbkmGroupMap) {
        if (group.length > 1) {
            for (let i = 1; i < group.length; i++) {
                mbkmIdsToDelete.push(group[i].id);
            }
        }
    }

    let deletedMbkmCount = 0;
    if (mbkmIdsToDelete.length > 0) {
        const mbkmDeleteRes = await prisma.mbkmActivity.deleteMany({
            where: { id: { in: mbkmIdsToDelete } }
        });
        deletedMbkmCount = mbkmDeleteRes.count;
        logger.success(`🗑️ Berhasil menghapus ${deletedMbkmCount} record MBKM duplikat.`);
    }

    return {
        totalEvaluatedStudents: totalStudentsCount,
        deletedStudentsCount,
        relinkedGraduatesCount,
        relinkedMbkmCount,
        deletedMbkmCount
    };
}

module.exports = {
    deduplicateStudents
};
