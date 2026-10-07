-- Riwayat job sinkronisasi untuk popup Synchronization: hanya beberapa run terbaru
-- yang disimpan, jadi UI tidak perlu menghitung ulang apa pun. Dibaca urut id
-- (autoincrement = urutan tulis) dan dihapus by id, sehingga tidak ada indeks lain
-- yang dibutuhkan. `trigger` adalah kata terpesan di MySQL — selalu dibacktick,
-- dan tabel ini hanya diakses lewat Prisma client yang mengutipnya sendiri.
CREATE TABLE IF NOT EXISTS `sync_runs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `finishedAt` DATETIME(3) NOT NULL,
    `trigger` VARCHAR(9) NOT NULL,
    `actor` VARCHAR(32) NOT NULL,
    `status` VARCHAR(9) NOT NULL,
    `modules` JSON NOT NULL,
    `error` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
