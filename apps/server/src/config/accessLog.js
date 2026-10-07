const morgan = require('morgan');
const logger = require('../utils/logger');

// Log akses memakai `:path` (req.path), bukan `:url`: query string request data
// berisi `search=<nama>` dan NIM, dan keduanya tidak boleh mendarat di file log.
function createAccessLogMiddleware() {
  morgan.token('path', (req) => req.path);
  return morgan(':method :path :status :res[content-length] - :response-time ms', {
    stream: { write: (message) => logger.info(message.trim()) },
  });
}

module.exports = { createAccessLogMiddleware };
