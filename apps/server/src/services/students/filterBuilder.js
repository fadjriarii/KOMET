/**
 * Translates student query parameters into Prisma where clauses. Keeping the
 * small builders here makes the list, KPI, and detail endpoints share exactly
 * the same population definition.
 *
 * Satu builder, beberapa scope. Perbedaan populasi antar kartu dinyatakan di
 * pemanggil lewat `scope`, bukan lewat manipulasi string/JSON atas filter yang
 * sudah jadi — jadi tidak ada jalur kode yang "membuang" kondisi dengan
 * mencocokkan hasil serialisasinya.
 *
 * Kondisi snapshot tahun akademik ada di `snapshotConditions`.
 */
const { toArray, addInFilter, addSearchFilter } = require('../shared/filterUtils');
const { getCurrentAcademicYearStart } = require('../../utils/academicUtils');
const {
  ALL_STATUSES,
  DEFAULT_STATUS,
  parseStatusSelection,
  buildAcademicYearFilter,
} = require('./snapshotConditions');

const FILTER_SCOPES = {
  /** Populasi terpilih: status berjalan ATAU proyeksi status pada snapshot tahun. */
  POPULATION: 'population',
  /** Kohort intake: status diabaikan karena intake menghitung semua yang masuk. */
  COHORT: 'cohort',
  /** Lintas tahun: tahun akademik terpilih diabaikan, tren membangun perahunya sendiri. */
  ALL_YEARS: 'allYears',
};

function addOrCondition(where, condition) {
  where.AND = where.AND || [];
  where.AND.push({ OR: condition });
}

function getAcademicYear(targetAcademicYear) {
  if (!targetAcademicYear) return null;
  const value = String(targetAcademicYear);
  const match = value.match(/^(\d{4})\/(\d{4})$/);
  const startYear = match ? match[1] : value.length === 4 ? value : null;
  return startYear
    ? {
        startYear,
        endYear: match ? match[2] : String(Number(startYear) + 1),
        isCurrent: Number(startYear) === getCurrentAcademicYearStart(),
      }
    : null;
}

/**
 * Tahun akademik terpilih dari query — satu aturan untuk snapshot kartu,
 * jendela tren, dan proyeksi status tabel.
 * `selectedPeriode` tetap diterima untuk kompatibilitas link lama.
 */
function getSelectedAcademicYear(query = {}) {
  const candidate = query.tahunAjaran || query.selectedPeriode;
  return typeof candidate === 'string' && /^\d{4}\/\d{4}$/.test(candidate) ? candidate : null;
}

function buildPeriodeFilter(value) {
  if (value === 'Ganjil') return { endsWith: '1' };
  if (value === 'Genap') return { endsWith: '2' };
  return value;
}

function buildMultiSelectFilters(query, where) {
  const mappings = [
    ['fakultas', 'fakultas'],
    ['programStudi', 'programStudi'],
    ['jenjang', 'jenjang'],
    ['angkatan', 'angkatan'],
  ];
  mappings.forEach(([queryKey, field]) => addInFilter(where, field, query[queryKey]));

  const cohortYears = toArray(query.angkatanTahun);
  if (cohortYears) {
    addOrCondition(
      where,
      cohortYears.map((year) => ({ angkatan: { startsWith: year } })),
    );
  }

  const semesters = toArray(query.semester)
    ?.map(Number)
    .filter((value) => Number.isInteger(value) && value > 0);
  if (semesters?.length) where.semester = { in: semesters };
}

function buildStatusFilter(statusValues) {
  const { isAll, statuses } = parseStatusSelection(statusValues);
  // "Semua status" dikirim sebagai predikat eksplisit, bukan ketiadaan key,
  // supaya ensurePopulationFilter tidak mengumpulkannya kembali ke default.
  if (isAll) return { not: '' };
  return statuses.length === 1 ? statuses[0] : { in: statuses };
}

/**
 * True bila filter memuat batas snapshot tahun akademik. Satu-satunya produsen
 * `periodeMasuk: { lte }` adalah `buildAcademicYearFilter()`, jadi cukup
 * ditanya begitu — tanpa mencocokkan serialisasi kondisi.
 */
function isAcademicSnapshot(where = {}) {
  const conditions = Array.isArray(where.AND) ? where.AND : [];
  return conditions.some((condition) => Boolean(condition?.periodeMasuk?.lte));
}

/**
 * Ensure consistent population filter across all student services.
 * If statusKeaktifan is not explicitly set and we're not in academic snapshot mode,
 * default to 'Aktif' status.
 *
 * This eliminates duplicate logic in activeStudents.js and internationalTrend.js.
 *
 * @param {object} baseFilter - The base filter from buildStudentFilter()
 * @returns {object} Filter with guaranteed statusKeaktifan handling
 */
function ensurePopulationFilter(baseFilter = {}) {
  if (baseFilter.statusKeaktifan || isAcademicSnapshot(baseFilter)) {
    return baseFilter;
  }
  return { ...baseFilter, statusKeaktifan: DEFAULT_STATUS };
}

/**
 * buildStudentFilter — translates all filter query params to a Prisma where clause.
 *
 * Tahun Ajaran is a historical snapshot. A status filter is translated to
 * its state at the selected academic-year boundary, never compared blindly
 * with the latest status stored in the current Student row.
 *
 * `scope` memilih populasi, bukan membuang kondisi setelah filter jadi:
 * - COHORT: status tidak ikut membatasi (intake menghitung semua yang masuk),
 *   batas `periodeMasuk <= akhir tahun` tetap berlaku.
 * - ALL_YEARS: tahun akademik terpilih diabaikan; pemanggil membangun batas
 *   per tahunnya sendiri (tren lintas tahun).
 *
 * @param {object} query         Query parameter tervalidasi
 * @param {{scope?: string}} options
 */
function buildStudentFilter(query = {}, options = {}) {
  const scope = options.scope || FILTER_SCOPES.POPULATION;
  const cohortOnly = scope === FILTER_SCOPES.COHORT;
  const where = {};
  buildMultiSelectFilters(query, where);

  const academicYear =
    scope === FILTER_SCOPES.ALL_YEARS ? null : getAcademicYear(getSelectedAcademicYear(query));
  const statusValues = query.statusKeaktifan;

  // ── Tahun Ajaran snapshot ─────────────────────────────────────────────────
  // COHORT memakai encoding "semua status", jadi kondisi proyeksi status
  // memang tidak pernah dibangun — bukan dibuang setelah jadi.
  const academicConditions = buildAcademicYearFilter(
    academicYear,
    cohortOnly ? ALL_STATUSES : statusValues,
  );
  if (academicConditions.length) {
    where.AND = [...(where.AND || []), ...academicConditions];
  }
  // Ganjil/Genap adalah pilihan periode masuk, terpisah dari snapshot: selalu
  // diterapkan, di dalam AND (scope lain) maupun sebagai predicate langsung.
  const periodeMasukFilter = buildPeriodeFilter(query.periodeMasuk);
  if (query.periodeMasuk && periodeMasukFilter?.endsWith) {
    if (academicConditions.length) where.AND.push({ periodeMasuk: periodeMasukFilter });
    else where.periodeMasuk = periodeMasukFilter;
  }
  // CATATAN: Saat academicYear dipilih, kondisi periodeMasuk { lte } sudah ada
  // di dalam AND di atas. Kita TIDAK menambah periodeMasuk: { startsWith }
  // karena itu akan mempersempit hasil ke satu angkatan saja, bukan
  // seluruh histori s.d. tahun ajaran yang dipilih.

  if (query.kewarganegaraan === 'WNI') where.kewarganegaraan = 'Indonesia';
  else if (query.kewarganegaraan === 'WNA') where.NOT = { kewarganegaraan: 'Indonesia' };
  else if (query.kewarganegaraan) where.kewarganegaraan = query.kewarganegaraan;

  // Outside a snapshot, current status is the correct predicate. Within a
  // snapshot it has already been represented in the time-aware OR branches.
  if (!cohortOnly && !academicYear) where.statusKeaktifan = buildStatusFilter(statusValues);

  addSearchFilter(where, query.search);
  return where;
}

module.exports = {
  FILTER_SCOPES,
  buildStudentFilter,
  getAcademicYear,
  getSelectedAcademicYear,
  ensurePopulationFilter,
};
