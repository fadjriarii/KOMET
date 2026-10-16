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

/**
 * Mapping kewarganegaraan: konversi kode negara / nama bahasa Inggris dari Sevima
 * ke nama negara spesifik dalam Bahasa Indonesia.
 *
 * Strategi (berurutan, yang pertama cocok menang):
 *   1. Gunakan nama_negara dari Sevima jika tersedia dan bukan kosong.
 *   2. id_negara IDN = pasti Indonesia (kode eksplisit menang atas tebakan).
 *   3. id_negara lain tanpa nama = tidak diketahui (detector mencatat kodenya;
 *      tidak ditebak dari NIK/tempat lahir).
 *   4. Tanpa kode: NIK valid (16 digit) = pasti WNI → 'Indonesia'.
 *   5. Tanpa kode dan NIK: fallback SEMENTARA ke tempat_lahir.
 *   6. Tidak ada sinyal sama sekali → '' (tidak diketahui; JANGAN default
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

  // Kode eksplisit menang atas tebakan: IDN pasti Indonesia; kode lain tanpa
  // nama tidak ditebak dari NIK/tempat lahir (detector mencatat kodenya).
  const code = (idNegara || '').trim().toUpperCase();
  if (code === 'IDN') return 'Indonesia';
  if (code) return '';

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

module.exports = {
  isStatusKeluar,
  mapKewarganegaraan,
  mapTempatLahirKeNegara,
  TEMPAT_LAHIR_DIKENAL: new Set(Object.keys(TEMPAT_LAHIR_NEGARA)),
};
