-- One-off data fix kept after the migration history was removed (ADR 0002).
--
-- The canonical spelling of `angkatan`/`tahunLulus` changed from "2025" to the
-- academic-year label "2025/2026". Sync writes the new format; this statement
-- only repairs rows that an older sync left in the four-digit form.
-- Idempotent: the REGEXP guard matches nothing once the rows are converted.
--
-- Run manually after restoring an old dump:
--   npx prisma db execute --file prisma/data/2026-academic-year-labels.sql   (dari apps/server)

UPDATE `students`
SET `angkatan` = CONCAT(`angkatan`, '/', CAST(CAST(`angkatan` AS UNSIGNED) + 1 AS CHAR))
WHERE `angkatan` REGEXP '^[0-9]{4}$';

UPDATE `graduates`
SET `tahunLulus` = CONCAT(`tahunLulus`, '/', CAST(CAST(`tahunLulus` AS UNSIGNED) + 1 AS CHAR))
WHERE `tahunLulus` REGEXP '^[0-9]{4}$';
