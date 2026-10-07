require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const hpp = require('hpp');
const validateEnv = require('./config/envValidator');
const { createAccessLogMiddleware } = require('./config/accessLog');
const { isAllowedOrigin } = require('./config/corsPolicy');
const logger = require('./utils/logger');
const { sessionIdentity } = require('./middlewares/sessionIdentity');
const { SERVER_REQUEST_TIMEOUT_MS } = require('@komet/shared/constants');

// 1. Validasi Environment Variables saat Startup (Fail-Fast)
validateEnv();

const app = express();

// `req.ip` is used by rate limiting. Trust only the explicitly configured
// number of reverse-proxy hops; direct/local deployments remain untrusted.
const trustProxy = process.env.TRUST_PROXY;
if (trustProxy && trustProxy !== 'false') {
  const proxyHops = Number.parseInt(trustProxy, 10);
  app.set('trust proxy', Number.isInteger(proxyHops) && proxyHops >= 0 ? proxyHops : trustProxy);
}

// Security & Utility Middlewares: Helmet & HPP
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
      },
    },
  }),
);
app.use(hpp());

// Parser query 'simple': satu sintaks untuk satu arti — `key=value`, dan kunci yang
// diulang menjadi array. Default 'extended' (qs) juga menerima `fakultas[]=x` dan
// `fakultas[a]=x`, sehingga ada dua cara mengirim filter yang sama (dan cara ketiga
// untuk menyuntik objek) sementara client tidak pernah memakai bentuk itu.
app.set('query parser', 'simple');

// HTTP Request Logger (Morgan terintegrasi dengan Winston) — bentuk barisnya
// dikunci tests/unit/config/logPii.test.js.
app.use(createAccessLogMiddleware());

// Bucket rate-limit per identitas sesi harus tersedia sebelum limiter mana pun jalan.
app.use(sessionIdentity);

// 2. Global Middlewares (CORS Whitelist & Request Timeout)
app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) return callback(null, true);
      return callback(new Error(`CORS: Origin ${origin} tidak diizinkan`));
    },
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'x-api-key', 'Authorization'],
    credentials: true,
  }),
);

// Sinyal abort diberikan ke handler supaya pekerjaan lanjutan bisa berhenti, dan
// sendError tidak menulis ke respons yang sudah terkirim.
// ponytail: query Prisma yang sedang berjalan tidak bisa dibatalkan dari sisi client.
// upgrade path = timeout per-query pada Prisma / kill connection di DB.
app.use((req, res, next) => {
  const controller = new AbortController();
  req.signal = controller.signal;
  res.setTimeout(SERVER_REQUEST_TIMEOUT_MS, () => {
    controller.abort(new Error('Request timeout'));
    logger.warn(
      `[Timeout] Request ${req.method} ${req.path} timeout setelah ${SERVER_REQUEST_TIMEOUT_MS}ms`,
    );
    if (!res.headersSent) {
      res.status(503).json({
        success: false,
        statusCode: 503,
        code: 'SERVICE_UNAVAILABLE',
        message: 'Request timeout. Server sedang mengalami beban tinggi.',
      });
    }
  });
  next();
});

app.use(express.json());

// Static assets for the landing page (animations, css, js, vendor)
app.use(express.static(path.join(__dirname, '..', 'public')));

module.exports = app;
