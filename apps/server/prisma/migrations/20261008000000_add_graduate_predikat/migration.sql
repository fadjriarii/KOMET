-- Predikat kelulusan resmi dari SK yudisium SEVIMA (`nama_predikat` pada
-- /siakadcloud/v1/kelulusan). Ambang IPK lokal tidak menyamainya: pada sampel
-- kampus, lulusan S2 ber-IPK 3,93 dan 3,73 membawa label "Sangat Memuaskan",
-- sementara aturan >= 3,51 melaporkannya sebagai cumlaude.
-- DEFAULT '' menandai baris yang belum disinkron ulang; jalan bacanya tetap
-- memakai `calculatePredikat` sebagai fallback, jadi tidak ada backfill di sini.
ALTER TABLE `graduates` ADD COLUMN `predikatLulus` VARCHAR(191) NOT NULL DEFAULT '';
