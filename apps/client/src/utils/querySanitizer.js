/**
 * Satu sanitizer query parameter untuk ketiga dashboard.
 *
 * Aturan validasi yang sesungguhnya tetap milik server
 * (`apps/server/src/middlewares/validator.js`, Zod) — yang di sini hanya lantai
 * pengaman sebelum request meninggalkan browser: tanpa karakter kontrol, tanpa
 * string ekstrem panjang, dan jumlah nilai multi-select dibatasi.
 *
 * Sebelumnya tiap modul memelihara "validator" sendiri: graduate dan MBKM sama
 * sekali tidak membatasi panjang atau jumlah item, dan hasil `valid`/`errors`
 * milik students tidak dibaca siapa pun — tiga salinan aturan yang bisa saling
 * berbeda tanpa ada yang sadar.
 */

const MAX_SEARCH_LENGTH = 100;
const MAX_VALUE_LENGTH = 255;
const MAX_ARRAY_ITEMS = 50;

const isControlCharacter = (character) => character < ' ' || character === String.fromCharCode(127);

/** Karakter kontrol (0x00–0x1F dan 0x7F) bukan bagian input yang sah di UI mana pun. */
export function sanitizeText(value, maxLength = MAX_VALUE_LENGTH) {
  if (typeof value !== 'string') return '';
  return value
    .split('')
    .filter((character) => !isControlCharacter(character))
    .join('')
    .trim()
    .substring(0, maxLength);
}

export function sanitizeSearch(value) {
  return sanitizeText(value, MAX_SEARCH_LENGTH);
}

/**
 * @param {{ search?: string, single?: string[], multi?: string[] }} fields
 *   Nama field pada objek filter modul. `search` default `'search'`.
 * @returns {(params?: object) => { sanitized: object }}
 */
export function createQuerySanitizer({ search = 'search', single = [], multi = [] } = {}) {
  return function sanitizeQueryParams(params = {}) {
    const sanitized = {};

    const keyword = sanitizeSearch(params[search]);
    if (keyword) sanitized[search] = keyword;

    for (const field of single) {
      const value = sanitizeText(params[field]);
      if (value) sanitized[field] = value;
    }

    for (const field of multi) {
      const raw = params[field];
      // Tidak dikirim ≠ dikirim kosong. Field yang tidak ada jangan sampai
      // menghasilkan array kosong, karena pemakai membaca array kosong sebagai
      // pilihan eksplisit ("semua status").
      if (raw === undefined || raw === null) continue;
      const values = Array.isArray(raw) ? raw : [raw];
      // Sekali pun hadir sebagai string tunggal (tautan lama), hasilnya array.
      sanitized[field] = values
        .map((value) => sanitizeText(value))
        .filter(Boolean)
        .slice(0, MAX_ARRAY_ITEMS);
    }

    return { sanitized };
  };
}
