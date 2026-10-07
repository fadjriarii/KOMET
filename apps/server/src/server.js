const app = require('./app');
const logger = require('./utils/logger');
const prisma = require('./config/prisma');
const { connectRedis, disconnectRedis } = require('./config/redis');
const { registerApplicationRoutes } = require('./routes');

const PORT = process.env.PORT || 3000;

// Handler Global untuk Unhandled Rejection & Uncaught Exception (mencegah silent crash)
process.on('unhandledRejection', (reason, _promise) => {
  logger.error('[Process] Unhandled Rejection:', {
    reason: reason?.message || reason,
    stack: reason?.stack,
  });
});

// Kegagalan socket per-connection tidak membuat state proses jadi tidak konsisten;
// matikan proses hanya untuk error yang benar-benar tidak terisolasi.
const SOCKET_LEVEL_ERRORS =
  /^(ECONNRESET|EPIPE|ECANCELED|ERR_STREAM_PREMATURE_CLOSE|ECONNABORTED)$/;

process.on('uncaughtException', (error) => {
  logger.error('[Process] Uncaught Exception:', { error: error.message, stack: error.stack });
  if (SOCKET_LEVEL_ERRORS.test(error.code || '')) {
    logger.warn('[Process] Error tingkat socket — proses dilanjutkan.');
    return;
  }
  process.exit(1);
});

// 3. Menjalankan Server & Graceful Shutdown
let server;

async function startServer() {
  // Redis dipakai untuk sesi + rate limit yang dibagikan antar worker. Bila tidak
  // dikonfigurasi, server berjalan dengan store in-process: diterima di development,
  // ditolak di production kecuali degradasi diizinkan eksplisit (lihat config/redis.js).
  await connectRedis();
  registerApplicationRoutes(app);
  server = app.listen(PORT, () => {
    logger.success(`🚀 Server Komet berjalan di http://localhost:${PORT}`);
  });
}

async function gracefulShutdown(signal) {
  logger.info(`🛑 Menerima signal ${signal}. Memulai graceful shutdown...`);
  if (!server) {
    await prisma.$disconnect().catch(() => {});
    await disconnectRedis();
    process.exit(0);
    return;
  }
  server.close(async () => {
    logger.info('✅ HTTP server ditutup. Menutup koneksi database...');
    await prisma.$disconnect();
    await disconnectRedis();
    logger.info('✅ Koneksi database ditutup. Server berhenti dengan bersih.');
    process.exit(0);
  });

  setTimeout(async () => {
    logger.error('⚠️ Graceful shutdown timeout. Force exit.');
    await prisma.$disconnect().catch(() => {});
    await disconnectRedis().catch(() => {});
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer().catch(async (error) => {
  logger.error('[Startup] Server gagal dijalankan.', { error: error.message, stack: error.stack });
  await disconnectRedis();
  process.exit(1);
});
