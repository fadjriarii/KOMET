const sevimaApi = require('../../config/sevimaApi');

const checkConnection = async (req, res) => {
  const startTime = Date.now();
  try {
    await sevimaApi.get('/siakadcloud/v1/program-studi', {
      timeout: 10000,
      params: { limit: 1 },
    });
    const latencyMs = Date.now() - startTime;
    return res.status(200).json({
      success: true,
      status: 'CONNECTED',
      latencyMs,
      endpoint: 'https://api.sevimaplatform.com/siakadcloud/v1/*',
      timestamp: new Date().toISOString(),
      message: 'Koneksi ke SEVIMA Cloud API berhasil dan stabil.',
    });
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const isRateLimit = error.response?.status === 429;
    return res.status(200).json({
      success: false,
      status: isRateLimit ? 'RATE_LIMITED' : 'DISCONNECTED',
      latencyMs,
      endpoint: 'https://api.sevimaplatform.com/siakadcloud/v1/*',
      timestamp: new Date().toISOString(),
      message:
        error.response?.data?.message || error.message || 'Gagal terhubung ke SEVIMA Cloud API.',
    });
  }
};

module.exports = checkConnection;
