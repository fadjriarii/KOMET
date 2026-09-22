require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const hpp = require('hpp');
const validateEnv = require('./config/envValidator');
const logger = require('./utils/logger');
const prisma = require('./config/prisma');

// Handler Global untuk Unhandled Rejection & Uncaught Exception (mencegah silent crash)
process.on('unhandledRejection', (reason, promise) => {
    logger.error('[Process] Unhandled Rejection:', { reason: reason?.message || reason, stack: reason?.stack });
});

process.on('uncaughtException', (error) => {
    logger.error('[Process] Uncaught Exception — Server akan dihentikan:', { error: error.message, stack: error.stack });
    process.exit(1);
});

// 1. Validasi Environment Variables saat Startup (Fail-Fast)
validateEnv();

const app = express();
const PORT = process.env.PORT || 3000;

// Security & Utility Middlewares: Helmet & HPP
app.use(helmet());
app.use(hpp());

// HTTP Request Logger (Morgan terintegrasi dengan Winston)
const morganStream = { write: (message) => logger.info(message.trim()) };
app.use(morgan(':method :url :status :res[content-length] - :response-time ms', { stream: morganStream }));

// 2. Global Middlewares (CORS Whitelist & Request Timeout)
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:5173', 'http://localhost:3001'];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`CORS: Origin ${origin} tidak diizinkan`));
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'x-api-key', 'Authorization']
}));

// Request Timeout: 30 detik
app.use((req, res, next) => {
    const TIMEOUT_MS = 30000;
    res.setTimeout(TIMEOUT_MS, () => {
        logger.warn(`[Timeout] Request ${req.method} ${req.originalUrl} timeout setelah ${TIMEOUT_MS}ms`);
        if (!res.headersSent) {
            res.status(503).json({
                success: false,
                message: 'Request timeout. Server sedang mengalami beban tinggi.'
            });
        }
    });
    next();
});

app.use(express.json());

// 3. Daftarkan Routes Sinkronisasi, Mahasiswa (Students), Kelulusan (Graduates), & MBKM
const syncRoutes = require('./routes/syncRoutes');
const studentsRoutes = require('./routes/studentsRoutes');
const graduatesRoutes = require('./routes/graduatesRoutes');
const mbkmRoutes = require('./routes/mbkmRoutes');

app.use('/api/sync', syncRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/graduates', graduatesRoutes);
app.use('/api/mbkm', mbkmRoutes);

// 4. Health Check Route (dengan Database Check)
app.get('/api/health', async (req, res) => {
    let dbStatus = 'ok';
    let dbLatencyMs = null;
    try {
        const start = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        dbLatencyMs = Date.now() - start;
    } catch (e) {
        dbStatus = 'error';
    }

    const isHealthy = dbStatus === 'ok';
    res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? 'OK' : 'DEGRADED',
        uptime: process.uptime(),
        timestamp: new Date(),
        database: { status: dbStatus, latencyMs: dbLatencyMs }
    });
});

// 5. 404 Handler — untuk route yang tidak ditemukan
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Endpoint tidak ditemukan: ${req.method} ${req.originalUrl}`
    });
});

// 6. Global Error Handler — menangkap unhandled error dari Express
app.use((err, req, res, next) => {
    // CORS error — security block yang diharapkan, log sebagai warn bukan error
    if (err.message && err.message.startsWith('CORS:')) {
        logger.warn(`[CORS] ${err.message}`);
        return res.status(403).json({ success: false, message: err.message });
    }
    logger.error(`[GlobalErrorHandler] Unhandled error: ${err.message}`, { stack: err.stack });
    const isProduction = process.env.NODE_ENV === 'production';
    res.status(err.status || 500).json({
        success: false,
        message: isProduction ? 'Terjadi kesalahan internal server.' : err.message
    });
});

// 7. Menjalankan Server & Graceful Shutdown
const server = app.listen(PORT, () => {
    logger.success(`🚀 Server Komet berjalan di http://localhost:${PORT}`);
});

async function gracefulShutdown(signal) {
    logger.info(`🛑 Menerima signal ${signal}. Memulai graceful shutdown...`);
    server.close(async () => {
        logger.info('✅ HTTP server ditutup. Menutup koneksi database...');
        await prisma.$disconnect();
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