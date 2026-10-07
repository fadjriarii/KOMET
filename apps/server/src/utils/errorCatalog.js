/**
 * errorCatalog.js
 *
 * Satu tempat untuk pesan yang boleh keluar ke client. `sendError` hanya menampilkan
 * string yang terdaftar di sini; string lain (pesan Prisma, SQL, stack, pesan yang
 * dibentuk dari data user) otomatis digantikan pesan generik dan detailnya tetap
 * masuk ke log server. Ini menggantikan blocklist regex lama yang bisa lolos untuk
 * pesan apa pun yang kebetulan tidak mengandung kata teknis.
 *
 * `ERROR_CATALOG` memetakan KODE error mesin → status HTTP + pesan publik, dan itu
 * satu-satunya tempat controller menuliskan kegagalannya (`sendServerError`). Angka
 * status dan string tidak ditulis ulang di call site, jadi "lupa mendaftarkan pesan"
 * tidak lagi menjadi kegagalan yang diam-diam tampil sebagai pesan generik.
 */

const { HTTP_STATUS } = require('@komet/shared/constants');

const GENERIC_ERROR_MESSAGE = 'Terjadi kesalahan pada server. Silakan coba lagi.';

const ERROR_CATALOG = {
  /**
   * Gagal membaca/menghitung data. Endpoint aslinya tetap terlacak: `context` yang
   * dikirim pemanggil masuk log server, dan namanya tidak perlu dibacakan ke user.
   */
  DATA_READ_FAILED: {
    statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message: 'Gagal mengambil data.',
  },
  INVALID_QUERY: {
    statusCode: HTTP_STATUS.BAD_REQUEST,
    message: 'Query parameter tidak valid.',
  },
  /** Gagal menulis (insert/hapus) — pembacaan memakai `DATA_READ_FAILED`. */
  DATA_WRITE_FAILED: {
    statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message: 'Gagal menyimpan data.',
  },
  SYNC_FAILED: {
    statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message: 'Sinkronisasi gagal diselesaikan.',
  },
  /** Id riwayat tidak ada — biasanya barisnya baru saja dihapus di tab lain. */
  SYNC_RUN_NOT_FOUND: {
    statusCode: HTTP_STATUS.NOT_FOUND,
    message: 'Riwayat sinkronisasi tidak ditemukan.',
  },
};

/** Pesan yang dikirim dari luar controller: middleware auth, rate limit, transport. */
const MIDDLEWARE_MESSAGES = [
  // Auth / sesi
  'Student session is required.',
  'Student session is not configured.',
  'Unauthorized access. Valid x-api-key header or Bearer token is required.',
  'Student session or valid x-api-key is required.',
  'Server configuration error.',
  'Origin tidak diizinkan.',
  'Origin tidak diizinkan untuk meminta sesi.',

  // Validasi input (middleware mengirim stringnya langsung)
  'Nama query parameter tidak valid.',

  // Rate limit & guard
  'Too many requests, please try again later.',
  'Terlalu banyak permintaan ringkasan. Silakan tunggu sebentar.',
  'Terlalu banyak permintaan status sinkronisasi.',
  'Sync rate limit exceeded. Please wait before syncing again.',
  'Terlalu banyak permintaan sesi. Silakan coba lagi.',
  'Proses sinkronisasi lain sedang berjalan. Tunggu hingga selesai.',

  // Transport
  'Request timeout. Server sedang mengalami beban tinggi.',
  'Endpoint tidak ditemukan.',
];

const PUBLIC_ERROR_MESSAGES = new Set([
  ...Object.values(ERROR_CATALOG).map((entry) => entry.message),
  ...MIDDLEWARE_MESSAGES,
]);

function isPublicErrorMessage(message) {
  return typeof message === 'string' && PUBLIC_ERROR_MESSAGES.has(message);
}

module.exports = {
  GENERIC_ERROR_MESSAGE,
  ERROR_CATALOG,
  PUBLIC_ERROR_MESSAGES,
  isPublicErrorMessage,
};
