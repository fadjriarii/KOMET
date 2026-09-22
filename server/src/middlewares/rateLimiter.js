const rateLimit = require('express-rate-limit');

// Rate limiter untuk endpoint stats & analytics (lebih longgar)
const statsLimiter = rateLimit({
    windowMs: 60 * 1000,     // 1 menit
    max: 60,                  // maks 60 request/menit per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' }
});

// Rate limiter untuk endpoint sync (lebih ketat, proses berat)
const syncLimiter = rateLimit({
    windowMs: 60 * 1000,     // 1 menit
    max: 5,                   // maks 5 request/menit per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Sync rate limit exceeded. Please wait before syncing again.' }
});

module.exports = { statsLimiter, syncLimiter };
