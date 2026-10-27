const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const { SYNC_MODULE_KEYS } = require('@komet/shared/constants');
const {
  blankEntry,
  resolveScope,
  sameScope,
  withDerivedProgress,
} = require('./syncJob/jobProgress');
const { deadRunReason, markDeadRun } = require('./syncJob/jobDeath');

const stateFilePath = path.join(__dirname, '../../logs/sync-state.json');

// Kunci modul yang dikenal tracker — sumber yang sama dipakai UI untuk daftar
// pilihannya, jadi modul baru cukup didaftarkan satu kali di @komet/shared.
const MODULES = SYNC_MODULE_KEYS;

/**
 * Seberapa lama 'running' boleh tidak menulis apa pun sebelum dianggap mati.
 * Batas bawahnya bukan tebak-tebakan: satu permintaan SEVIMA bisa menahan paling
 * lama 8 percobaan × 20s timeout + total backoff 2,5–20 s ≈ 4,2 menit
 * (`config/sevimaApi.js`). Jadi 10 menit tanpa satu pun halaman berarti job itu
 * tidak akan pernah kembali.
 * ponytail: tidak ada heartbeat — tahap ETL panjang yang menulis progres kurang
 * sering dari ini akan ikut dianggap mati. Naikkan angkanya bila itu terjadi.
 */
const STALE_AFTER_MS = 10 * 60 * 1000;

const defaultState = {
  status: 'idle', // 'idle' | 'running' | 'completed' | 'failed'
  currentModule: null,
  // Modul yang dicakup job terakhir; progres modul di luar daftar ini tidak
  // dibaca lagi oleh satu job pun.
  scope: MODULES,
  progress: Object.fromEntries(MODULES.map((key) => [key, blankEntry('idle')])),
  startedAt: null,
  finishedAt: null,
  lastError: null,
  // Bookkeeping job yang sedang berjalan, tidak keluar lewat /api/sync/status:
  // proses pemilik (untuk mengenali state 'running' yatim), pemicunya (untuk baris
  // riwayat), detak progres terakhir, dan kematian yang belum ditulis ke riwayat.
  pid: null,
  actor: null,
  lastActivityAt: null,
  unloggedDeath: null,
};

let currentState = { ...defaultState };
let loadedMtimeMs = 0;

function readStateFile() {
  const stats = fs.statSync(stateFilePath, { throwIfNoEntry: false });
  if (!stats) return null;
  const raw = fs.readFileSync(stateFilePath, 'utf8');
  loadedMtimeMs = stats.mtimeMs;
  return JSON.parse(raw);
}

/**
 * Tanda mati dipakai bersama oleh startup dan setiap pembacaan status. Hasilnya ditulis
 * langsung, tanpa debounce, supaya worker lain tidak ikut membaca 'running' yang sudah
 * seharusnya mati.
 */
function settleDeadRun() {
  const reason = deadRunReason(currentState, STALE_AFTER_MS);
  if (!reason) return currentState;
  currentState = markDeadRun(MODULES, currentState, reason);
  saveState(true);
  return currentState;
}

// State ditulis ke file agar worker PM2 lain bisa melihat progres yang sama.
// Status 'running' warisan proses sebelumnya tidak lagi langsung dihapus:
// `settleDeadRun` yang memutuskan apakah jobnya memang mati atau masih hidup
// di worker lain.
function loadState() {
  try {
    const stored = readStateFile();
    if (!stored) return defaultState;
    currentState = stored;
    return settleDeadRun();
  } catch {
    currentState = { ...defaultState };
    return currentState;
  }
}

// Untuk worker yang tidak menerima POST /sync, state di memori tidak pernah berubah
// sendiri. Baca ulang file hanya ketika isinya benar-benar ditulis ulang.
function refreshState() {
  try {
    const stats = fs.statSync(stateFilePath, { throwIfNoEntry: false });
    if (stats && stats.mtimeMs !== loadedMtimeMs) {
      const stored = readStateFile();
      if (stored) currentState = stored;
    }
  } catch {
    // Pertahankan state terakhir yang diketahui bila file sedang dibaca saat ditulis.
  }
  return settleDeadRun();
}

let saveTimer = null;

function saveState(immediate = false) {
  const doSave = () => {
    const data = JSON.stringify(currentState, null, 2);
    fs.writeFile(stateFilePath, data, 'utf8', (err) => {
      if (err) logger.error('Gagal menyimpan status sync state:', err.message);
    });
  };

  if (immediate) {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    doSave();
  } else {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(doSave, 100);
  }
}

// Load state on startup
loadState();

const syncJobTracker = {
  getState: () => withDerivedProgress(MODULES, refreshState()),
  /**
   * @param {string} moduleName kunci progress ('students'|'graduates'|'mbkm'|'all')
   * @param {string[]|null} scope modul yang dicakup job yang sama
   * @param {{ actor?: string }} [meta] kredensial pemicu, dari `req.syncActor` —
   *   dibutuhkan nanti bila job ini ternyata mati tanpa menutup dirinya (baris riwayat
   *   tidak boleh menebak actor).
   */
  startJob: (moduleName = 'all', scope = null, meta = {}) => {
    const jobScope = resolveScope(MODULES, moduleName, scope);
    const now = new Date().toISOString();
    // Klien menjalankan satu job sebagai beberapa POST berurutan: hanya job baru
    // (status belum berjalan, atau cakupannya berubah) yang menghapus angka lama.
    // POST berikutnya dalam job yang sama membiarkan angka modul lain utuh.
    if (currentState.status !== 'running' || !sameScope(currentState.scope, jobScope)) {
      currentState.startedAt = now;
      currentState.finishedAt = null;
      currentState.lastError = null;
      for (const key of jobScope) currentState.progress[key] = blankEntry('pending');
    }
    currentState.status = 'running';
    currentState.currentModule = moduleName;
    currentState.scope = jobScope;
    currentState.pid = process.pid;
    currentState.actor = meta.actor || currentState.actor || null;
    // Detak, bukan `startedAt`: POST kedua dalam urutan yang sama datang lama setelah
    // job dimulai, dan jobnya jelas masih hidup saat itu.
    currentState.lastActivityAt = now;
    saveState(true);
  },
  updateProgress: (moduleName, { page, totalPages, synced, skipped, status }) => {
    // Setiap halaman yang dilaporkan adalah detak hidup job: selama angkanya bergerak,
    // job ini tidak dianggap mati.
    currentState.lastActivityAt = new Date().toISOString();
    if (!currentState.progress[moduleName]) {
      currentState.progress[moduleName] = {};
    }
    if (page !== undefined) currentState.progress[moduleName].current_page = page;
    if (totalPages !== undefined) currentState.progress[moduleName].total_pages = totalPages;
    if (synced !== undefined) currentState.progress[moduleName].total_synced = synced;
    if (skipped !== undefined) currentState.progress[moduleName].skipped = skipped;
    if (status !== undefined) currentState.progress[moduleName].status = status;
    saveState();
  },
  finishJob: (success = true, error = null) => {
    currentState.status = success ? 'completed' : 'failed';
    currentState.finishedAt = new Date().toISOString();
    currentState.lastError = error;
    saveState(true);
  },
  /**
   * State proses ini, tanpa membaca file. `getState` sengaja membaca file supaya
   * worker lain bisa ikut melihat progres — tapi angka yang baru saja ditulis
   * `updateProgress` masih menunggu debounce 100ms sebelum masuk file, jadi dibaca
   * balik akan MENGEMBALIKAN angka lama. Yang menutup joblah pemilik angka terakhir,
   * dan riwayat ditulis dari angka itu.
   */
  peekState: () => withDerivedProgress(MODULES, currentState),
  isRunning: () => refreshState().status === 'running',
  /**
   * Ambil kematian job yang belum tercatat di riwayat, satu kali saja: mengambil
   * sekaligus menghapus penandanya dari state, jadi dari beberapa worker PM2 hanya satu
   * yang menulis barisnya. `syncRunLog` tetap mengecek `finishedAt` yang sama sebagai
   * jaring pengaman bila dua worker berbarengan membacanya.
   */
  takeUnloggedDeath: () => {
    const death = refreshState().unloggedDeath;
    if (!death) return null;
    currentState = { ...currentState, unloggedDeath: null };
    saveState(true);
    return death;
  },
};

module.exports = syncJobTracker;
