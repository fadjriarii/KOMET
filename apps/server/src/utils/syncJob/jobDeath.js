const { SYNC_ACTOR } = require('@komet/shared/constants');
const { withDerivedProgress } = require('./jobProgress');

const DEAD_BY_RESTART = 'Proses terhenti karena server terputus/di-restart';
const DEAD_BY_STALL = 'Sinkronisasi berhenti: tidak ada progres dalam 10 menit';

/**
 * Proses pemilik state 'running' masih hidup? ESRCH berarti prosesnya tidak ada,
 * EPERM berarti ada tapi bukan milik user ini — yang terakhir tetap dihitung hidup.
 */
function processAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === 'EPERM';
  }
}

/** Alasan kematian untuk 'running' yang tidak akan pernah selesai, atau null. */
function deadRunReason(state, staleAfterMs, now = Date.now()) {
  if (state.status !== 'running') return null;
  if (!processAlive(state.pid)) return DEAD_BY_RESTART;
  const lastBeat = Date.parse(state.lastActivityAt || state.startedAt || '');
  return Number.isFinite(lastBeat) && now - lastBeat > staleAfterMs ? DEAD_BY_STALL : null;
}

/**
 * Matikan job yang tidak akan pernah lewat `endJob`: prosesnya hilang, atau ia berhenti
 * menulis progres. Snapshot-nya dititipkan di `unloggedDeath` supaya baris riwayatnya
 * tetap tercatat — tidak ada tempat lain yang bisa mencatatnya, karena job seperti ini
 * tidak pernah menutup dirinya sendiri.
 */
function markDeadRun(MODULES, state, reason) {
  const finishedAt = state.finishedAt || new Date().toISOString();
  const dead = { ...state, finishedAt };
  return {
    ...dead,
    status: 'failed',
    lastError: reason,
    unloggedDeath: {
      reason,
      actor: state.actor || SYNC_ACTOR.DASHBOARD,
      finishedAt,
      state: withDerivedProgress(MODULES, dead),
    },
  };
}

module.exports = { DEAD_BY_RESTART, DEAD_BY_STALL, processAlive, deadRunReason, markDeadRun };
