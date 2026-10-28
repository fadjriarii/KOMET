-- Alias nama mitra MBKM (tabel `mbkm_partner_aliases`, lihat services/mbkm/partnerNames.js).
--
-- Satu baris = satu ejaan dari SEVIMA (`alias`) yang harus dihitung sebagai mitra
-- `canonical`. Tulis `canonical` dengan nama terlengkap; nama itu yang tampil di
-- kartu, popup, dan tabel. Daftarkan hanya ejaan yang tidak tertangkap aturan
-- otomatis di services/mbkm/partnerNames.js (huruf besar, tanda baca, PT/CV/Tbk,
-- jamak "-s", kode mata kuliah, singkatan dalam kurung, nama pendek atau
-- singkatan kata yang mengawali satu-satunya nama panjang, salah ketik satu huruf).
--
-- Idempoten: menjalankan ulang hanya memperbarui `canonical`.
-- Jalankan setelah menambah baris:
--   npx prisma db execute --file prisma/data/mbkm-partner-aliases.sql   (dari apps/server)
-- Perubahan tampil setelah cache 5 menit habis, setelah sync, atau setelah server restart.

INSERT INTO `mbkm_partner_aliases` (`alias`, `canonical`) VALUES
  ('i3L University', 'Indonesia International Institute for Life-Sciences (i3L)'),
  ('MBKM - BRIN', 'Badan Riset dan Inovasi Nasional (BRIN)'),
  ('Research - BRIN', 'Badan Riset dan Inovasi Nasional (BRIN)')
ON DUPLICATE KEY UPDATE `canonical` = VALUES(`canonical`);
