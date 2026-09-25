-- AlterTable: Tambahkan kolom `periode` ke tabel `students`
-- Nilai: "Ganjil" (kode periode berakhir 1) atau "Genap" (kode periode berakhir 2)
-- Default string kosong untuk backward-compatibility; akan diisi ulang saat sync berikutnya.
ALTER TABLE `students` ADD COLUMN `periode` VARCHAR(191) NOT NULL DEFAULT '';

-- CreateIndex: Index untuk kolom `periode` agar query filter lebih efisien
CREATE INDEX `students_periode_idx` ON `students`(`periode`);
