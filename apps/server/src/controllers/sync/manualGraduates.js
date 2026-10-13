/**
 * manualGraduates.js
 *
 * Kelulusan yang tidak pernah diterbitkan endpoint Sevima `/kelulusan`
 * (terukur 5 NIM; semuanya berstatus Lulus di `/mahasiswa`). Nilainya diisi
 * operator, bukan hasil hitungan, karena API tidak punya sumbernya.
 *
 * Sinkronisasi kelulusan membuang seluruh isi tabel `graduates` lebih dulu,
 * lalu mengisi ulang dari `/kelulusan` DAN menambahkan baris di bawah supaya
 * jumlah tetap selaras dengan `/mahasiswa?statusKeaktifan=Lulus`. Baris manual
 * HANYA ditulis bila NIM-nya tidak muncul di respons API — begitu Sevima
 * menerbitkannya, data API yang dipakai dan baris manual dilewati (tanpa
 * duplikat).
 *
 * ponytail: daftar ini literal di kode, bukan tabel `manual_graduates` di DB —
 * ceiling: daftar berubah hanya lewat deploy. Upgrade path: pindah ke tabel
 * bila operator perlu mengeditnya tanpa rilis.
 */

/**
 * `tahunLulus`/`periodeWisuda` SENGAJA kosong: keduanya belum dikonfirmasi
 * operator (nilai lama di DB hanya salinan `periodeMasuk`). Isi setelah
 * datanya diterima. `predikatLulus` dikosongkan supaya pembaca menghitungnya
 * dari IPK; `jenjang` diambil dari baris `students` saat insert.
 */
const MANUAL_GRADUATES = [
  // Jayne Salma Cross — Innovation & Entrepreneurship
  { nim: '17010091', ipk: 3.42, sksLulus: 127, tahunLulus: '', periodeWisuda: '' },
  // Sinthia Selvester Kadop — Innovation & Entrepreneurship
  { nim: '18010193', ipk: 2.9, sksLulus: 144, tahunLulus: '', periodeWisuda: '' },
  // Badseba Novita Navratilova Nasendi — Innovation & Entrepreneurship
  { nim: '18010037', ipk: 2.63, sksLulus: 144, tahunLulus: '', periodeWisuda: '' },
  // Viranitasya Stephanie Himawan — Bio Medis dan Rekayasa Hayati
  { nim: '18010209', ipk: 2.77, sksLulus: 145, tahunLulus: '', periodeWisuda: '' },
  // Gabriele Mustika Kresnia — Bio Informatika
  { nim: '18010226', ipk: 3.37, sksLulus: 144, tahunLulus: '', periodeWisuda: '' },
];

/** Baris manual yang belum diterbitkan `/kelulusan`; NIM yang sudah ada dilewati. */
function selectManualGraduates(syncedNims) {
  return MANUAL_GRADUATES.filter((row) => !syncedNims.has(row.nim));
}

module.exports = { MANUAL_GRADUATES, selectManualGraduates };
