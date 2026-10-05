const { createClient } = require('redis');
const logger = require('../utils/logger');

const redisUrl = process.env.REDIS_URL?.trim();
const redisClient = redisUrl ? createClient({ url: redisUrl }) : null;

if (redisClient) {
  redisClient.on('error', (error) => {
    logger.error('[Redis] Connection error.', { error: error.message });
  });
}

async function connectRedis() {
  if (!redisClient || redisClient.isOpen) return;
  await redisClient.connect();
  logger.info('[Redis] Connected for distributed rate limiting.');
}

async function disconnectRedis() {
  if (redisClient?.isOpen) await redisClient.quit();
}

module.exports = { redisClient, connectRedis, disconnectRedis };
