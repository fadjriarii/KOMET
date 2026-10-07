const { sendError, sendRejected, GENERIC_ERROR_MESSAGE } = require('../utils/errorHandler');
const prisma = require('../config/prisma');
const apiKeyAuth = require('../middlewares/auth');
const { sessionIssueLimiter, statusLimiter } = require('../middlewares/rateLimiter');
const { issueStudentSession, revokeStudentSession } = require('../middlewares/studentSession');

function registerApplicationRoutes(app) {
  // Sesi siswa adalah satu-satunya credential untuk route data mahasiswa. Penerbitannya
  // dibatasi keras per IP/sesi dan dikunci ke origin yang dipercaya (issueStudentSession).
  app.post('/api/session/student', sessionIssueLimiter, issueStudentSession);
  app.delete('/api/session/student', sessionIssueLimiter, revokeStudentSession);

  app.use('/', require('./rootRoutes'));

  // Loading these routers after Redis is ready prevents rate-limit-redis
  // from issuing commands against an offline client during process startup.
  app.use('/api/sync', require('./syncRoutes'));
  app.use('/api/students', require('./studentsRoutes'));
  app.use('/api/graduates', require('./graduatesRoutes'));
  app.use('/api/mbkm', require('./mbkmRoutes'));

  // Health detail (uptime + latensi DB) adalah fingerprint infrastruktur:
  // hanya layak untuk monitoring service-to-server dengan credential sync.
  app.get('/api/health', statusLimiter, apiKeyAuth, async (req, res) => {
    let dbStatus = 'ok';
    let dbLatencyMs = null;
    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - start;
    } catch {
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

  app.use((_req, res) => sendRejected(res, 404, 'Endpoint tidak ditemukan.'));

  app.use((err, req, res, _next) => {
    if (err.message?.startsWith('CORS:')) {
      return sendError(res, 403, 'Origin tidak diizinkan.', err, 'cors', 'FORBIDDEN');
    }
    const statusCode = Number.isInteger(err.statusCode)
      ? err.statusCode
      : Number.isInteger(err.status)
        ? err.status
        : 500;
    // Pesan dari dalam tidak pernah ikut ke client; hanya kode status + pesan katalog.
    return sendError(res, statusCode, GENERIC_ERROR_MESSAGE, err, 'global');
  });
}

module.exports = { registerApplicationRoutes };
