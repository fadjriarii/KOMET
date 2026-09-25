const crypto = require('crypto');
const logger = require('../utils/logger');

function authenticateApiKey(req) {
    const apiKeyHeader = req.headers['x-api-key'];
    const authHeader = req.headers['authorization'];
    
    let providedKey = apiKeyHeader;
    if (!providedKey && authHeader && authHeader.startsWith('Bearer ')) {
        providedKey = authHeader.substring(7).trim();
    }

    const expectedKey = process.env.SYNC_API_KEY;

    if (!expectedKey) {
        logger.error('SYNC_API_KEY belum dikonfigurasi di environment!');
        return false;
    }

    let isValid = false;
    if (providedKey) {
        const providedBuf = Buffer.from(providedKey);
        const expectedBuf = Buffer.from(expectedKey);

        if (providedBuf.length === expectedBuf.length) {
            isValid = crypto.timingSafeEqual(providedBuf, expectedBuf);
        }
    }

    if (isValid) {
        return true;
    }

    // Masking: gunakan req.path agar query params sensitif tidak bocor ke log file
    const sanitizedUrl = req.path || req.baseUrl || req.originalUrl;
    logger.warn(`Unauthorized access attempt to ${req.method} ${sanitizedUrl} from IP: ${req.ip}`);
    return false;
}

function apiKeyAuth(req, res, next) {
    if (authenticateApiKey(req)) return next();
    if (!process.env.SYNC_API_KEY) return res.status(500).json({ success: false, message: 'Server configuration error.' });
    return res.status(401).json({
        success: false,
        message: 'Unauthorized access. Valid x-api-key header or Bearer token is required.'
    });
}

module.exports = apiKeyAuth;
module.exports.authenticateApiKey = authenticateApiKey;
