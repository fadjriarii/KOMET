/**
 * yearJenjangSeries.js
 *
 * Deret lulusan per tahun × jenjang dipakai dua jalur — jumlah lulusan
 * (`totalLulusan.js`) dan rata-rata IPK (`ipkTrend.js`) — dengan bentuk kueri yang
 * sama persis. Yang berbeda hanya angka yang diambil dari tiap bucket.
 *
 * Populasi = baris graduate (mahasiswa dengan catatan kelulusan asal endpoint
 * `/kelulusan`); `tahunLulus` hidup di relasi `graduate`, jadi deret
 * dibaca lewat `student.findMany` + agregasi Node (`groupBy` Prisma tak bisa
 * mengelompokkan kolom relasi). Kolom `tahunLulus` menyimpan label ajaran
 * (`YYYY/YYYY`). Jendela 5 label (`getGraduateLabelWindow`) hanya untuk opsi
 * filter rolling — kartu KPI menghitung seluruh populasi tabel secara default.
 */

const prisma = require('../../config/prisma');
const {
  TREND_WINDOW_YEARS,
  getLabelYearRange,
  getReferenceLabelStart,
} = require('../../utils/academicUtils');
const { toArray } = require('@komet/shared/filterUtils');
const { formatAcademicYearLabel } = require('@komet/shared/academicYear');
const { getRequestedJenjang } = require('./filterBuilder');
const { getTahunAjaran, getTahunAjaranLabel, tahunAjaranStart } = require('./tahunAjaran');

/**
 * Lima label ajaran ke belakang dari label terbaru di DB — hanya untuk opsi
 * filter rolling. Perbandingan leksikografis label sama dengan kronologis,
 * jadi satu agregat `_max` cukup.
 */
async function getGraduateLabelWindow() {
  const latest = await prisma.graduate.aggregate({ _max: { tahunLulus: true } });
  const maxLabel = latest._max?.tahunLulus;
  const refStart = getReferenceLabelStart(maxLabel ? [maxLabel] : []);
  return getLabelYearRange(formatAcademicYearLabel(refStart));
}

/**
 * Filter tahun user selalu menang; tanpa pilihan user kartu menghitung seluruh
 * data (bukan jendela 5 tahun), supaya angka kartu = populasi tabel.
 * (Terukur sebelum perbaikan: tanpa filter → tabel 1090, kartu 793.)
 * Tahun dibaca dari nesting `graduate` (bentuk builder baru) atau flat
 * (bentuk lama) — keduanya diterima.
 */
async function resolveTahunScope(whereFilter = {}) {
  const scope = whereFilter.graduate?.tahunLulus ?? whereFilter.tahunLulus;
  if (scope) return { scope, isDefault: false };
  return { scope: undefined, isDefault: true };
}

/**
 * Label siap tampil untuk scope tahun kartu/modal — tanpa logika di frontend.
 * `label` untuk badge, `phrase` untuk kalimat banner modal.
 */
function describeTahunScope(scope, isDefault) {
  const labels = [...new Set((toArray(scope?.in ?? scope) || []).filter(Boolean))].sort();
  if (!labels.length) {
    return {
      labels,
      isDefault,
      label: 'Semua Tahun',
      phrase: 'di seluruh tahun akademik tercatat',
    };
  }
  if (labels.length === 1) {
    return { labels, isDefault, label: labels[0], phrase: `pada tahun ajaran ${labels[0]}` };
  }
  return {
    labels,
    isDefault,
    label: `${labels[0]} sampai ${labels[labels.length - 1]}`,
    phrase: `pada rentang ${labels[0]} sampai ${labels[labels.length - 1]}`,
  };
}

/** Label untuk jangkar kumulatif `tahunAjaran` tanpa pilihan tahun lulus. */
function describeTahunAnchor(anchor) {
  return {
    labels: [anchor],
    isDefault: false,
    label: anchor,
    phrase: `sampai tahun ajaran ${anchor}`,
  };
}

/**
 * Satu titik resolusi scope tahun untuk kartu, modal, dan distribusi:
 * `tahunLulus` eksplisit menang; tanpa itu `tahunAjaran` menjadi jangkar
 * kumulatif `lte`. `tahunLulus` kosong (lima baris manual tanpa tahun) tidak
 * ikut jangkar — string kosong tidak boleh lolos sebagai "lulus sebelum X".
 */
async function resolveTahunAjaranScope(whereFilter = {}) {
  const { tahunAjaran, ...cleanFilter } = whereFilter;
  const { scope, isDefault } = await resolveTahunScope(cleanFilter);
  const where = withTahunScope(cleanFilter, scope);
  const explicitTahun = cleanFilter.graduate?.tahunLulus ?? cleanFilter.tahunLulus;
  const anchor = explicitTahun ? null : getTahunAjaranLabel(tahunAjaran);
  if (anchor) where.graduate = { ...(where.graduate || {}), tahunLulus: { lte: anchor, not: '' } };
  return {
    cleanFilter,
    where,
    scope,
    isDefault,
    anchor,
    tahunScope: anchor ? describeTahunAnchor(anchor) : describeTahunScope(scope, isDefault),
  };
}

/**
 * Terapkan scope tahun ke relasi `graduate` — Student tak punya kolom
 * `tahunLulus`, jadi scope flat lama dipindah ke nesting (tak pernah dikirim
 * mentah ke Prisma). Tanpa pilihan user scope-nya undefined = seluruh populasi.
 */
function withTahunScope(whereFilter = {}, scope) {
  const { tahunLulus, tahunAjaran, graduate, ...rest } = whereFilter;
  void tahunLulus;
  void tahunAjaran;
  if (!scope) {
    return graduate ? { ...rest, graduate } : { ...rest };
  }
  return { ...rest, graduate: { ...(graduate || {}), tahunLulus: scope } };
}

/**
 * Jendela chart tren lulusan: 5 tahun terbaru dari data yang benar-benar ada.
 * Sync tahun baru otomatis menggeser jendela; pilihan tahun eksplisit user
 * tidak dipotong agar filter tetap menang apa adanya.
 */
function windowGraduateTrend(series, whereFilter = {}) {
  const explicitTahun = whereFilter.graduate?.tahunLulus ?? whereFilter.tahunLulus;
  return explicitTahun ? series : series.slice(-TREND_WINDOW_YEARS);
}

/**
 * @param {object} whereFilter  Filter student-base (flat + nesting `graduate`)
 * @param {function({tahun, jenjang, items}): number|null} options.valueOf  angka dari satu bucket tahun×jenjang
 * @param {number|null} options.missing  nilai tahun/jenjang tanpa baris
 * @returns {Promise<Array<{tahun: string, [jenjangLower]: number|null}>>} terurut naik;
 *   kunci jenjang dinamis (s1/s2/profesi, bukan daftar statis)
 */
async function valuesByYearAndJenjang(whereFilter, { valueOf, missing }) {
  const { scope } = await resolveTahunScope(whereFilter);
  const students = await prisma.student.findMany({
    where: withTahunScope(whereFilter, scope),
    select: { jenjang: true, graduate: { select: { tahunLulus: true, ipk: true } } },
  });

  // Filter jenjang user menang; tanpanya = semua jenjang yang ada di populasi
  // (termasuk `Profesi`) — dibaca dari data, bukan daftar statis.
  const requested = getRequestedJenjang(whereFilter);
  const jenjangs = requested?.length
    ? requested
    : [...new Set(students.map((s) => s.jenjang))].sort();

  let years;
  if (scope) {
    years = [...new Set((toArray(scope?.in ?? scope) || []).filter(Boolean))].sort();
  } else {
    // Deret chart hanya berisi tahun yang diketahui. Baris manual tanpa
    // `tahunLulus` tetap masuk total kartu, tetapi tidak punya bucket tahun.
    years = [...new Set(students.map((s) => s.graduate?.tahunLulus).filter(Boolean))].sort();
  }

  // Jangkar `tahunAjaran` (Opsi A, meta dari filterBuilder) memotong deret
  // sampai akhir tahun ajaran itu — label lebih muda dibuang. Filter
  // `tahunLulus` eksplisit menang: scope sudah menghasilkan deret pasti.
  const anchor = getTahunAjaran(whereFilter);
  if (anchor && !scope) {
    const anchorStart = tahunAjaranStart(anchor);
    years = years.filter((tahun) => tahunAjaranStart(tahun) <= anchorStart);
  }

  const valueAt = (tahun, jenjang) => {
    const items = students.filter((s) => s.graduate?.tahunLulus === tahun && s.jenjang === jenjang);
    return items.length ? valueOf({ tahun, jenjang, items }) : missing;
  };

  return years.map((tahun) => {
    const entry = { tahun };
    for (const jenjang of jenjangs) entry[jenjang.toLowerCase()] = valueAt(tahun, jenjang);
    return entry;
  });
}

module.exports = {
  valuesByYearAndJenjang,
  windowGraduateTrend,
  getGraduateLabelWindow,
  resolveTahunScope,
  resolveTahunAjaranScope,
  describeTahunScope,
  describeTahunAnchor,
  withTahunScope,
};
