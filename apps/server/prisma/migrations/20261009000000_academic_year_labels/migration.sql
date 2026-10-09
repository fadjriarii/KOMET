-- Nilai kanonis kolom angkatan/tahunLulus berubah dari "2025" menjadi label
-- tahun ajaran "2025/2026". Ditulis sekali di sini; sync berikutnya memakai
-- formatTahunLulus/formatAngkatan yang sama, pembaca tidak pernah memformat.
UPDATE `students`
SET `angkatan` = CONCAT(`angkatan`, '/', CAST(CAST(`angkatan` AS UNSIGNED) + 1 AS CHAR))
WHERE `angkatan` REGEXP '^[0-9]{4}$';

UPDATE `graduates`
SET `tahunLulus` = CONCAT(`tahunLulus`, '/', CAST(CAST(`tahunLulus` AS UNSIGNED) + 1 AS CHAR))
WHERE `tahunLulus` REGEXP '^[0-9]{4}$';
