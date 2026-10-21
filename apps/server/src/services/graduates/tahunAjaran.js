/**
 * tahunAjaran.js
 *
 * Jangkar kohort tab Lulusan (Opsi A): satu parameter `tahunAjaran`
 * (`YYYY/YYYY`) yang memilih batas "lulus sampai tahun ajaran ini" untuk
 * kartu, deret, dan tabel bila tidak ada pilihan `tahunLulus`, serta menggeser
 * referensi evaluasi kohort (keberhasilan studi) dari MAX DB ke tahun ajaran
 * yang dipilih. Pilihan `tahunLulus` — termasuk default UI — tetap menang.
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

/**
 * Terapkan jangkar kohort ke where berbasis relasi `graduate`:
 * "lulus sampai tahun ajaran ini" = `tahunLulus lte` label jangkar.
 * Filter `tahunLulus` eksplisit dari user selalu menang; kunci meta
 * `tahunAjaran` (bukan kolom Prisma) dibuang supaya tak bocor ke query.
 *
 * `resolveTahunAjaranScope` di `yearJenjangSeries.js` memakai pemetaan yang
 * sama untuk kartu/modal yang sekaligus butuh label scope tahun.
 */
function withTahunAjaranAnchor(whereFilter = {}) {
  const { tahunAjaran, ...rest } = whereFilter;
  const anchor = getTahunAjaranLabel(tahunAjaran);
  const explicit = rest.graduate?.tahunLulus ?? rest.tahunLulus;
  if (!anchor || explicit) return rest;
  // Baris manual tanpa tahun lulus tidak boleh lolos `lte` sebagai string
  // kosong; ia tetap ada di tampilan tanpa jangkar.
  return {
    ...rest,
    graduate: { ...(rest.graduate || {}), tahunLulus: { lte: anchor, not: '' } },
  };
}

module.exports = { getTahunAjaranLabel, getTahunAjaran, tahunAjaranStart, withTahunAjaranAnchor };
