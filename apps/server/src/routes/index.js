const { sendError } = require('../utils/errorHandler');
const prisma = require('../config/prisma');
const { issueStudentSession, revokeStudentSession } = require('../middlewares/studentSession');

function registerApplicationRoutes(app) {
  app.post('/api/session/student', issueStudentSession);
  app.delete('/api/session/student', revokeStudentSession);

  app.use('/', require('./rootRoutes'));

  // Loading these routers after Redis is ready prevents rate-limit-redis
  // from issuing commands against an offline client during process startup.
  app.use('/api/sync', require('./syncRoutes'));
  app.use('/api/students', require('./studentsRoutes'));
  app.use('/api/graduates', require('./graduatesRoutes'));
  app.use('/api/mbkm', require('./mbkmRoutes'));

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

module.exports = { registerApplicationRoutes };
