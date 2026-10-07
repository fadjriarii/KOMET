/**
 * Peta kode/huruf mentah SEVIMA ke kosakata yang dipakai database. Dua fungsi,
 * satu sifat: input adalah singkatan dari API, output adalah nilai tersimpan.
 */

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
 * Strategi:
 *   1. Gunakan nama_negara dari Sevima jika tersedia dan bukan kosong.
 *   2. Fallback ke lookup tabel ISO-3 → nama Bahasa Indonesia.
 *   3. Default: "Indonesia".
 *
 * @param {string} idNegara   kode ISO-3 negara (misal "IDN", "USA", "MYS")
 * @param {string} namaNegara nama negara dari Sevima (misal "Indonesia", "Malaysia")
 * @returns {string} Nama negara spesifik dalam Bahasa Indonesia
 */
function mapKewarganegaraan(idNegara, namaNegara) {
  // Gunakan nama langsung dari Sevima jika valid
  if (namaNegara && namaNegara.trim() !== '') {
    return namaNegara.trim();
  }

  // Fallback: lookup berdasarkan kode ISO-3
  if (idNegara) {
    const nama = ISO3_NEGARA[idNegara.toUpperCase().trim()];
    if (nama) return nama;
  }

  // Default: Indonesia
  return 'Indonesia';
}

module.exports = { isStatusKeluar, mapKewarganegaraan };
