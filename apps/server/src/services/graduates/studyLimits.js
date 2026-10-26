/**
 * Batas masa studi per jenjang, dalam tahun (ADR 0004). Satu tabel untuk dua
 * metrik yang dulu punya konstanta sendiri-sendiri:
 * - `onTime`: lulus ≤ onTime × 2 semester = tepat waktu.
 * - `max`: masa studi maksimum. Keberhasilan Studi menghitung lulusan yang
 *   selesai ≤ max × 2 semester, dan mengevaluasi angkatan TA − max.
 * S1/S2/Profesi mengikuti aturan i3L; S3/D3/D4 disiapkan dengan standar
 * nasional sampai datanya ada.
 */
const { normalizeJenjang } = require('@komet/shared/formatters');

const STUDY_LIMITS = {
  S1: { onTime: 4, max: 8 },
  S2: { onTime: 2, max: 4 },
  Profesi: { onTime: 1, max: 2 },
  S3: { onTime: 3, max: 6 },
  D3: { onTime: 3, max: 5 },
  D4: { onTime: 4, max: 7 },
};

/** Batas satu jenjang (nama bebas huruf), atau null bila aturannya belum ada. */
function studyLimitsFor(jenjang) {
  return STUDY_LIMITS[normalizeJenjang(jenjang)] ?? null;
}

module.exports = { STUDY_LIMITS, studyLimitsFor };
