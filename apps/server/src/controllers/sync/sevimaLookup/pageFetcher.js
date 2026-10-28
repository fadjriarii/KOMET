const sevimaApi = require('../../../config/sevimaApi');
const { SYNC_FETCH_WINDOW, SYNC_PAGE_DELAY_MS, sleep } = require('../config');

/**
 * Ambil halaman sebuah endpoint SEVIMA secara berurutan dengan window kecil.
 * Halaman ke-N+1 diminta sebelum halaman ke-N ditulis ke DB, sehingga waktu jaring
 * dan waktu tulis saling menimpa (bukan berantai).
 */
async function paginateSevimaPages({
  endpoint,
  startPage = 1,
  onPage,
  params,
  window = SYNC_FETCH_WINDOW,
}) {
  const fetchWindow = Math.max(1, window);
  const inflight = new Map();
  const swallowRemaining = () => {
    for (const promise of inflight.values()) promise.catch(() => {});
    inflight.clear();
  };
  const fetchPage = (page) =>
    (params
      ? sevimaApi.get(endpoint, { params: { ...params, page } })
      : sevimaApi.get(`${endpoint}?page=${page}`)
    ).then((r) => r.data);

  let lastPage = Number.POSITIVE_INFINITY;
  let nextPage = startPage;
  let pagesProcessed = 0;

  while (inflight.size < fetchWindow && nextPage <= lastPage) {
    inflight.set(nextPage, fetchPage(nextPage));
    nextPage += 1;
  }

  try {
    while (inflight.size > 0) {
      const page = Math.min(...inflight.keys());
      const payload = await inflight.get(page);
      inflight.delete(page);

      const numericLastPage = Number(payload?.meta?.last_page);
      if (Number.isFinite(numericLastPage) && numericLastPage > 0) lastPage = numericLastPage;

      const listData = payload?.data;
      if (!listData || listData.length === 0) break;

      await onPage(listData, {
        page,
        totalPages: Number.isFinite(lastPage) ? lastPage : 0,
        meta: payload?.meta,
      });
      pagesProcessed += 1;

      if (nextPage <= lastPage) {
        inflight.set(nextPage, fetchPage(nextPage));
        nextPage += 1;
      }
      if (inflight.size > 0 && SYNC_PAGE_DELAY_MS > 0) await sleep(SYNC_PAGE_DELAY_MS);
    }
  } catch (error) {
    swallowRemaining();
    throw error;
  }

  swallowRemaining();
  return { pagesProcessed };
}

module.exports = { paginateSevimaPages };
