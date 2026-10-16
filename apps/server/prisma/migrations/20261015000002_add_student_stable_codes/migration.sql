-- Identitas stabil untuk resolve prodi/fakultas dan agregat negara per kode.
-- Nilai historis diisi ulang oleh sync berikutnya (kolom ditulis ulang tiap sync).
ALTER TABLE `students` ADD COLUMN `kodeProgramStudi` VARCHAR(191) NOT NULL DEFAULT '';
ALTER TABLE `students` ADD COLUMN `idNegara` VARCHAR(191) NOT NULL DEFAULT '';
