const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { redisClient } = require('../config/redis');

function createStore(prefix) {
    if (!redisClient) return undefined;
    return new RedisStore({
        prefix,
        sendCommand: (...args) => redisClient.sendCommand(args),
    });
}

function createLimiter({ max, message, prefix }) {
    return rateLimit({
        windowMs: 60 * 1000,
        max,
        store: createStore(prefix),
        standardHeaders: true,
        legacyHeaders: false,
        message: { success: false, message },
    });
}

// Set REDIS_URL in clustered/PM2 deployments to share counters between workers.
// Local development intentionally uses the built-in memory store with no Redis
// service requirement.
const statsLimiter = createLimiter({
    max: 60,
    prefix: 'komet:rate-limit:stats:',
    message: 'Too many requests, please try again later.',
});

const syncLimiter = createLimiter({
    max: 5,
    prefix: 'komet:rate-limit:sync:',
    message: 'Sync rate limit exceeded. Please wait before syncing again.',
});

module.exports = { statsLimiter, syncLimiter };
