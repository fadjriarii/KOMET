-- Menandai record "(Akun Lama)" SEVIMA. programStudi yang tersimpan sudah
-- disanitasi (labelnya dibuang saat tulis), jadi tanpa kolom ini dedup tidak
-- bisa lagi membedakan record lama dari record penggantinya.
ALTER TABLE `students` ADD COLUMN `isAkunLama` BOOLEAN NOT NULL DEFAULT FALSE;
