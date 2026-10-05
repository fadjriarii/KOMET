-- Dashboard filters commonly constrain status together with faculty/prodi or
-- a cohort/intake period. Composite indexes avoid costly index intersections.
CREATE INDEX IF NOT EXISTS `students_statusKeaktifan_fakultas_programStudi_idx`
  ON `students`(`statusKeaktifan`, `fakultas`, `programStudi`);
CREATE INDEX IF NOT EXISTS `students_statusKeaktifan_angkatan_idx`
  ON `students`(`statusKeaktifan`, `angkatan`);
CREATE INDEX IF NOT EXISTS `students_statusKeaktifan_periodeMasuk_idx`
  ON `students`(`statusKeaktifan`, `periodeMasuk`);
