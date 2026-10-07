/**
 * Translates student query parameters into Prisma where clauses. Keeping the
 * small builders here makes the list, KPI, and detail endpoints share exactly
 * the same population definition.
 *
 * Satu builder, beberapa scope. Perbedaan populasi antar kartu dinyatakan di
 * pemanggil lewat `scope`, bukan lewat manipulasi string/JSON atas filter yang
 * sudah jadi — jadi tidak ada jalur kode yang "membuang" kondisi dengan
 * mencocokkan hasil serialisasinya.
 */
const { getPaginationParams } = require('../../utils/paginationUtils');
const { toArray } = require('../shared/filterUtils');
const { getCurrentAcademicYearStart } = require('../../utils/academicUtils');
const { STUDENT_STATUS } = require('@komet/shared/constants');

const FILTER_SCOPES = {
  /** Populasi terpilih: status berjalan ATAU proyeksi status pada snapshot tahun. */
  POPULATION: 'population',
  /** Kohort intake: status diabaikan karena intake menghitung semua yang masuk. */
  COHORT: 'cohort',
  /** Lintas tahun: tahun akademik terpilih diabaikan, tren membangun perahunya sendiri. */
  ALL_YEARS: 'allYears',
};

/** Batas periode kode (`YYYY1`/`YYYY2`) untuk satu tahun akademik. */
function getAcademicPeriodBounds(academicYear) {
  const startYear =
    typeof academicYear === 'object' && academicYear ? academicYear.startYear : academicYear;
  return { start: `${startYear}1`, end: `${startYear}2` };
}

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

/**
 * Satu encoding untuk "semua status": sentinel ALL dari klien. Nilai kosong
 * atau tidak dikirim berarti populasi default dashboard (DEFAULT_STATUS).
 */
const ALL_STATUSES = 'ALL';
const DEFAULT_STATUS = STUDENT_STATUS.AKTIF;

/**
 * @returns {{isAll: boolean, statuses: string[]}} pemilihan status ternormalisasi.
 */
function parseStatusSelection(statusValues) {
  const values = (toArray(statusValues) || []).filter(Boolean);
  if (values.includes(ALL_STATUSES)) return { isAll: true, statuses: [] };
  return { isAll: false, statuses: values.length ? values : [DEFAULT_STATUS] };
}

/** Predikat Prisma yang berarti "semua status"; dikenali isAllStatusesPredicate(). */
function allStatusesPredicate() {
  return { not: '' };
}

function isAllStatusesPredicate(value) {
  return value?.not === '';
}

/**
 * Builds the status predicate for a historical academic-year snapshot.
 *
 * `statusKeaktifan` is the latest state from SEVIMA, while
 * `periodeTerakhir` is the period in which a non-active student left/changed
 * status. Applying `statusKeaktifan = 'Aktif'` directly therefore loses a
 * student who graduated in a later year. Conversely, applying `Lulus`
 * directly leaks future graduations into older snapshots.
 *
 * For target academic year T:
 * - Aktif: current Aktif records, records without an exit period, or records
 *   whose exit period falls within or after T. They were still active during T.
 * - Other statuses: their latest status is included only from the academic year
 *   after its recorded exit period. This prevents one record from being both
 *   Aktif and terminal in the same academic year.
 * - Semua status: every student admitted by T is present; each row's display
 *   status is projected separately by `studentList`.
 */
function buildTerminalPeriodCondition(academicStart, academicEnd) {
  return {
    OR: [
      { periodeTerakhir: { not: '', lt: academicStart } },
      { periodeTerakhir: academicStart },
      {
        AND: [{ periodeTerakhir: academicEnd }, { periodeMasuk: { endsWith: '1' } }],
      },
    ],
  };
}

function buildActiveSnapshotCondition(academicStart, academicEnd) {
  return {
    OR: [
      { statusKeaktifan: DEFAULT_STATUS },
      { periodeTerakhir: '' },
      { periodeTerakhir: { gt: academicEnd } },
      {
        AND: [{ periodeTerakhir: academicEnd }, { periodeMasuk: { endsWith: '2' } }],
      },
    ],
  };
}

/**
 * Penilai kondisi Prisma skala kecil untuk SATU baris mahasiswa.
 *
 * Aturan snapshot cukup ditulis sekali (di `buildTerminalPeriodCondition` dkk);
 * fungsi ini memakainya di sisi JavaScript supaya proyeksi status tabel tidak
 * pernah menjadi implementasi paralel dari kondisi SQL. Operator yang belum
 * dikenali melempar error — diam-diam mengembalikan `true`/`false` akan membuat
 * kondisi baru terlihat cocok padahal tidak.
 */
function matchesFieldValue(value, rule) {
  const actual = String(value ?? '');
  if (rule === null || typeof rule === 'string' || typeof rule === 'number') {
    return actual === String(rule);
  }
  return Object.entries(rule).every(([operator, operand]) => {
    switch (operator) {
      case 'equals':
        return actual === String(operand);
      // Perbandingan string murni seperti MySQL; nilai kosong sengaja TIDAK
      // dikecualikan di sini — kondisi yang butuh "harus terisi" menyatakan
      // `{ not: '' }` sendiri, sama seperti di SQL.
      case 'lt':
        return actual < String(operand);
      case 'lte':
        return actual <= String(operand);
      case 'gt':
        return actual > String(operand);
      case 'gte':
        return actual >= String(operand);
      case 'not':
        return actual !== String(operand);
      case 'in':
        return operand.map(String).includes(actual);
      case 'endsWith':
        return actual.endsWith(String(operand));
      case 'startsWith':
        return actual.startsWith(String(operand));
      default:
        throw new Error(`matchesFieldValue: operator "${operator}" belum didukung`);
    }
  });
}

function matchesStudentCondition(row = {}, condition = {}) {
  return Object.entries(condition).every(([key, rule]) => {
    if (key === 'AND') return rule.every((nested) => matchesStudentCondition(row, nested));
    if (key === 'OR') return rule.some((nested) => matchesStudentCondition(row, nested));
    if (key === 'NOT') return !matchesStudentCondition(row, rule);
    return matchesFieldValue(row[key], rule);
  });
}

/**
 * Status akhir mana yang sudah tercapai pada tahun akademik `academicYear`.
 * Satu sumber kebenaran dengan `buildTerminalPeriodCondition` — kondisi yang
 * sama dievaluasi di sini, tidak diulang sebagai cabang `if` tersendiri.
 */
function isTerminalInAcademicYear(student, academicYear) {
  const { start, end } = getAcademicPeriodBounds(academicYear);
  return matchesStudentCondition(student, buildTerminalPeriodCondition(start, end));
}

function buildSnapshotStatusCondition(academicStart, academicEnd, statusValues) {
  const { isAll, statuses } = parseStatusSelection(statusValues);
  if (isAll) return null;

  const branches = [];
  if (statuses.includes(DEFAULT_STATUS)) {
    branches.push(buildActiveSnapshotCondition(academicStart, academicEnd));
  }

  const terminalStatuses = statuses.filter((status) => status !== DEFAULT_STATUS);
  if (terminalStatuses.length) {
    branches.push({
      AND: [
        {
          statusKeaktifan:
            terminalStatuses.length === 1 ? terminalStatuses[0] : { in: terminalStatuses },
        },
        buildTerminalPeriodCondition(academicStart, academicEnd),
      ],
    });
  }

  return branches.length ? { OR: branches } : null;
}

/** Snapshot predicates for one academic year. */
function buildAcademicYearFilter(academicYear, statusValues) {
  if (!academicYear) return [];
  const { start, end } = getAcademicPeriodBounds(academicYear);
  const conditions = [{ periodeMasuk: { lte: end } }];
  const snapshotStatusCondition = buildSnapshotStatusCondition(start, end, statusValues);
  if (snapshotStatusCondition) conditions.push(snapshotStatusCondition);
  return conditions;
}

function buildMultiSelectFilters(query, where) {
  const mappings = [
    ['fakultas', 'fakultas'],
    ['programStudi', 'programStudi'],
    ['jenjang', 'jenjang'],
    ['angkatan', 'angkatan'],
  ];
  mappings.forEach(([queryKey, field]) => {
    const values = toArray(query[queryKey]);
    if (values) where[field] = { in: values };
  });

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
  if (isAll) return allStatusesPredicate();
  return statuses.length === 1 ? statuses[0] : { in: statuses };
}

function buildSearchFilter(search) {
  const searchTerm = typeof search === 'string' ? search.trim().substring(0, 100) : '';
  return searchTerm
    ? [{ nim: { contains: searchTerm } }, { nama: { contains: searchTerm } }]
    : null;
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

  if (query.periode) where.periode = query.periode;
  if (query.kewarganegaraan === 'WNI') where.kewarganegaraan = 'Indonesia';
  else if (query.kewarganegaraan === 'WNA') where.NOT = { kewarganegaraan: 'Indonesia' };
  else if (query.kewarganegaraan) where.kewarganegaraan = query.kewarganegaraan;

  // Outside a snapshot, current status is the correct predicate. Within a
  // snapshot it has already been represented in the time-aware OR branches.
  if (!cohortOnly && !academicYear) where.statusKeaktifan = buildStatusFilter(statusValues);

  const searchFilter = buildSearchFilter(query.search);
  if (searchFilter) addOrCondition(where, searchFilter);
  return where;
}

module.exports = {
  FILTER_SCOPES,
  buildStudentFilter,
  buildAcademicYearFilter,
  buildSnapshotStatusCondition,
  buildTerminalPeriodCondition,
  buildActiveSnapshotCondition,
  matchesStudentCondition,
  isTerminalInAcademicYear,
  parseStatusSelection,
  allStatusesPredicate,
  isAllStatusesPredicate,
  ALL_STATUSES,
  DEFAULT_STATUS,
  getAcademicPeriodBounds,
  getAcademicYear,
  getSelectedAcademicYear,
  buildPeriodeFilter,
  buildStatusFilter,
  buildSearchFilter,
  buildMultiSelectFilters,
  isAcademicSnapshot,
  ensurePopulationFilter,
  getPaginationParams,
};
