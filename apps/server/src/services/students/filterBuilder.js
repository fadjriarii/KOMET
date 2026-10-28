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
const { addSearchFilter } = require('@komet/shared/filterUtils');
const { buildAcademicYearFilter } = require('./snapshotConditions');
const { buildMultiSelectFilters } = require('./filterBuilder/multiSelect');
const {
  getAcademicYear,
  getSelectedAcademicYear,
  buildPeriodeFilter,
} = require('./filterBuilder/academicYear');
const {
  ALL_STATUSES,
  buildStatusFilter,
  ensurePopulationFilter,
  foreignCondition,
} = require('./filterBuilder/statusScope');

const FILTER_SCOPES = {
  /** Populasi terpilih: status berjalan ATAU proyeksi status pada snapshot tahun. */
  POPULATION: 'population',
  /** Kohort intake: status diabaikan karena intake menghitung semua yang masuk. */
  COHORT: 'cohort',
  /** Lintas tahun: tahun akademik terpilih diabaikan, tren membangun perahunya sendiri. */
  ALL_YEARS: 'allYears',
};

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
  buildMultiSelectFilters(query, where, { skipCohortFilters: cohortOnly });

  const academicYear =
    scope === FILTER_SCOPES.ALL_YEARS ? null : getAcademicYear(getSelectedAcademicYear(query));
  const statusValues = query.statusKeaktifan;

  // ── Tahun Ajaran snapshot ─────────────────────────────────────────────────
  // COHORT memakai encoding "semua status", jadi kondisi proyeksi status
  // memang tidak pernah dibangun — bukan dibuang setelah jadi.
  const academicConditions = buildAcademicYearFilter(
    academicYear,
    cohortOnly ? ALL_STATUSES : statusValues,
    query.periodeAkademik,
  );
  if (academicConditions.length) {
    where.AND = [...(where.AND || []), ...academicConditions];
  }
  // Client punya satu filter Periode yang dikirim sebagai `periodeAkademik` dan
  // `periodeMasuk`. Di snapshot tahun ajaran artinya semester yang dilihat;
  // menambah syarat intake di sana menghilangkan mahasiswa intake Genap dari
  // semester Ganjil (dan cuti Genap dari intake Ganjil). Intake (COHORT) dan
  // filter tanpa tahun ajaran tetap membaca `periodeMasuk`.
  const periodeIsSemester = Boolean(academicYear && !cohortOnly && query.periodeAkademik);
  const periodeMasukFilter = buildPeriodeFilter(query.periodeMasuk);
  if (query.periodeMasuk && periodeMasukFilter?.endsWith && !periodeIsSemester) {
    if (academicConditions.length) where.AND.push({ periodeMasuk: periodeMasukFilter });
    else where.periodeMasuk = periodeMasukFilter;
  }
  // CATATAN: Saat academicYear dipilih, kondisi periodeMasuk { lte } sudah ada
  // di dalam AND di atas. Kita TIDAK menambah periodeMasuk: { startsWith }
  // karena itu akan mempersempit hasil ke satu angkatan saja, bukan
  // seluruh histori s.d. tahun ajaran yang dipilih.

  if (query.kewarganegaraan === 'WNI') where.kewarganegaraan = 'Indonesia';
  else if (query.kewarganegaraan === 'WNA') {
    // Aturan asing satu sumber (per kode negara); baris tanpa kewarganegaraan
    // tidak ikut terhitung WNA.
    where.AND = [...(where.AND || []), foreignCondition()];
  } else if (query.kewarganegaraan) where.kewarganegaraan = query.kewarganegaraan;

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
