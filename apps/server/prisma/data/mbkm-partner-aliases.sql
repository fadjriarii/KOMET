-- Alias nama mitra MBKM (tabel `mbkm_partner_aliases`, lihat services/mbkm/partnerNames.js).
--
-- Satu baris = satu ejaan dari SEVIMA (`alias`) yang harus dihitung sebagai mitra
-- `canonical`. Tulis `canonical` dengan nama terlengkap; nama itu yang tampil di
-- kartu, popup, dan tabel. Ejaan yang hanya beda huruf besar, tanda baca, atau
-- awalan PT/CV/Tbk TIDAK perlu didaftarkan: sudah digabung otomatis.
--
-- Idempoten: menjalankan ulang hanya memperbarui `canonical`.
-- Jalankan setelah menambah baris:
--   mysql ... komet_db < prisma/data/mbkm-partner-aliases.sql
-- Perubahan tampil setelah cache 5 menit habis, setelah sync, atau setelah server restart.

INSERT INTO `mbkm_partner_aliases` (`alias`, `canonical`) VALUES
  ('I3L', 'Indonesia International Institute for Life-Sciences (i3L)'),
  ('i3L University', 'Indonesia International Institute for Life-Sciences (i3L)'),
  ('Indonesia International Institute for Life-Science', 'Indonesia International Institute for Life-Sciences (i3L)')
ON DUPLICATE KEY UPDATE `canonical` = VALUES(`canonical`);
