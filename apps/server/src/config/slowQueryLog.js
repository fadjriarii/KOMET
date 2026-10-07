const logger = require('../utils/logger');

const slowQueryMs = Number(process.env.SLOW_QUERY_MS || 500);

// Hanya template query + durasi. `event.params` berisi nilai bound (NIM, nama)
// dan tidak boleh masuk log.
function logSlowQuery(event) {
  if (event.duration < slowQueryMs) return;
  logger.warn('[SlowQuery]', {
    durationMs: event.duration,
    query: event.query.slice(0, 500),
  });
}

module.exports = { logSlowQuery, slowQueryMs };
