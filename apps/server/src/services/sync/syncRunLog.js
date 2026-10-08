const prisma = require('../../config/prisma');
const syncJobTracker = require('../../utils/syncJobTracker');
const { SYNC_TRIGGER } = require('@komet/shared/constants');

/**
 * Berapa run terakhir yang disimpan. UI menampilkan seluruhnya, jadi angkanya cukup
 * di satu tempat: yang lebih lama dihapus setiap kali run baru ditulis.
 */
const HISTORY_LIMIT = 5;

const COMPLETED = 'completed';
const FAILED = 'failed';

/**
 * Status modul dinormalisasi menjadi dua nilai saja. Apa pun yang tidak selesai
 * (gagal di tengah jalan, atau belum sempat jalan karena modul sebelumnya gagal)
 * berarti modul itu tidak tersinkron — itu yang dibaca UI sebagai Failed.
 */
const moduleStatus = (entry) => (entry?.status === COMPLETED ? COMPLETED : FAILED);

/**
 * Job dianggap selesai bila ia gagal, atau bila SETIAP modul dalam cakupannya
 * selesai. UI menjalankan satu job sebagai beberapa POST berurutan (satu per modul),
 * jadi aturan ini yang membuat urutan itu tercatat sebagai satu run, bukan tiga:
 * POST tengah job masih menyisakan modul berstatus `pending` dan tidak menulis apa pun.
 */
function isJobOver(state, success) {
  if (!success) return true;
  const scope = Array.isArray(state.scope) && state.scope.length ? state.scope : [];
  return scope.length > 0 && scope.every((key) => state.progress?.[key]?.status === COMPLETED);
}

const toModules = (state) =>
  (Array.isArray(state.scope) ? state.scope : []).map((key) => ({
    key,
    status: moduleStatus(state.progress?.[key]),
  }));

/**
 * Tulis satu run yang baru selesai. Dipanggil SEBELUM tracker menandai job selesai,
 * supaya klien yang polling `/api/sync/status` tidak pernah bisa melihat 'completed'
 * saat baris riwayatnya belum ada.
 *
 * @param {object} options
 * @param {object} options.state angka terakhir job, dari `syncJobTracker.peekState()`
 * @param {boolean} options.success hasil job
 * @param {string|null} options.error pesan publik yang sudah diredaksi
 * @param {string} options.actor kredensial pemicu, dari `req.syncActor`
 * @param {string} options.trigger `SYNC_TRIGGER.MANUAL` | `.AUTOMATIC`
 * @param {Date} [options.finishedAt] waktu mati job, bukan waktu tulis — dipakai
 *   `settleUnloggedDeath` supaya barisnya bisa dikenali sebagai dobel
 * @returns {Promise<object|null>} run yang ditulis, atau null bila job belum selesai
 */
async function recordRun({
  state,
  success,
  error = null,
  actor,
  trigger = SYNC_TRIGGER.MANUAL,
  finishedAt = null,
}) {
  if (!isJobOver(state, success)) return null;

  const modules = toModules(state);
  const created = await prisma.syncRun.create({
    data: {
      finishedAt: finishedAt || new Date(),
      trigger,
      actor,
      status: success ? COMPLETED : FAILED,
      modules,
      error: error ?? null,
    },
  });

  // Pangkas ke n run terbaru. Id autoincrement = urutan tulis, jadi tanpa indeks lain.
  const kept = await prisma.syncRun.findMany({
    orderBy: { id: 'desc' },
    take: HISTORY_LIMIT,
    select: { id: true },
  });
  const oldest = kept.at(-1);
  if (oldest) await prisma.syncRun.deleteMany({ where: { id: { lt: oldest.id } } });

  return created;
}

/**
 * Catat job yang mati tanpa pernah menutup dirinya — prosesnya terputus, atau ia berhenti
 * menulis progres. Tidak ada `endJob` untuk job seperti ini, jadi barisnya ditulis oleh
 * pembaca pertama `/api/sync/history`, SEBELUM daftarnya diambil: siapa pun yang melihat
 * 'failed' di riwayat menemukan barisnya dalam respons yang sama, invarian urutan yang
 * sama dengan `endJob`. `finishedAt` kematian dipakai sebagai kunci idempoten karena
 * beberapa worker PM2 bisa membaca kematian yang sama. Tulis yang gagal tetap hanya jadi
 * pesan di log server.
 */
async function settleUnloggedDeath() {
  const death = syncJobTracker.takeUnloggedDeath();
  if (!death) return null;

  const finishedAt = new Date(death.finishedAt);
  const seen = await prisma.syncRun.findFirst({ where: { finishedAt }, select: { id: true } });
  if (seen) return null;

  return recordRun({
    state: death.state,
    success: false,
    error: death.reason,
    actor: death.actor,
    finishedAt,
  });
}

/** Baris siap-render: hitungannya sudah selesai di sini, client tinggal menampilkan. */
function toRow(run) {
  const modules = run.modules;
  return {
    id: run.id,
    finishedAt: run.finishedAt.toISOString(),
    trigger: run.trigger,
    actor: run.actor,
    status: run.status,
    modules,
    succeeded: modules.filter((module) => module.status === COMPLETED).length,
    total: modules.length,
    error: run.error,
  };
}

/** Run terbaru duluan; jumlah barisnya sudah dibatasi `HISTORY_LIMIT` di tabel. */
async function listRuns() {
  const runs = await prisma.syncRun.findMany({
    orderBy: { id: 'desc' },
    take: HISTORY_LIMIT,
  });
  return runs.map(toRow);
}

/** @returns {boolean} false bila id tidak ada — pemanggilnya yang memutuskan status HTTP. */
async function deleteRun(id) {
  const { count } = await prisma.syncRun.deleteMany({ where: { id } });
  return count > 0;
}

module.exports = {
  HISTORY_LIMIT,
  isJobOver,
  recordRun,
  settleUnloggedDeath,
  listRuns,
  deleteRun,
};
