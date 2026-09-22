const axios = require('axios');
const logger = require('../utils/logger');

const sevimaApi = axios.create({
    baseURL: 'https://api.sevimaplatform.com',
    timeout: 20000, // 20 detik timeout untuk mencegah hanging request
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor request untuk menyisipkan header auth yang paling fresh dari process.env
sevimaApi.interceptors.request.use(
    (config) => {
        config.headers['X-App-Key'] = process.env.SEVIMA_APP_KEY;
        config.headers['X-Secret-Key'] = process.env.SEVIMA_SECRET_KEY;
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor response untuk menangani rate limit 429 dan retry backoff
sevimaApi.interceptors.response.use(
    (response) => response,
    async (error) => {
        const config = error.config;
        if (!config) return Promise.reject(error);

        config.__retryCount = config.__retryCount || 0;

        // Tangani status 429 (Rate Limit) dan timeout ECONNABORTED
        const isRateLimit = error.response && error.response.status === 429;
        const isTimeout = error.code === 'ECONNABORTED' || (error.message && error.message.includes('timeout'));

        if ((isRateLimit || isTimeout) && config.__retryCount < 8) {
            config.__retryCount += 1;
            const delayMs = config.__retryCount * 2500;
            logger.warn(`⏳ [SEVIMA API Retry] ${isRateLimit ? 'Rate limit (429)' : 'Timeout'} pada ${config.url}. Menunggu ${delayMs}ms (Percobaan ${config.__retryCount}/8)...`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            return sevimaApi(config);
        }

        return Promise.reject(error);
    }
);

module.exports = sevimaApi;