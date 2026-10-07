const logger = require('./logger');
const { GENERIC_ERROR_MESSAGE, ERROR_CATALOG, isPublicErrorMessage } = require('./errorCatalog');
const { HTTP_STATUS } = require('@komet/shared/constants');

/**
 * Pesan yang boleh keluar ke client hanya yang terdaftar di errorCatalog (allowlist).
 * Apa pun yang tidak dikenal digantikan pesan generik; detailnya tetap masuk log server.
 */
function safePublicMessage(message) {
  return isPublicErrorMessage(message) ? message : GENERIC_ERROR_MESSAGE;
}

/**
 * Helper terpusat untuk mengirim error response & logging.
 *
 * Format response standar:
 * { success: false, statusCode, code, message }
 *
 * Field `error` hanya dikirim bila `EXPOSE_ERROR_DETAILS=true` secara eksplisit
 * (never di production) supaya diagnostik dev tidak jadi jalur kebocoran default.
 */
function sendError(res, statusCode, publicMessage, error, context = '', code = null) {
  const errObj = typeof error === 'string' ? new Error(error) : error;
  logger.error(`[${context}] ${errObj?.message}`, { stack: errObj?.stack });

  const message = safePublicMessage(publicMessage);
  if (message !== publicMessage) {
    logger.warn(
      `[errorCatalog] Pesan error tidak terdaftar diblok dari respons: ${JSON.stringify(String(publicMessage)).slice(0, 200)}`,
    );
  }

  // Timeout/CORS bisa mengirim respons lebih dulu; mengirim lagi akan melempar
  // ERR_HTTP_HEADERS_SENT yang berubah menjadi crash proses lewat uncaughtException.
  if (res.headersSent) {
    logger.warn(`[${context}] Respons sudah dikirim sebelumnya; error hanya di-log.`);
    return res;
  }

  const exposeDetails = process.env.EXPOSE_ERROR_DETAILS === 'true';

  return res.status(statusCode).json({
    success: false,
    statusCode,
    code: code || getErrorCodeFromStatus(statusCode),
    message,
    ...(exposeDetails ? { error: errObj?.message } : {}),
  });
}

/**
 * Controller mengirim KODE, bukan angka status dan string yang disalin ulang:
 * status + pesan publik diambil dari `ERROR_CATALOG`. Kode yang tidak dikenal
 * melempar — gagal keras saat development lebih murah daripada mengirim pesan
 * yang tidak pernah didaftarkan lalu diam-diam tampil sebagai pesan generik.
 */
function sendServerError(res, code, error, context = '') {
  const entry = ERROR_CATALOG[code];
  if (!entry) throw new Error(`Kode error tidak terdaftar di errorCatalog: ${code}`);
  return sendError(res, entry.statusCode, entry.message, error, context, code);
}

/**
 * Respons penolakan sederhana (401/403/404/429/500 konfigurasi) dengan sampul error
 * standar. Pesan harus tetap terdaftar di allowlist; tidak ada logging stack karena
 * ini penolakan yang memang diharapkan, bukan kegagalan tak terduga.
 */
function sendRejected(res, statusCode, message, code = null, extra = null) {
  if (res.headersSent) return res;
  return res.status(statusCode).json({
    success: false,
    statusCode,
    code: code || getErrorCodeFromStatus(statusCode),
    message: safePublicMessage(message),
    ...(extra || {}),
  });
}

/**
 * Kode error mesin per status HTTP. Angkanya tidak ditulis ulang di sini —
 * sumbernya `HTTP_STATUS` yang juga dibaca client.
 */
const ERROR_CODE_BY_STATUS = {
  [HTTP_STATUS.BAD_REQUEST]: 'BAD_REQUEST',
  [HTTP_STATUS.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HTTP_STATUS.FORBIDDEN]: 'FORBIDDEN',
  [HTTP_STATUS.NOT_FOUND]: 'NOT_FOUND',
  [HTTP_STATUS.TOO_MANY_REQUESTS]: 'RATE_LIMITED',
  [HTTP_STATUS.INTERNAL_SERVER_ERROR]: 'INTERNAL_ERROR',
  [HTTP_STATUS.SERVICE_UNAVAILABLE]: 'SERVICE_UNAVAILABLE',
};

/**
 * Map HTTP status code to machine-readable error code.
 */
function getErrorCodeFromStatus(statusCode) {
  return ERROR_CODE_BY_STATUS[statusCode] || 'UNKNOWN_ERROR';
}

module.exports = {
  sendError,
  sendServerError,
  sendRejected,
  safePublicMessage,
  getErrorCodeFromStatus,
  GENERIC_ERROR_MESSAGE,
};
