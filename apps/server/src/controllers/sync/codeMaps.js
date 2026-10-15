/**
 * Peta kode/huruf mentah SEVIMA ke kosakata yang dipakai database. Dua fungsi,
 * satu sifat: input adalah singkatan dari API, output adalah nilai tersimpan.
 */
const { validNik } = require('../../services/studentDeduplicationService');

/**
 * Menentukan apakah status mahasiswa termasuk "sudah keluar" (lulus/DO/putus studi/dll.)
 * berdasarkan id_status_mahasiswa dari Sevima.
 * @param {string} idStatus kode status dari Sevima (misal "L"=Lulus, "D"=DO)
 * @returns {boolean}
 */
function isStatusKeluar(idStatus) {
  if (!idStatus) return false;
  // "L"=Lulus, "D"=Drop Out, "K"=Keluar, "M"=Meninggal, "P"=Pindah, "T"=Tidak Lanjut
  const statusKeluar = ['L', 'D', 'K', 'M', 'P', 'T'];
  return statusKeluar.includes(idStatus.toUpperCase());
}

/** Nama negara Bahasa Indonesia untuk kode ISO-3, dipakai hanya bila Sevima
 *  tidak mengirim `nama_negara` sama sekali. */
const ISO3_NEGARA = {
  IDN: 'Indonesia',
  USA: 'Amerika Serikat',
  MYS: 'Malaysia',
  SGP: 'Singapura',
  AUS: 'Australia',
  GBR: 'Inggris',
  DEU: 'Jerman',
  FRA: 'Prancis',
  JPN: 'Jepang',
  KOR: 'Korea Selatan',
  CHN: 'Tiongkok',
  IND: 'India',
  THA: 'Thailand',
  PHL: 'Filipina',
  VNM: 'Vietnam',
  NLD: 'Belanda',
  CAN: 'Kanada',
  NZL: 'Selandia Baru',
  SAU: 'Arab Saudi',
  ARE: 'Uni Emirat Arab',
  PAK: 'Pakistan',
  BGD: 'Bangladesh',
  NPL: 'Nepal',
  LKA: 'Sri Lanka',
  MMR: 'Myanmar',
  KHM: 'Kamboja',
  LAO: 'Laos',
  BRN: 'Brunei Darussalam',
  TLS: 'Timor-Leste',
};

/**
 * Mapping kewarganegaraan: konversi kode negara / nama bahasa Inggris dari Sevima
 * ke nama negara spesifik dalam Bahasa Indonesia.
 *
 * Strategi (berurutan, yang pertama cocok menang):
 *   1. Gunakan nama_negara dari Sevima jika tersedia dan bukan kosong.
 *   2. Fallback ke lookup tabel ISO-3 → nama Bahasa Indonesia.
 *   3. NIK valid (16 digit) = pasti WNI → 'Indonesia'.
 *   4. Fallback SEMENTARA ke tempat_lahir bila tidak ada sinyal di atas.
 *      Berlaku untuk seluruh mahasiswa tanpa id_negara/NIK.
 *      Begitu SEVIMA mengisi id_negara, sync berikutnya otomatis memakai
 *      langkah 1/2 lagi (kolom ditulis ulang tiap sync).
 *   5. Tidak ada sinyal sama sekali → '' (tidak diketahui; JANGAN default
 *      'Indonesia' agar tidak menyembunyikan data yang belum dilengkapi).
 *
 * @param {string} idNegara   kode ISO-3 negara (misal "IDN", "USA", "MYS")
 * @param {string} namaNegara nama negara dari Sevima (misal "Indonesia", "Malaysia")
 * @param {string} tempatLahir tempat lahir dari Sevima (misal "Beauvais", "Jakarta")
 * @param {string} nik        NIK dari Sevima (16 digit = WNI)
 * @returns {string} Nama negara spesifik, atau '' bila tidak diketahui
 */
function mapKewarganegaraan(idNegara, namaNegara, tempatLahir = '', nik = '') {
  // Gunakan nama langsung dari Sevima jika valid
  if (namaNegara && namaNegara.trim() !== '') {
    return namaNegara.trim();
  }

  // Fallback: lookup berdasarkan kode ISO-3
  if (idNegara) {
    const nama = ISO3_NEGARA[idNegara.toUpperCase().trim()];
    if (nama) return nama;
  }

  // NIK valid = WNI
  if (validNik(nik)) return 'Indonesia';

  // Fallback sementara: tempat lahir
  const dariLahir = mapTempatLahirKeNegara(tempatLahir);
  if (dariLahir) return dariLahir;

  // Default: tidak diketahui
  return '';
}

/**
 * Kota/nama negara → nama negara gaya SEVIMA (ikuti ejaan `nama_negara`:
 * 'Perancis', 'Singapura'). Kunci dinormalisasi (lowercase, trim) sebelum
 * dicocokkan. Kota Indonesia yang umum ikut terdaftar agar tetap 'Indonesia';
 * kota tak dikenal dikembalikan apa adanya (title-case) supaya tampil sebagai
 * asing yang perlu dikonfirmasi, bukan diam-diam jadi Indonesia.
 */
const TEMPAT_LAHIR_NEGARA = {
  france: 'Perancis',
  perancis: 'Perancis',
  prancis: 'Perancis',
  beauvais: 'Perancis',
  compiegne: 'Perancis',
  'pierre benite': 'Perancis',
  singapore: 'Singapura',
  singapura: 'Singapura',
  indonesia: 'Indonesia',
  jakarta: 'Indonesia',
  bandung: 'Indonesia',
  surabaya: 'Indonesia',
  medan: 'Indonesia',
  semarang: 'Indonesia',
  makassar: 'Indonesia',
  denpasar: 'Indonesia',
  yogyakarta: 'Indonesia',
  palembang: 'Indonesia',
  tangerang: 'Indonesia',
  bekasi: 'Indonesia',
  bogor: 'Indonesia',
  depok: 'Indonesia',
};

function mapTempatLahirKeNegara(tempatLahir) {
  const key = (tempatLahir || '').trim().toLowerCase();
  if (!key) return '';
  if (TEMPAT_LAHIR_NEGARA[key]) return TEMPAT_LAHIR_NEGARA[key];
  // Kota/negara tak dikenal: tampilkan apa adanya (asing sementara) supaya
  // terlihat dan dikoreksi lewat id_negara, bukan default Indonesia.
  return key.replace(/\b\w/g, (c) => c.toUpperCase());
}

module.exports = { isStatusKeluar, mapKewarganegaraan, mapTempatLahirKeNegara };
