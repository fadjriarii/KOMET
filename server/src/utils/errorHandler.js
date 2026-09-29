const logger = require('./logger');
const TECHNICAL_ERROR_PATTERN = /(prisma|sql|constraint|column|table|stack|\bat\s+\w+\s*\()/i;

function safePublicMessage(message) {
    if (!message || TECHNICAL_ERROR_PATTERN.test(message)) {
        return 'Terjadi kesalahan pada server. Silakan coba lagi.';
    }
    return message;
}

/**
 * Helper terpusat untuk mengirim error response & logging.
 */
function sendError(res, statusCode, publicMessage, error, context = '') {
    // Log detail error ke server/file log (selalu lengkap dengan stack)
    const errObj = typeof error === 'string' ? new Error(error) : error;
    logger.error(`[${context}] ${errObj.message}`, { stack: errObj.stack });

    // Never expose database/stack details. Development retains the extra field
    // for diagnostics, while production only receives a safe public message.
    const isProduction = process.env.NODE_ENV === 'production';
    return res.status(statusCode).json({
        success: false,
        message: safePublicMessage(publicMessage),
        ...(isProduction ? {} : { error: errObj.message })
    });
}

module.exports = { sendError, safePublicMessage };
