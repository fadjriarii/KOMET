const logger = require('./logger');
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Helper terpusat untuk mengirim error response & logging.
 */
function sendError(res, statusCode, publicMessage, error, context = '') {
    // Log detail error ke server/file log (selalu lengkap dengan stack)
    const errObj = typeof error === 'string' ? new Error(error) : error;
    logger.error(`[${context}] ${errObj.message}`, { stack: errObj.stack });

    // Response ke client: detail error hanya ditampilkan pada environment non-production
    return res.status(statusCode).json({
        success: false,
        message: publicMessage,
        ...(IS_PRODUCTION ? {} : { error: errObj.message })
    });
}

module.exports = { sendError };
