/**
 * Jendela debounce kolom pencarian. Nilainya sengaja sama untuk ketiga tab:
 * yang ditunda adalah ketikan user, bukan karakteristik datanya. Dulunya konstanta
 * ini bernama `STUDENT_SEARCH_DEBOUNCE_MS` padahal ikut dipakai graduates dan MBKM,
 * sehingga terlihat seperti konfigurasi student yang bocor ke modul lain.
 */
export const SEARCH_DEBOUNCE_MS = 400;
