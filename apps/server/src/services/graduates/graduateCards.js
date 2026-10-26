/**
 * graduateCards.js
 *
 * Isi empat kartu KPI Graduate Data dalam satu bentuk: nilai utama, apakah
 * scope kosong, dan rincian per jenjang yang sudah berurutan dan berlabel.
 * Semua keputusan domain (jenjang mana yang tampil, nilai utama, urutan, label)
 * dibuat di sini — client hanya merender dan menyusun kalimat.
 */
const { CANONICAL_JENJANG } = require('@komet/shared/constants');
const { normalizeJenjang } = require('@komet/shared/formatters');
const { studyLimitsFor } = require('./studyLimits');

const ORDER = Object.values(CANONICAL_JENJANG);
const META_KEYS = new Set(['tahunScope', 'referenceLabel', 'overall', 'cohorts']);

/** Urutan tampil: S1, S2, S3, Profesi, D3, D4, lalu jenjang lain abjad. */
function byJenjangOrder(a, b) {
  const ia = ORDER.indexOf(a.jenjang);
  const ib = ORDER.indexOf(b.jenjang);
  return (
    (ia < 0 ? ORDER.length : ia) - (ib < 0 ? ORDER.length : ib) ||
    a.jenjang.localeCompare(b.jenjang)
  );
}

/** Entri jenjang dari objek metrik berkunci huruf kecil (`{ s1: …, profesi: … }`). */
function jenjangEntries(metric = {}, pick) {
  return Object.entries(metric || {})
    .filter(([key]) => !META_KEYS.has(key) && !key.startsWith('angkatan'))
    .map(([key, raw]) => {
      const jenjang = normalizeJenjang(key);
      return { key, jenjang, label: jenjang, ...pick(raw, jenjang, key) };
    })
    .filter((entry) => entry.value !== null && entry.value !== undefined)
    .sort(byJenjangOrder);
}

const round2 = (value) => Math.round(value * 100) / 100;

function totalCard(totalLulusan) {
  const byJenjang = jenjangEntries(totalLulusan, (count) => ({
    value: typeof count === 'number' ? count : null,
  })).filter((entry) => entry.value > 0);
  const known = Object.entries(totalLulusan || {}).filter(
    ([key, value]) => !META_KEYS.has(key) && typeof value === 'number',
  );
  const value = known.length ? known.reduce((sum, [, count]) => sum + count, 0) : null;
  return { value, isEmpty: !value, byJenjang };
}

function gpaCard(avgIpk) {
  const byJenjang = jenjangEntries(avgIpk, (raw) => ({
    value: raw?.average ?? null,
    count: raw?.count ?? 0,
  }));
  const count = byJenjang.reduce((sum, entry) => sum + entry.count, 0);
  // Rata-rata tertimbang jumlah lulusan ber-IPK, bukan rata-rata dari rata-rata.
  const value = count
    ? round2(byJenjang.reduce((sum, entry) => sum + entry.value * entry.count, 0) / count)
    : null;
  return { value, count, isEmpty: value === null, byJenjang };
}

function onTimeCard(tepatWaktu) {
  const byJenjang = jenjangEntries(tepatWaktu, (rate, jenjang) => ({
    value: typeof rate === 'number' ? rate : null,
    batas: studyLimitsFor(jenjang)?.onTime ?? null,
  }));
  const value = tepatWaktu?.overall ?? null;
  return { value, isEmpty: value === null, byJenjang };
}

/**
 * Nilai utama Keberhasilan Studi = jenjang dengan intake terbesar. Tiap jenjang
 * mengevaluasi angkatan berbeda, jadi rata-rata gabungan tidak bermakna.
 */
function studySuccessCard(keberhasilanStudi) {
  const byJenjang = jenjangEntries(keberhasilanStudi?.cohorts, (cohort, jenjang) => ({
    value: cohort?.rate ?? null,
    intake: cohort?.intake ?? 0,
    angkatan: cohort?.angkatan ?? null,
    angkatanList: cohort?.angkatanList ?? (cohort?.angkatan ? [cohort.angkatan] : []),
    batas: studyLimitsFor(jenjang)?.max ?? null,
  }));
  const headline = byJenjang.reduce(
    (best, entry) => (!best || entry.intake > best.intake ? entry : best),
    null,
  );
  return {
    value: headline?.value ?? null,
    headlineJenjang: headline?.jenjang ?? null,
    isEmpty: !headline,
    byJenjang,
  };
}

function buildGraduateCards({ totalLulusan, avgIpk, tepatWaktu, keberhasilanStudi }) {
  return {
    total: totalCard(totalLulusan),
    gpa: gpaCard(avgIpk),
    onTime: onTimeCard(tepatWaktu),
    studySuccess: studySuccessCard(keberhasilanStudi),
  };
}

/**
 * Daftar tab jenjang popup: hanya jenjang yang deretnya berisi data, urutan
 * kanonis, label kanonis. `series` = `{ s1: [...], profesi: [...] }`.
 */
function jenjangTabs(series = {}, extra = () => ({})) {
  return Object.entries(series)
    .filter(([, rows]) => Array.isArray(rows) && rows.length > 0)
    .map(([key]) => {
      const jenjang = normalizeJenjang(key);
      return { key, jenjang, label: jenjang, ...extra(jenjang, key) };
    })
    .sort(byJenjangOrder);
}

/**
 * Jenjang sebuah deret per tahun (`[{ tahun, s1Count, profesiCount }]`): kunci
 * ber-akhiran `suffix` yang punya nilai > 0 di salah satu tahun.
 */
function seriesJenjangs(rows = [], suffix) {
  const keys = new Set();
  for (const row of rows) {
    for (const [field, value] of Object.entries(row)) {
      if (field.endsWith(suffix) && Number(value) > 0) keys.add(field.slice(0, -suffix.length));
    }
  }
  return jenjangTabs(Object.fromEntries([...keys].map((key) => [key, [true]])), (jenjang, key) => ({
    dataKey: `${key}${suffix}`,
  }));
}

module.exports = { buildGraduateCards, jenjangTabs, seriesJenjangs };
