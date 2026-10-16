/**
 * Pembersihan teks mentah SEVIMA. Semua normalisasi string yang terjadi sebelum
 * data masuk DB hidup di sini — read path tidak boleh mengenali variasi yang
 * sama (mis. `&amp;`, `-` sebagai "kosong", label "(Akun Lama)").
 */

// Helper untuk membersihkan teks dan mencocokkan HTML entities
function cleanText(str) {
  if (!str) return '';
  return str.replace(/&amp;/g, '&').trim().toLowerCase();
}

function sanitizeText(str) {
  if (!str) return '';
  return str.replace(/&amp;/g, '&').trim();
}

/**
 * Placeholder "tidak diisi" dari SEVIMA (`-`, `–`) ditulis apa adanya ke kolom
 * teks bebas, sehingga read-path dulu harus mengenal dua cara menuliskan kosong.
 * Sekarang dinormalisasi sekali di jalur tulis: kosong selalu `''`.
 */
function normalizeOptionalText(value) {
  const text = sanitizeText(value);
  return text === '-' || text === '–' ? '' : text;
}

/**
 * Helper untuk menormalisasi nama Program Studi dari Sevima API.
 * Menghapus label seperti "(Akun Lama)" atau "(keterangan akun lama)".
 * Identitas prodi BUKAN nama, melainkan kode ternormalisasi
 * (`normalizeProdiCode`) — rename tidak lagi butuh tabel pemetaan.
 */
function sanitizeProdiName(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/\s*\((?:keterangan\s+)?akun\s+lama\)/gi, '')
    .trim();
}

/**
 * Kode program studi ternormalisasi: huruf X dibuang (`XX61101` dan `61101`
 * satu identitas — konvensi yang sama dengan NIM). Kode stabil melewati
 * rename dan migrasi institut→universitas, jadi resolve nama/fakultas selalu
 * lewat kode ini, bukan lewat pencocokan nama.
 */
function normalizeProdiCode(code) {
  return (code || '').toString().replace(/x/gi, '').trim();
}

/**
 * Memeriksa apakah nama Program Studi atau Fakultas mengandung teks "akun lama".
 * @param {string} text  nama program studi atau fakultas
 * @returns {boolean} true jika mengandung tanda "akun lama"
 */
function isAkunLama(text) {
  if (!text) return false;
  return /keterangan akun lama|akun lama/i.test(text);
}

/**
 * SEVIMA masih mengirim jenjang "Prof" untuk pendidikan profesi.
 * Normalisasi sekali di jalur tulis sehingga DB & read path hanya mengenal
 * "Profesi".
 */
const SEVIMA_JENJANG_RENAME = { Prof: 'Profesi' };

function normalizeJenjang(value) {
  const text = (value || '').trim();
  return SEVIMA_JENJANG_RENAME[text] || text;
}

module.exports = {
  cleanText,
  sanitizeText,
  normalizeOptionalText,
  sanitizeProdiName,
  normalizeProdiCode,
  isAkunLama,
  normalizeJenjang,
};
