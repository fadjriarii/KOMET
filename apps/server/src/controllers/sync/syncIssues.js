/**
 * Detector nilai baru: datanya tetap tampil (passthrough), tapi nilai yang
 * belum pernah dikenal dicatat supaya manusia dikabari — bukan diminta
 * mengetik tabel mapping. Dipakai sync mahasiswa; ringkasannya ikut hasil
 * sync dan log.
 */
const KNOWN_STATUS = new Set(['A', 'D', 'K', 'L', 'LL', 'M', 'PS', 'T', 'C']);
const KNOWN_JENJANG = new Set(['S1', 'S2', 'PROF']);

function createIssueCollector() {
  return {
    prodiCodes: new Set(),
    isoCodes: new Set(),
    birthplaces: new Set(),
    statusCodes: new Set(),
    jenjangValues: new Set(),
  };
}

function summarizeIssues(issues) {
  const out = {};
  for (const [key, set] of Object.entries(issues)) {
    if (set.size) out[key] = [...set].sort();
  }
  return out;
}

module.exports = { KNOWN_STATUS, KNOWN_JENJANG, createIssueCollector, summarizeIssues };
