-- Existing local deployments already contain the single-column filter indexes
-- declared in schema.prisma. This migration adds the two indexes absent from
-- that baseline: the jenjang filter index and the international-trend index.
CREATE INDEX `students_jenjang_idx` ON `students`(`jenjang`);
CREATE INDEX `students_periodeMasuk_kewarganegaraan_idx` ON `students`(`periodeMasuk`, `kewarganegaraan`);
