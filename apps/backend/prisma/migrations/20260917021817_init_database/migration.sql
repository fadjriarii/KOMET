-- CreateTable
CREATE TABLE `students` (
    `nim` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `jenjang` VARCHAR(191) NOT NULL,
    `periodeMasuk` VARCHAR(191) NOT NULL,
    `angkatan` VARCHAR(191) NOT NULL,
    `programStudi` VARCHAR(191) NOT NULL,
    `fakultas` VARCHAR(191) NOT NULL,
    `statusKeaktifan` VARCHAR(191) NOT NULL,
    `semester` INTEGER NOT NULL,
    `kewarganegaraan` VARCHAR(191) NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`nim`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `graduates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nim` VARCHAR(191) NOT NULL,
    `jenjang` VARCHAR(191) NOT NULL,
    `statusKelulusan` VARCHAR(191) NOT NULL,
    `tahunLulus` VARCHAR(191) NOT NULL,
    `ipk` DOUBLE NOT NULL,
    `sksLulus` INTEGER NOT NULL,

    UNIQUE INDEX `graduates_nim_key`(`nim`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mbkm_activities` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nim` VARCHAR(191) NOT NULL,
    `periode` VARCHAR(191) NOT NULL,
    `programStudi` VARCHAR(191) NOT NULL,
    `fakultas` VARCHAR(191) NOT NULL,
    `jenjang` VARCHAR(191) NOT NULL,
    `statusKeaktifan` VARCHAR(191) NOT NULL,
    `jenisAktivitas` VARCHAR(191) NOT NULL,
    `judulAktivitas` TEXT NOT NULL,
    `mitra` VARCHAR(191) NOT NULL,
    `statusAktivitas` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `graduates` ADD CONSTRAINT `graduates_nim_fkey` FOREIGN KEY (`nim`) REFERENCES `students`(`nim`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mbkm_activities` ADD CONSTRAINT `mbkm_activities_nim_fkey` FOREIGN KEY (`nim`) REFERENCES `students`(`nim`) ON DELETE CASCADE ON UPDATE CASCADE;
