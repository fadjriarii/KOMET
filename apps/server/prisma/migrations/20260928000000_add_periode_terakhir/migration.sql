ALTER TABLE `students`
    ADD COLUMN `periodeTerakhir` VARCHAR(191) NOT NULL DEFAULT '' AFTER `periodeMasuk`;

CREATE INDEX `students_periodeTerakhir_idx` ON `students`(`periodeTerakhir`);
