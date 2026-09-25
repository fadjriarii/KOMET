const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const slowQueryMs = Number(process.env.SLOW_QUERY_MS || 500);

const prisma = new PrismaClient({
    log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' }
    ]
});

prisma.$on('query', (event) => {
    if (event.duration >= slowQueryMs) {
        logger.warn('[SlowQuery]', {
            durationMs: event.duration,
            query: event.query.slice(0, 500),
            params: event.params
        });
    }
});

module.exports = prisma;
