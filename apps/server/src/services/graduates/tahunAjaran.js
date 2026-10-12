/**
 * tahunAjaran.js
 *
 * Jangkar kohort tab Lulusan (Opsi A): satu parameter `tahunAjaran`
 * (`YYYY/YYYY`) yang memilih "lulus sampai tahun ajaran ini" untuk kartu,
 * deret, dan tabel, serta menggeser referensi evaluasi kohort
 * (keberhasilan studi) dari MAX DB ke tahun ajaran yang dipilih.
 *
 * Disimpan sebagai meta di `whereFilter` (bukan where Prisma) — tiap service
 * membacanya lewat sini lalu membuangnya sebelum query.
 *
 * ponytail: validasi label ditulis ulang 5 baris di sini, bukan import ulang
 * dari shared/academicYear, supaya file ini tanpa dependensi dan tak bisa
 * circular dengan filterBuilder/yearJenjangSeries. Upgrade path: pakai
 * `isValidAcademicYear` shared bila helper ini tumbuh logika lain.
 */

const LABEL_PATTERN = /^(\d{4})\/(\d{4})$/;

/** Label `YYYY/YYYY` yang sah → labelnya; selain itu → null. */
function getTahunAjaranLabel(value) {
  if (typeof value !== 'string') return null;
  const label = value.trim();
  const match = LABEL_PATTERN.exec(label);
  if (!match) return null;
  const start = Number(match[1]);
  if (start < 1900 || Number(match[2]) !== start + 1) return null;
  return label;
}

/** Jangkar dari `whereFilter.tahunAjaran` (ditempel filterBuilder) → label/null. */
function getTahunAjaran(whereFilter = {}) {
  return getTahunAjaranLabel(whereFilter?.tahunAjaran);
}

/** Tahun mulai (start) sebuah label ajaran yang sudah tervalidasi. */
function tahunAjaranStart(label) {
  return Number(String(label).slice(0, 4));
}

module.exports = { getTahunAjaranLabel, getTahunAjaran, tahunAjaranStart };
