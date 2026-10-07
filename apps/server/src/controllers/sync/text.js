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

const PRODI_RENAME_MAP = {
  biomanajemen: 'Magister Bio Manajemen',
  'magister biomanajemen': 'Magister Bio Manajemen',
  'magister bio manajemen': 'Magister Bio Manajemen',
  apoteker: 'Pendidikan Profesi Apoteker',
  'pendidikan profesi apoteker': 'Pendidikan Profesi Apoteker',
};

/**
 * Helper untuk menormalisasi nama Program Studi dari Sevima API.
 * Menghapus label seperti "(Akun Lama)" atau "(keterangan akun lama)"
 * dan memetakan nama lama ke nama program studi resmi terbaru (misal Biomanajemen -> Magister Bio Manajemen).
 */
function sanitizeProdiName(str) {
  if (!str) return '';
  const cleaned = str
    .replace(/&amp;/g, '&')
    .replace(/\s*\((?:keterangan\s+)?akun\s+lama\)/gi, '')
    .trim();

  const lowerKey = cleaned.toLowerCase();
  if (PRODI_RENAME_MAP[lowerKey]) {
    return PRODI_RENAME_MAP[lowerKey];
  }
  return cleaned;
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

module.exports = {
  cleanText,
  sanitizeText,
  normalizeOptionalText,
  sanitizeProdiName,
  isAkunLama,
};
