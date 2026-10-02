const crypto = require('crypto');
const { redisClient } = require('../config/redis');

const memorySessions = new Map();
const prefix = 'komet:student-session:';

function keyFor(token) {
    return `${prefix}${crypto.createHash('sha256').update(token).digest('hex')}`;
}

function pruneExpiredSessions(now = Date.now()) {
    for (const [key, expiresAt] of memorySessions) {
        if (expiresAt <= now) memorySessions.delete(key);
    }
}

async function createSession(token, ttlSeconds) {
    const key = keyFor(token);
    if (redisClient?.isOpen) {
        await redisClient.set(key, '1', { EX: ttlSeconds });
        return;
    }
    pruneExpiredSessions();
    memorySessions.set(key, Date.now() + ttlSeconds * 1000);
}

async function hasSession(token) {
    const key = keyFor(token);
    if (redisClient?.isOpen) return (await redisClient.exists(key)) === 1;
    const expiresAt = memorySessions.get(key);
    if (!expiresAt || expiresAt <= Date.now()) {
        memorySessions.delete(key);
        return false;
    }
    return true;
}

async function revokeSession(token) {
    const key = keyFor(token);
    if (redisClient?.isOpen) await redisClient.del(key);
    memorySessions.delete(key);
}

module.exports = { createSession, hasSession, revokeSession };
