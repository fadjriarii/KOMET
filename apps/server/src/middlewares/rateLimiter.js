const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { redisClient, isRedisUsable } = require('../config/redis');

function createStore(prefix) {
  if (!redisClient || !isRedisUsable()) return undefined;
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
    // Bucket per identitas sesi bila token-nya sah, kalau tidak per IP (lihat sessionIdentity).
    // ipKeyGenerator menyatukan klien IPv6 per subnet agar tidak lolos kuota.
    keyGenerator: (req) => req.authSubject || ipKeyGenerator(req.ip),
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

// /summary memicu 15-25 query per panggilan, jadi tidak boleh dapat jatah yang sama
// dengan endpoint ringan seperti /list atau /filter-options.
const summaryLimiter = createLimiter({
  max: 20,
  prefix: 'komet:rate-limit:summary:',
  message: 'Terlalu banyak permintaan ringkasan. Silakan tunggu sebentar.',
});

// Polling progres sinkronisasi hanya membaca state di memori; budget sendiri supaya
// tidak memakan jatah statsLimiter yang dipakai dashboard.
const statusLimiter = createLimiter({
  max: 120,
  prefix: 'komet:rate-limit:status:',
  message: 'Terlalu banyak permintaan status sinkronisasi.',
});

const syncLimiter = createLimiter({
  max: 5,
  prefix: 'komet:rate-limit:sync:',
  message: 'Sync rate limit exceeded. Please wait before syncing again.',
});

// Penerbitan sesi dibatasi keras: tanpa batas ini satu IP bisa membanjiri session
// store dengan ribuan sesi valid dalam hitungan menit.
const sessionIssueLimiter = createLimiter({
  max: 10,
  prefix: 'komet:rate-limit:session:',
  message: 'Terlalu banyak permintaan sesi. Silakan coba lagi.',
});

module.exports = { statsLimiter, summaryLimiter, statusLimiter, syncLimiter, sessionIssueLimiter };
