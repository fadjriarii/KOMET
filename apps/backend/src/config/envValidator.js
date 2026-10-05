const { z } = require('zod');
const logger = require('../utils/logger');

/**
 * Zod schema for backend environment variables.
 * Fail-fast: the server will NOT start if any required variable is missing.
 */
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'Koneksi database MySQL Prisma wajib diisi'),

  // SEVIMA API
  SEVIMA_APP_KEY: z.string().min(1, 'X-App-Key untuk autentikasi API SEVIMA wajib diisi'),
  SEVIMA_SECRET_KEY: z.string().min(1, 'X-Secret-Key untuk autentikasi API SEVIMA wajib diisi'),

  // Security
  SYNC_API_KEY: z.string().min(1, 'API Key untuk mengamankan endpoint /api/sync/* wajib diisi'),
  SESSION_SECRET: z.string().min(1, 'Secret untuk HttpOnly session Student Data wajib diisi'),

  // Optional with defaults
  PORT: z.string().optional().default('3000'),
  NODE_ENV: z.string().optional().default('development'),
  SLOW_QUERY_MS: z.string().optional().default('500'),
  ALLOWED_ORIGINS: z.string().optional().default('http://localhost:5173'),
  TRUST_PROXY: z.string().optional().default('false'),
  REDIS_URL: z.string().optional(),
});

/**
 * Validates process.env against the Zod schema.
 * Exits with code 1 on failure (fail-fast).
 */
function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    logger.error('❌ VALIDASI ENV GAGAL! Variabel lingkungan berikut bermasalah:\n' + formatted);
    console.error('\nSilakan periksa dan lengkapi file .env sebelum menjalankan server.\n');
    process.exit(1);
  }

  if (result.data.NODE_ENV === 'development') {
    logger.warn('⚠️  NODE_ENV = "development". Set ke "production" saat deploy!');
  }

  logger.info('🛡️  Validasi environment variables (.env) berhasil (Zod Fail-Fast check passed).');

  return result.data;
}

module.exports = validateEnv;
