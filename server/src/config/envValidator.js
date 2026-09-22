const logger = require('../utils/logger');

const requiredEnvVars = [
    { key: 'DATABASE_URL', description: 'Koneksi database MySQL Prisma' },
    { key: 'SEVIMA_APP_KEY', description: 'X-App-Key untuk autentikasi API SEVIMA' },
    { key: 'SEVIMA_SECRET_KEY', description: 'X-Secret-Key untuk autentikasi API SEVIMA' },
    { key: 'SYNC_API_KEY', description: 'API Key untuk mengamankan endpoint /api/sync/*' }
];

function validateEnv() {
    const missing = [];

    for (const envVar of requiredEnvVars) {
        const val = process.env[envVar.key];
        if (!val || val.trim() === '') {
            missing.push(`- ${envVar.key}: ${envVar.description}`);
        }
    }

    if (missing.length > 0) {
        logger.error('❌ VALIDASI ENV GAGAL! Variabel lingkungan berikut belum dikonfigurasi di file .env:\n' + missing.join('\n'));
        console.error('\nSilakan periksa dan lengkapi file .env sebelum menjalankan server.\n');
        process.exit(1);
    }

    if (!process.env.NODE_ENV) {
        logger.warn('⚠️  NODE_ENV tidak diset. Default ke "development". Set ke "production" saat deploy!');
    }

    logger.info('🛡️  Validasi environment variables (.env) berhasil (Fail-Fast check passed).');
}

module.exports = validateEnv;
