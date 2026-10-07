/**
 * Tuas tuning pipeline sinkronisasi. Semuanya bisa diubah lewat `.env` tanpa
 * menyentuh kode; satu-satunya tempat angka-angka ini disebut.
 */

function envInt(name, fallback) {
  const parsed = Number.parseInt(process.env[name], 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

// Berapa halaman SEVIMA yang boleh ada di jaringan sekaligus. Window ini yang
// membuat latensi ambil halaman berikutnya tumpang tindih dengan tulis DB halaman sekarang.
const SYNC_FETCH_WINDOW = Math.max(1, envInt('SEVIMA_FETCH_WINDOW', 3));
const SYNC_PAGE_DELAY_MS = envInt('SEVIMA_PAGE_DELAY_MS', 150);
const DB_CHUNK_SIZE = Math.max(1, envInt('SEVIMA_DB_CHUNK_SIZE', 200));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function chunkBy(items, size = DB_CHUNK_SIZE) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

module.exports = { SYNC_FETCH_WINDOW, SYNC_PAGE_DELAY_MS, DB_CHUNK_SIZE, sleep, chunkBy };
