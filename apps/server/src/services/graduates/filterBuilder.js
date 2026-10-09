/**
 * filterBuilder.js
 *
 * Mengkonversi query parameters dari HTTP request menjadi Prisma where clause
 * untuk tabel students (dan relasi graduate).
 *
 * Populasi tab lulusan = seluruh mahasiswa Lulus (student-base): kartu, deret,
 * dan tabel membaca populasi yang sama sehingga tidak bisa selisih by
 * construction (terukur: graduate-base 1090 vs student Lulus 1132 = 37 Prof
 * dikunci-out + 5 orphan S1 tanpa baris graduate). Field kelulusan
 * (tahunLulus/periodeWisuda/predikat) hidup di relasi `graduate`.
 */

const prisma = require('../../config/prisma');
const { addInFilter, addSearchFilter, hasFilters, toArray } = require('../shared/filterUtils');
const { PREDIKAT, UNCLASSIFIED_PREDIKAT } = require('@komet/shared/constants');
const {
  IPK_THRESHOLD_CUM_LAUDE,
  IPK_THRESHOLD_SANGAT_MEMUASKAN,
} = require('../../utils/graduateUtils');

/**
 * Jenjang yang benar-benar diminta sebuah filter graduate — dibaca apa adanya
 * dari nilai yang diminta user, TANPA daftar statis. `JENJANGS` (= S1/S2) hanya
 * cakupan IKU tab Student; tab Lulusan memakai seluruh jenjang populasi
 * termasuk `Prof` (terukur: 37 Prof ada di DB tapi dikunci-out helper lama).
 *
 * Tanpa filter jenjang: null = seluruh populasi (pemanggil tidak menyaring).
 * Nilai tak dikenal dikembalikan apa adanya — server tidak menebak maksud user.
 */
function getRequestedJenjang(whereFilter = {}) {
  const requested = toArray(whereFilter.jenjang?.in ?? whereFilter.jenjang) || [];
  return requested.length ? [...new Set(requested)] : null;
}

function includesJenjang(whereFilter, jenjang, knownJenjangs = null) {
  const requested = getRequestedJenjang(whereFilter);
  if (requested) return requested.includes(jenjang);
  // Tanpa filter: seluruh populasi diminta — level dikenal selalu termasuk.
  return knownJenjangs ? knownJenjangs.includes(jenjang) : true;
}

/**
 * Seluruh jenjang dalam populasi terfilter (distinct DB, dinamis — bukan daftar
 * statis). Dipakai metrik yang merender satu kolom per jenjang. Filter jenjang
 * user selalu menang; tanpanya = semua yang ada, termasuk `Prof`.
 */
async function getScopeJenjangs(whereFilter = {}) {
  const requested = getRequestedJenjang(whereFilter);
  if (requested) return requested;
  const { ...rest } = whereFilter;
  delete rest.jenjang;
  const rows = await prisma.student.groupBy({ by: ['jenjang'], where: rest });
  return rows.map((row) => row.jenjang).sort();
}

/** Periode Wisuda = Periode Masuk versi Student: Ganjil/Genap = akhiran kode 1/2. */
function buildPeriodeWisudaFilter(value) {
  if (value === 'Ganjil') return { endsWith: '1' };
  if (value === 'Genap') return { endsWith: '2' };
  return null;
}

/**
 * Satu label predikat = nilai tersimpan ATAU fallback IPK untuk baris lama yang
 * `predikatLulus`-nya masih kosong (label resmi SK yudisium belum disinkron).
 * Ambang memakai konstanta `graduateUtils` — bukan salinan angka.
 */
function predikatBranch(label) {
  const stored = { predikatLulus: label };
  const fallback = { predikatLulus: '' };
  switch (label) {
    case PREDIKAT.CUM_LAUDE:
      return { OR: [stored, { ...fallback, ipk: { gte: IPK_THRESHOLD_CUM_LAUDE } }] };
    case PREDIKAT.SANGAT_MEMUASKAN:
      return {
        OR: [
          stored,
          {
            ...fallback,
            ipk: { gte: IPK_THRESHOLD_SANGAT_MEMUASKAN, lt: IPK_THRESHOLD_CUM_LAUDE },
          },
        ],
      };
    case PREDIKAT.MEMUASKAN:
      return {
        OR: [stored, { ...fallback, ipk: { gt: 0, lt: IPK_THRESHOLD_SANGAT_MEMUASKAN } }],
      };
    case UNCLASSIFIED_PREDIKAT:
      // Tanpa IPK yang sah = tidak terklasifikasi (lihat `calculatePredikat`).
      return { ...fallback, ipk: { lte: 0 } };
    default:
      return stored;
  }
}

function buildGraduateFilter(query) {
  const {
    programStudi,
    tahunLulus,
    periodeWisuda,
    predikat,
    fakultas,
    angkatanTahun,
    jenjang,
    search,
  } = query;

  // Top-level = kolom students (model yang di-query). Tanpa `statusKeaktifan`
  // eksplisit populasi selalu Lulus — tab ini tidak menampilkan status lain.
  const where = { statusKeaktifan: 'Lulus' };
  addInFilter(where, 'jenjang', jenjang);
  addInFilter(where, 'programStudi', programStudi);
  addInFilter(where, 'fakultas', fakultas);
  // Angkatan = label ajaran penuh: pencocokan persis seperti tab Student.
  addInFilter(where, 'angkatan', angkatanTahun);
  addSearchFilter(where, search);

  // Field kelulusan hidup di relasi `graduate` (left join: orphan Lulus tanpa
  // baris graduate tetap tampil dengan field null — total tak pernah selisih).
  const graduateFilter = {};
  addInFilter(graduateFilter, 'tahunLulus', tahunLulus);

  const periodeWisudaFilter = buildPeriodeWisudaFilter(periodeWisuda);
  if (periodeWisudaFilter) graduateFilter.periodeWisuda = periodeWisudaFilter;

  const predikatValues = toArray(predikat)?.filter(Boolean) || [];
  if (predikatValues.length) {
    graduateFilter.AND = [
      ...(graduateFilter.AND || []),
      { OR: predikatValues.map(predikatBranch) },
    ];
  }

  if (hasFilters(graduateFilter)) {
    where.graduate = graduateFilter;
  }

  return where;
}

module.exports = {
  buildGraduateFilter,
  getRequestedJenjang,
  includesJenjang,
  getScopeJenjangs,
};
