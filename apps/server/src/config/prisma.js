const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const { logSlowQuery } = require('./slowQueryLog');

const prisma = new PrismaClient({
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
