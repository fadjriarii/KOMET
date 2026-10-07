const { createClient } = require('redis');
const logger = require('../utils/logger');

const redisUrl = process.env.REDIS_URL?.trim();
const redisClient = redisUrl ? createClient({ url: redisUrl }) : null;

let redisUsable = false;

if (redisClient) {
  redisClient.on('error', (error) => {
    logger.error('[Redis] Connection error.', { error: error.message });
  });
  redisClient.on('ready', () => {
    redisUsable = true;
  });
  redisClient.on('end', () => {
    redisUsable = false;
  });
}

/**
 * Kebijakan degradasi store dinyatakan eksplisit, tidak diam-diam:
 * tanpa Redis, sesi dan rate limit menjadi per-proses — di PM2 cluster worker B
 * tidak mengenali sesi worker A dan budget rate limit terbagi rata ke semua worker.
 * Karena itu di production start ditolak kecuali operator mengizinkan degradasi
 * secara sadar lewat ALLOW_MEMORY_STORES=true.
 */
function memoryStoreAllowed() {
  if (process.env.NODE_ENV !== 'production') return true;
  return process.env.ALLOW_MEMORY_STORES === 'true';
}

async function connectRedis() {
  const degradable = memoryStoreAllowed();
  if (!redisClient) {
    if (!degradable) {
      throw new Error(
        'REDIS_URL wajib diisi di production. Set ALLOW_MEMORY_STORES=true hanya bila degradasi ke store in-process memang disengaja.',
      );
    }
    logger.warn(
      '[Redis] REDIS_URL tidak dikonfigurasi: sesi & rate limit disimpan di memori proses ini saja.',
    );
    return false;
  }
  if (redisClient.isOpen) return true;
  try {
    await redisClient.connect();
    redisUsable = true;
    logger.info('[Redis] Connected for distributed rate limiting and shared sessions.');
    return true;
  } catch (error) {
    if (!degradable) throw error;
    redisUsable = false;
    logger.error('[Redis] Gagal terhubung; berjalan dengan store in-process.', {
      error: error.message,
    });
    return false;
  }
}

async function disconnectRedis() {
  redisUsable = false;
  if (redisClient?.isOpen) await redisClient.quit();
}

module.exports = { redisClient, connectRedis, disconnectRedis, isRedisUsable: () => redisUsable };
