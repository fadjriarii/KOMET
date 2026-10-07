const { DEFAULT_PAGE, MAX_PAGE_SIZE, TABLE_LIMIT } = require('@komet/shared/constants');

/**
 * Normalisasi parameter pagination dari query params.
 * Offset dihitung sendiri oleh pemanggil yang membutuhkannya (prisma `skip`),
 * karena beberapa query memakai cursor dan mengesampingkan offset.
 * @param {object} query - req.query object
 * @returns {{ page: number, limit: number }}
 */
function getPaginationParams(query) {
  const page = Math.max(DEFAULT_PAGE, parseInt(query.page) || DEFAULT_PAGE);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(query.limit) || TABLE_LIMIT));
  return { page, limit };
}

/**
 * Pola daftar ber-offset: satu `findMany` dan satu `count` paralel, lalu blok
 * `pagination` yang sama. Proyeksi baris tetap milik modul masing-masing.
 * Daftar dengan cursor (mahasiswa) menghitung `take`-nya sendiri.
 */
async function paginateList(model, { where, select, orderBy, page, limit }) {
  const [rows, total] = await Promise.all([
    model.findMany({ where, select, orderBy, skip: (page - 1) * limit, take: limit }),
    model.count({ where }),
  ]);
  return { rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

module.exports = { getPaginationParams, paginateList };
