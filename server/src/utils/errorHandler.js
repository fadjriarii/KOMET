const logger = require('./logger');
const TECHNICAL_ERROR_PATTERN = /(prisma|sql|constraint|column|table|stack|\bat\s+\w+\s*\()/i;

/**
 * Generate a safe public error message.
 * Never expose database details, stack traces, or internal implementation info.
 */
function safePublicMessage(message) {
    if (!message || TECHNICAL_ERROR_PATTERN.test(message)) {
        return 'Terjadi kesalahan pada server. Silakan coba lagi.';
    }
    return message;
}

/**
 * Helper terpusat untuk mengirim error response & logging.
 * 
 * Format response standar:
 * {
 *   success: false,
 *   statusCode: number,
 *   code: string,
 *   message: string
 * }
 * 
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} publicMessage - User-friendly error message
 * @param {Error|string} error - Original error for logging
 * @param {string} context - Context for logging
 * @param {string} code - Machine-readable error code (optional)
 */
function sendError(res, statusCode, publicMessage, error, context = '', code = null) {
    // Log detail error ke server/file log (selalu lengkap dengan stack)
    const errObj = typeof error === 'string' ? new Error(error) : error;
    logger.error(`[${context}] ${errObj.message}`, { stack: errObj.stack });

    // Never expose database/stack details in staging or production.
    // Only development retains the extra diagnostic field.
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    const errorCode = code || getErrorCodeFromStatus(statusCode);
    
    return res.status(statusCode).json({
        success: false,
        statusCode,
        code: errorCode,
        message: safePublicMessage(publicMessage),
        ...(isDevelopment ? { error: errObj.message } : {})
    });
}

/**
 * Map HTTP status code to machine-readable error code.
 */
function getErrorCodeFromStatus(statusCode) {
    switch (statusCode) {
        case 400: return 'BAD_REQUEST';
        case 401: return 'UNAUTHORIZED';
        case 403: return 'FORBIDDEN';
        case 404: return 'NOT_FOUND';
        case 429: return 'RATE_LIMITED';
        case 500: return 'INTERNAL_ERROR';
        case 503: return 'SERVICE_UNAVAILABLE';
        default: return 'UNKNOWN_ERROR';
    }
}

module.exports = { sendError, safePublicMessage, getErrorCodeFromStatus };
