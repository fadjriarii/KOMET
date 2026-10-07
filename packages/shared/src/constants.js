/**
 * @komet/shared - Shared constants used across frontend and backend.
 */

/** Paginasi: halaman pertama dan ukuran baris tabel yang sama di kedua app. */
export const DEFAULT_PAGE = 1;
/** Baris per halaman daftar — client memintanya, server memakainya sebagai nilai bawaan. */
export const TABLE_LIMIT = 10;
/** Batas atas `limit` yang diterima server, berapa pun permintaan client. */
export const MAX_PAGE_SIZE = 100;

/** Academic year rollover month (September = month 9, getMonth() returns 8) */
export const ACADEMIC_YEAR_ROLLOVER_MONTH = 9;

/** HTTP status codes used across the app */
export const HTTP_STATUS = {
  OK: 200,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

/** Jenjang yang dibaca dashboard KPI. Data bisa berisi jenjang lain (mis. `Prof`);
 * itu bukan bagian dari cakupan IKU, dan pembulatan cakupan dilakukan di query,
 * bukan dengan menyaring hasil di JavaScript. */
export const JENJANGS = ['S1', 'S2'];

/** Student status values */
export const STUDENT_STATUS = {
  AKTIF: 'Aktif',
  CUTI: 'Cuti',
  LULUS: 'Lulus',
  DROP_OUT: 'Drop Out / Dikeluarkan',
};

/** Target IKU-2: persentase minimal mahasiswa eligible yang mengikuti MBKM. */
export const TARGET_IKU2_PERCENT = 20.0;

/**
 * Label predikat kelulusan. Server yang menghitung (graduateUtils.calculatePredikat),
 * client hanya memeta label ke gaya badge — ambang angka tidak boleh hidup dua kali.
 */
export const PREDIKAT = {
  CUM_LAUDE: 'Cum Laude',
  SANGAT_MEMUASKAN: 'Sangat Memuaskan',
  MEMUASKAN: 'Memuaskan',
};
export const CUM_LAUDE_FULL_LABEL = 'Dengan Pujian (Cum Laude)';
export const UNCLASSIFIED_PREDIKAT = 'Belum Terklasifikasi';

/**
 * Umur cookie sesi mahasiswa. Server memakainya sebagai `Max-Age`, client sebagai
 * jendela renew — dua angka yang dulunya disalin dan bisa berbeda diam-diam.
 */
export const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

/** Batas waktu request di server; koneksi diputus sebelum ini. */
export const SERVER_REQUEST_TIMEOUT_MS = 30000;

/**
 * Batas waktu request di client. Harus lebih pendek dari batas server supaya yang
 * memutuskan koneksi hanya satu pihak — kalau sama, keduanya putus di detik yang
 * sama dan tidak pernah diketahui siapa yang menang.
 */
export const CLIENT_REQUEST_TIMEOUT_MS = SERVER_REQUEST_TIMEOUT_MS - 5000;
