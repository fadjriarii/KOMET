require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const hpp = require('hpp');
const validateEnv = require('./config/envValidator');
const logger = require('./utils/logger');
const { sendError } = require('./utils/errorHandler');
const prisma = require('./config/prisma');
const { connectRedis, disconnectRedis } = require('./config/redis');
const { issueStudentSession, revokeStudentSession } = require('./middlewares/studentSession');

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

// 1. Validasi Environment Variables saat Startup (Fail-Fast)
validateEnv();

const app = express();
const PORT = process.env.PORT || 3000;

// `req.ip` is used by rate limiting. Trust only the explicitly configured
// number of reverse-proxy hops; direct/local deployments remain untrusted.
const trustProxy = process.env.TRUST_PROXY;
if (trustProxy && trustProxy !== 'false') {
  const proxyHops = Number.parseInt(trustProxy, 10);
  app.set('trust proxy', Number.isInteger(proxyHops) && proxyHops >= 0 ? proxyHops : trustProxy);
}

// Security & Utility Middlewares: Helmet & HPP
app.use(helmet());
app.use(hpp());

// HTTP Request Logger (Morgan terintegrasi dengan Winston)
const morganStream = { write: (message) => logger.info(message.trim()) };
app.use(
  morgan(':method :url :status :res[content-length] - :response-time ms', { stream: morganStream }),
);

// 2. Global Middlewares (CORS Whitelist & Request Timeout)
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:3001'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS: Origin ${origin} tidak diizinkan`));
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'x-api-key', 'Authorization'],
    credentials: true,
  }),
);

// Request Timeout: 30 detik
app.use((req, res, next) => {
  const TIMEOUT_MS = 30000;
  res.setTimeout(TIMEOUT_MS, () => {
    logger.warn(
      `[Timeout] Request ${req.method} ${req.originalUrl} timeout setelah ${TIMEOUT_MS}ms`,
    );
    if (!res.headersSent) {
      res.status(503).json({
        success: false,
        message: 'Request timeout. Server sedang mengalami beban tinggi.',
      });
    }
  });
  next();
});

app.use(express.json());
app.post('/api/session/student', issueStudentSession);
app.delete('/api/session/student', revokeStudentSession);

function registerApplicationRoutes() {
  // Loading these routers after Redis is ready prevents rate-limit-redis
  // from issuing commands against an offline client during process startup.
  app.use('/api/sync', require('./routes/syncRoutes'));
  app.use('/api/students', require('./routes/studentsRoutes'));
  app.use('/api/graduates', require('./routes/graduatesRoutes'));
  app.use('/api/mbkm', require('./routes/mbkmRoutes'));

  app.get('/api/health', async (req, res) => {
    let dbStatus = 'ok';
    let dbLatencyMs = null;
    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - start;
    } catch (error) {
      dbStatus = 'error';
    }
    const isHealthy = dbStatus === 'ok';
    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'OK' : 'DEGRADED',
      uptime: process.uptime(),
      timestamp: new Date(),
      database: { status: dbStatus, latencyMs: dbLatencyMs },
    });
  });

  app.use((req, res) =>
    res.status(404).json({
      success: false,
      message: `Endpoint tidak ditemukan: ${req.method} ${req.originalUrl}`,
    }),
  );

  app.use((err, req, res, next) => {
    if (err.message?.startsWith('CORS:')) {
      return sendError(res, 403, err.message, err, 'cors');
    }
    const statusCode = Number.isInteger(err.statusCode)
      ? err.statusCode
      : Number.isInteger(err.status)
        ? err.status
        : 500;
    const publicMessage = statusCode >= 500 ? 'Terjadi kesalahan internal server.' : err.message;
    return sendError(res, statusCode, publicMessage, err, 'global');
  });
}

// 3. Menjalankan Server & Graceful Shutdown
let server;

async function startServer() {
  // A configured Redis backend is mandatory: silently falling back to local
  // counters would make a clustered production deployment bypassable.
  await connectRedis();
  registerApplicationRoutes();
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
