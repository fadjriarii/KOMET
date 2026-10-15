-- Awal rantai transfer untuk proyeksi semester per tahun ajaran.
-- Diisi langkah sync transferSemester (kosong = tidak ada rantai).
ALTER TABLE `students` ADD COLUMN `periodeMasukAwal` VARCHAR(191) NOT NULL DEFAULT '';
