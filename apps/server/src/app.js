require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const hpp = require('hpp');
const validateEnv = require('./config/envValidator');
const logger = require('./utils/logger');

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

// Static assets for the landing page (animations, css, js, vendor)
app.use(express.static(path.join(__dirname, '..', 'public')));

module.exports = app;
