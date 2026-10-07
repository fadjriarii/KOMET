const sevimaApi = require('../../config/sevimaApi');
const logger = require('../../utils/logger');

const SEVIMA_ENDPOINT = 'https://api.sevimaplatform.com/siakadcloud/v1/*';

const checkConnection = async (req, res) => {
  const startTime = Date.now();
  try {
    await sevimaApi.get('/siakadcloud/v1/program-studi', {
      timeout: 10000,
      params: { limit: 1 },
    });
    return res.json({
      success: true,
      status: 'CONNECTED',
      latencyMs: Date.now() - startTime,
      endpoint: SEVIMA_ENDPOINT,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Pesan axios bisa memuat URL/credential; detailnya hanya untuk log server.
    logger.warn('[checkConnection] SEVIMA tidak terjangkau.', {
      status: error.response?.status,
      detail: error.message,
    });
    return res.json({
      success: false,
      status: error.response?.status === 429 ? 'RATE_LIMITED' : 'DISCONNECTED',
      latencyMs: Date.now() - startTime,
      endpoint: SEVIMA_ENDPOINT,
      timestamp: new Date().toISOString(),
    });
  }
};

module.exports = checkConnection;
