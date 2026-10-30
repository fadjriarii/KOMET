/**
 * Dispatcher controller untuk endpoint statistik & tabel MBKM (Tab MBKM Data).
 *
 * Controller hanya membaca `req.query`, memanggil service, dan mengirim
 * respons. Periode efektif, populasi, aritmetika persentase, dan bentuk payload
 * hidup di `services/mbkm/`.
 */
const { getPaginationParams } = require('../utils/paginationUtils');
const { MBKM_DETAIL_CARDS, getMbkmDetail } = require('../services/mbkm/mbkmDetails');
const { getMbkmList } = require('../services/mbkm/mbkmList');
const { getMbkmSummary } = require('../services/mbkm/mbkmSummary');
const { cardQuery } = require('../services/mbkm/mbkmCards');
const { getOrLoad } = require('../services/summaryCache');
const { sendServerError } = require('../utils/errorHandler');

// GET /api/mbkm/summary — data card MBKM + filter options
const getSummary = async (req, res) => {
  try {
    // Kunci cache = scope kartu: mengetik di Cari atau memilih status tidak memuat ulang kartu.
    const data = await getOrLoad('mbkm', cardQuery(req.query, 'participation'), () =>
      getMbkmSummary(req.query),
    );
    return res.json({ success: true, ...data });
  } catch (error) {
    return sendServerError(res, 'DATA_READ_FAILED', error, 'mbkm/getSummary');
  }
};

// GET /api/mbkm/list — Tabel MBKM dengan filter + pagination
const getMbkmData = async (req, res) => {
  try {
    const { page, limit } = getPaginationParams(req.query);
    const result = await getMbkmList(req.query, page, limit);
    return res.json({ success: true, ...result });
  } catch (error) {
    return sendServerError(res, 'DATA_READ_FAILED', error, 'mbkm/getMbkmData');
  }
};

// GET /api/mbkm/analytics/:card — popup kartu (participation | total | mitra | jenis)
const getDetail = async (req, res) => {
  if (!MBKM_DETAIL_CARDS.includes(req.params.card)) {
    return res.status(404).json({ success: false, message: 'Rincian kartu tidak ditemukan' });
  }
  try {
    const { card } = req.params;
    // Scope partisipasi (memuat jenis): kartu jenis memakai jenis untuk `selected`.
    const scope = { ...cardQuery(req.query, 'participation'), topN: req.query.topN };
    const data = await getOrLoad(`mbkm-detail-${card}`, scope, () =>
      getMbkmDetail(card, req.query),
    );
    return res.json({ success: true, data });
  } catch (error) {
    return sendServerError(res, 'DATA_READ_FAILED', error, 'mbkm/getDetail');
  }
};

module.exports = { getSummary, getMbkmData, getDetail };
