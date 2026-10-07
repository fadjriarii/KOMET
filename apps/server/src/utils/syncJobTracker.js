const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const stateFilePath = path.join(__dirname, '../../logs/sync-state.json');

const MODULES = ['students', 'graduates', 'mbkm'];

const blankEntry = (status) => ({
  status,
  current_page: 0,
  total_pages: 0,
  total_synced: 0,
  skipped: 0,
});

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

// State ditulis ke file agar worker PM2 lain bisa melihat progres yang sama.
// Saat startup, status 'running' yang tersimpan berarti proses sebelumnya mati
// sebelum sempat menyelesaikan job -> reset supaya job tracker tidak terkunci.
function loadState() {
  try {
    const stored = readStateFile();
    if (!stored) return defaultState;
    currentState = stored;
    if (currentState.status === 'running') {
      currentState.status = 'failed';
      currentState.lastError = 'Proses terhenti karena server terputus/di-restart';
      saveState(true);
    }
  } catch {
    currentState = { ...defaultState };
  }
  return currentState;
}

// Untuk worker yang tidak menerima POST /sync, state di memori tidak pernah berubah
// sendiri. Baca ulang file hanya ketika isinya benar-benar ditulis ulang.
function refreshState() {
  try {
    const stats = fs.statSync(stateFilePath, { throwIfNoEntry: false });
    if (!stats || stats.mtimeMs === loadedMtimeMs) return currentState;
    const stored = readStateFile();
    if (stored) currentState = stored;
  } catch {
    // Pertahankan state terakhir yang diketahui bila file sedang dibaca saat ditulis.
  }
  return currentState;
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

/**
 * Cakupan job dari permintaan klien: daftar modul yang dipilih, atau modul tunggal
 * untuk POST tanpa body scope.
 */
function resolveScope(moduleName, scope) {
  const requested = Array.isArray(scope) ? scope.filter((key) => MODULES.includes(key)) : [];
  if (requested.length) return requested;
  return MODULES.includes(moduleName) ? [moduleName] : MODULES;
}

const sameScope = (previous, next) =>
  Array.isArray(previous) &&
  previous.length === next.length &&
  previous.every((key, index) => key === next[index]);

/**
 * Persentase satu modul dari progres mentah. Modul yang sedang berjalan tapi belum
 * tahu berapa halamannya ditampilkan sebagai 8% — bilangan kecil yang menandai
 * "bukan nol, hanya belum ada angka", bukan hasil pengukuran.
 */
function modulePercent(entry) {
  if (!entry || entry.status === 'idle' || entry.status === 'pending') return 0;
  if (entry.status === 'completed') return 100;
  if (entry.total_pages > 0) {
    return Math.min(100, Math.round((entry.current_page / entry.total_pages) * 100));
  }
  return entry.status === 'running' ? 8 : 0;
}

/**
 * Angka yang dibaca UI, diturunkan saat dibaca: progres per modul sudah berisi
 * `percent`, lalu `overallPercent` dan `totals` menjumlahkan modul yang benar-benar
 * dicakup job ini. Klien tidak lagi menghitung ulang apa pun.
 */
function withDerivedProgress(state) {
  const scope = Array.isArray(state.scope) && state.scope.length ? state.scope : MODULES;
  const progress = {};
  for (const key of MODULES) {
    const entry = state.progress?.[key];
    progress[key] = { ...entry, percent: modulePercent(entry) };
  }
  let percentSum = 0;
  let synced = 0;
  let skipped = 0;
  for (const key of scope) {
    percentSum += progress[key].percent;
    synced += state.progress?.[key]?.total_synced || 0;
    skipped += state.progress?.[key]?.skipped || 0;
  }
  return {
    ...state,
    scope,
    progress,
    overallPercent: Math.round(percentSum / scope.length),
    totals: { synced, skipped },
  };
}

const syncJobTracker = {
  getState: () => withDerivedProgress(refreshState()),
  startJob: (moduleName = 'all', scope = null) => {
    const jobScope = resolveScope(moduleName, scope);
    // Klien menjalankan satu job sebagai beberapa POST berurutan: hanya job baru
    // (status belum berjalan, atau cakupannya berubah) yang menghapus angka lama.
    // POST berikutnya dalam job yang sama membiarkan angka modul lain utuh.
    if (currentState.status !== 'running' || !sameScope(currentState.scope, jobScope)) {
      currentState.startedAt = new Date().toISOString();
      currentState.finishedAt = null;
      currentState.lastError = null;
      for (const key of jobScope) currentState.progress[key] = blankEntry('pending');
    }
    currentState.status = 'running';
    currentState.currentModule = moduleName;
    currentState.scope = jobScope;
    saveState(true);
  },
  updateProgress: (moduleName, { page, totalPages, synced, skipped, status }) => {
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
  isRunning: () => refreshState().status === 'running',
};

module.exports = syncJobTracker;
