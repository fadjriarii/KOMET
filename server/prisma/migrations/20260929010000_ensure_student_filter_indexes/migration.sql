-- Keep fresh MariaDB installations aligned with the Student model indexes.
-- The previous migration adds the two indexes missing from the historic local
-- schema; these idempotent statements also cover databases created solely
-- from the migration history.
CREATE INDEX IF NOT EXISTS `students_statusKeaktifan_idx` ON `students`(`statusKeaktifan`);
CREATE INDEX IF NOT EXISTS `students_semester_idx` ON `students`(`semester`);
CREATE INDEX IF NOT EXISTS `students_fakultas_idx` ON `students`(`fakultas`);
CREATE INDEX IF NOT EXISTS `students_programStudi_idx` ON `students`(`programStudi`);
CREATE INDEX IF NOT EXISTS `students_jenjang_idx` ON `students`(`jenjang`);
CREATE INDEX IF NOT EXISTS `students_angkatan_idx` ON `students`(`angkatan`);
CREATE INDEX IF NOT EXISTS `students_periodeMasuk_idx` ON `students`(`periodeMasuk`);
CREATE INDEX IF NOT EXISTS `students_kewarganegaraan_idx` ON `students`(`kewarganegaraan`);
CREATE INDEX IF NOT EXISTS `students_periodeMasuk_kewarganegaraan_idx` ON `students`(`periodeMasuk`, `kewarganegaraan`);
CREATE INDEX IF NOT EXISTS `students_statusKeaktifan_semester_idx` ON `students`(`statusKeaktifan`, `semester`);
CREATE INDEX IF NOT EXISTS `students_statusKeaktifan_kewarganegaraan_idx` ON `students`(`statusKeaktifan`, `kewarganegaraan`);
