-- MBKM distribution charts group by fakultas/programStudi/mitra and always
-- constrain the period first; Graduate KPIs filter kelulusan columns that had
-- no index at all. Single-column indexes already exist for the rest.
CREATE INDEX IF NOT EXISTS `mbkm_activities_fakultas_idx` ON `mbkm_activities`(`fakultas`);
CREATE INDEX IF NOT EXISTS `mbkm_activities_programStudi_idx` ON `mbkm_activities`(`programStudi`);
CREATE INDEX IF NOT EXISTS `mbkm_activities_periode_fakultas_idx` ON `mbkm_activities`(`periode`, `fakultas`);
CREATE INDEX IF NOT EXISTS `mbkm_activities_periode_programStudi_idx` ON `mbkm_activities`(`periode`, `programStudi`);
CREATE INDEX IF NOT EXISTS `mbkm_activities_mitra_idx` ON `mbkm_activities`(`mitra`(100));

CREATE INDEX IF NOT EXISTS `graduates_statusKelulusan_idx` ON `graduates`(`statusKelulusan`);
CREATE INDEX IF NOT EXISTS `graduates_periodeWisuda_idx` ON `graduates`(`periodeWisuda`);
CREATE INDEX IF NOT EXISTS `graduates_tahunLulus_statusKelulusan_idx` ON `graduates`(`tahunLulus`, `statusKelulusan`);
