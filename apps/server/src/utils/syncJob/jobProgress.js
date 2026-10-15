/**
 * Angka yang dibaca UI, diturunkan saat dibaca: progres per modul sudah berisi
 * `percent`, lalu `overallPercent` dan `totals` menjumlahkan modul yang benar-benar
 * dicakup job ini. Klien tidak lagi menghitung ulang apa pun.
 */
function blankEntry(status) {
  return {
    status,
    current_page: 0,
    total_pages: 0,
    total_synced: 0,
    skipped: 0,
  };
}

/**
 * Cakupan job dari permintaan klien: daftar modul yang dipilih, atau modul tunggal
 * untuk POST tanpa body scope.
 */
function resolveScope(MODULES, moduleName, scope) {
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

function withDerivedProgress(MODULES, state) {
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
    // Daftar eksplisit: bookkeeping internal (`pid`, `actor`, `lastActivityAt`,
    // `unloggedDeath`) tidak ikut terkirim ke klien lewat /api/sync/status.
    status: state.status,
    currentModule: state.currentModule,
    startedAt: state.startedAt,
    finishedAt: state.finishedAt,
    lastError: state.lastError,
    scope,
    progress,
    overallPercent: Math.round(percentSum / scope.length),
    totals: { synced, skipped },
  };
}

module.exports = { blankEntry, resolveScope, sameScope, modulePercent, withDerivedProgress };
