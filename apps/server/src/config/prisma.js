require('dotenv').config({ quiet: true });

const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
const logger = require('../utils/logger');
const { logSlowQuery } = require('./slowQueryLog');

// Prisma 7 mewajibkan driver adapter. Unit test tidak pernah membuka koneksi,
// jadi URL fallback menjaga konstruksi tetap jalan tanpa apps/server/.env (CI).
const adapter = new PrismaMariaDb(
  process.env.DATABASE_URL || 'mysql://localhost:3306/komet_placeholder',
);

const prisma = new PrismaClient({
  adapter,
  // warn/error di-emit sebagai event supaya lewat winston: terstruktur dan bisa
  // disanitasi. `stdout` membuat pesan Prisma menembus log mentah tanpa filter.
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'warn' },
    { emit: 'event', level: 'error' },
  ],
});

prisma.$on('query', logSlowQuery);

prisma.$on('warn', (event) => logger.warn('[Prisma warn]', { message: event.message }));
prisma.$on('error', (event) => logger.error('[Prisma error]', { message: event.message }));

module.exports = prisma;
