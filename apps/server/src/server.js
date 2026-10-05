const app = require('./app');
const logger = require('./utils/logger');
const prisma = require('./config/prisma');
const { connectRedis, disconnectRedis } = require('./config/redis');
const { registerApplicationRoutes } = require('./routes');

const PORT = process.env.PORT || 3000;

// Handler Global untuk Unhandled Rejection & Uncaught Exception (mencegah silent crash)
process.on('unhandledRejection', (reason, promise) => {
  logger.error('[Process] Unhandled Rejection:', {
    reason: reason?.message || reason,
    stack: reason?.stack,
  });
});

process.on('uncaughtException', (error) => {
  logger.error('[Process] Uncaught Exception — Server akan dihentikan:', {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

// 3. Menjalankan Server & Graceful Shutdown
let server;

async function startServer() {
  // A configured Redis backend is mandatory: silently falling back to local
  // counters would make a clustered production deployment bypassable.
  await connectRedis();
  registerApplicationRoutes(app);
  server = app.listen(PORT, () => {
    logger.success(`🚀 Server Komet berjalan di http://localhost:${PORT}`);
  });
}

async function gracefulShutdown(signal) {
  logger.info(`🛑 Menerima signal ${signal}. Memulai graceful shutdown...`);
  if (!server) {
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

  setTimeout(() => {
    logger.error('⚠️ Graceful shutdown timeout. Force exit.');
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
