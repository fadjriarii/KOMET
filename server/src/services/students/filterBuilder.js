/**
 * Translates student query parameters into Prisma where clauses. Keeping the
 * small builders here makes the list, KPI, and detail endpoints share exactly
 * the same population definition.
 */
const { getPaginationParams } = require('../../utils/paginationUtils');
const { toArray } = require('../../utils/queryUtils');
const { getCurrentAcademicYearStart } = require('../../utils/academicUtils');

function addOrCondition(where, condition) {
    where.AND = where.AND || [];
    where.AND.push({ OR: condition });
}

function getAcademicYear(targetAcademicYear) {
    if (!targetAcademicYear) return null;
    const value = String(targetAcademicYear);
    const match = value.match(/^(\d{4})\/(\d{4})$/);
    const startYear = match ? match[1] : (value.length === 4 ? value : null);
    return startYear ? {
        startYear,
        endYear: match ? match[2] : String(Number(startYear) + 1),
        isCurrent: Number(startYear) === getCurrentAcademicYearStart(),
    } : null;
}

function buildPeriodeFilter(value) {
    if (value === 'Ganjil') return { endsWith: '1' };
    if (value === 'Genap') return { endsWith: '2' };
    return value;
}

/**
 * Snapshot predicates for one academic year.
 *
 * A blank `periodeTerakhir` means that no exit period is known. The old
 * implementation attempted to infer this with an OR clause for every cohort
 * since 1900. Besides producing hundreds of SQL predicates, that inference
 * was unreliable for incomplete sync records. A known intake period plus a
 * positive semester is the direct, safe fallback; an explicit exit period
 * remains the authoritative historical boundary.
 */
function buildAcademicYearFilter(academicYear, statusValues) {
    if (!academicYear) return [];
    const academicStart = `${academicYear.startYear}1`;
    const academicEnd = `${academicYear.startYear}2`;
    const conditions = [{ periodeMasuk: { lte: academicEnd } }];

    const isAllStatus = Array.isArray(statusValues)
        ? (statusValues.length === 0 || statusValues.includes('ALL') || statusValues.includes('__ALL__'))
        : (statusValues === 'ALL' || statusValues === '__ALL__');

    const isOnlyActive = Array.isArray(statusValues)
        ? (statusValues.length === 1 && statusValues[0] === 'Aktif')
        : (statusValues === 'Aktif' || statusValues === undefined || statusValues === null);

    if (isOnlyActive && !isAllStatus) {
        if (!academicYear.isCurrent) {
            conditions.push({
                OR: [
                    { periodeTerakhir: '' },
                    { periodeTerakhir: { gte: academicStart } }
                ]
            });
        }
    }
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
        addOrCondition(where, cohortYears.map((year) => ({ angkatan: { startsWith: year } })));
    }

    const semesters = toArray(query.semester)
        ?.map(Number)
        .filter((value) => Number.isInteger(value) && value > 0);
    if (semesters?.length) where.semester = { in: semesters };
}

function buildStatusFilter(statusValues) {
    // statusValues can be: undefined (not sent), [] (explicit empty = no filter), 
    // ['Aktif'] (default), ['ALL'] or ['__ALL__'] (legacy no filter), or array of statuses.
    const isExplicitlyEmpty = Array.isArray(statusValues) && statusValues.length === 0;
    const isNotSent = statusValues === undefined || statusValues === null;

    if (isExplicitlyEmpty) return undefined;
    if (statusValues?.includes('__ALL__') || statusValues?.includes('ALL')) return undefined;
    if (isNotSent) return 'Aktif';

    return statusValues.length === 1 ? statusValues[0] : { in: statusValues };
}

function buildSearchFilter(search) {
    const searchTerm = typeof search === 'string' ? search.trim().substring(0, 100) : '';
    return searchTerm ? [
        { nim: { contains: searchTerm } },
        { nama: { contains: searchTerm } }
    ] : null;
}

function isAcademicSnapshot(where = {}) {
    return Array.isArray(where.AND) && where.AND.some((condition) => (
        condition?.periodeMasuk?.lte
        || condition?.OR?.some((item) => item?.periodeTerakhir?.gte)
    ));
}

/**
 * Ensure consistent population filter across all student services.
 * If statusKeaktifan is not explicitly set and we're not in academic snapshot mode,
 * default to 'Aktif' status.
 * 
 * This eliminates duplicate logic in activeStudents.js and internationalTrend.js.
 * 
 * @param {object} baseFilter - The base filter from buildBaseFilter()
 * @returns {object} Filter with guaranteed statusKeaktifan handling
 */
function ensurePopulationFilter(baseFilter = {}) {
    if (baseFilter.statusKeaktifan || isAcademicSnapshot(baseFilter)) {
        return baseFilter;
    }
    return { ...baseFilter, statusKeaktifan: 'Aktif' };
}

/**
 * Build a stateless filter for historical cohort queries (intake/decline trends).
 * These queries intentionally ignore statusKeaktifan because they count ALL students
 * who entered in a given year, regardless of their current status.
 * 
 * @param {object} baseFilter - The base filter from buildBaseFilter()
 * @returns {object} Filter without statusKeaktifan predicate
 */
function buildStatelessFilter(baseFilter = {}) {
    const result = { ...baseFilter };
    delete result.statusKeaktifan;
    
    // Also remove academic snapshot conditions for intake queries
    if (Array.isArray(result.AND)) {
        result.AND = result.AND.filter((condition) => {
            if (condition?.periodeMasuk?.lte) return false;
            if (condition?.OR?.some((item) => item?.periodeTerakhir !== undefined)) return false;
            return true;
        });
        if (!result.AND.length) delete result.AND;
    }
    
    return result;
}

/**
 * buildWhereClause — translates all filter query params to a Prisma where clause.
 *
 * Tahun Ajaran + Status logic:
 *  - Status 'Aktif' (default) + Tahun Ajaran:
 *      Tampilkan mahasiswa AKTIF yang masuk s.d. akhir tahun ajaran.
 *      Untuk TA historis: tambah filter periodeTerakhir (masih terdaftar).
 *  - 'Semua Status' (ALL/__ALL__/[]) + Tahun Ajaran:
 *      Tampilkan SEMUA mahasiswa (dari awal berdiri) yang masuk s.d. TA,
 *      tanpa filter status. Tidak ada batas periodeTerakhir.
 *  - 'Lulus' / 'Transfer' / status lain + Tahun Ajaran:
 *      Tampilkan mahasiswa dengan status tersebut yang masuk s.d. akhir TA.
 *      Tidak perlu filter periodeTerakhir — statusKeaktifan sudah cukup.
 */
function buildWhereClause(query = {}, { forStats = false } = {}) {
    const where = {};
    buildMultiSelectFilters(query, where);

    const tahunAjaran = typeof query.tahunAjaran === 'string' ? query.tahunAjaran : null;
    const selectedPeriode = typeof query.selectedPeriode === 'string' ? query.selectedPeriode : null;
    const targetAcademicYear = tahunAjaran
        || (selectedPeriode?.includes('/') ? selectedPeriode : null);
    const academicYear = getAcademicYear(targetAcademicYear);
    const statusValues = toArray(query.statusKeaktifan);

    // ── Tahun Ajaran filter ──────────────────────────────────────────────────
    // Pass statusValues so buildAcademicYearFilter knows whether to add the
    // periodeTerakhir snapshot boundary (only for status 'Aktif' + historis).
    const academicConditions = buildAcademicYearFilter(academicYear, statusValues);
    if (academicConditions.length) {
        where.AND = [...(where.AND || []), ...academicConditions];
        if (query.periodeMasuk) {
            const periodeFilter = buildPeriodeFilter(query.periodeMasuk);
            if (periodeFilter?.endsWith) where.AND.push({ periodeMasuk: periodeFilter });
        }
    } else if (query.periodeMasuk) {
        // Tidak ada Tahun Ajaran — terapkan filter periodeMasuk sendiri.
        where.periodeMasuk = buildPeriodeFilter(query.periodeMasuk);
    }
    // CATATAN: Saat academicYear dipilih, kondisi periodeMasuk { lte } sudah ada
    // di dalam AND di atas. Kita TIDAK menambah periodeMasuk: { startsWith }
    // karena itu akan mempersempit hasil ke satu angkatan saja, bukan
    // seluruh histori s.d. tahun ajaran yang dipilih.

    if (query.periode) where.periode = query.periode;
    if (query.kewarganegaraan === 'WNI') where.kewarganegaraan = 'Indonesia';
    else if (query.kewarganegaraan === 'WNA') where.NOT = { kewarganegaraan: 'Indonesia' };
    else if (query.kewarganegaraan) where.kewarganegaraan = query.kewarganegaraan;

    const statusFilter = buildStatusFilter(statusValues);
    if (statusFilter !== undefined) where.statusKeaktifan = statusFilter;

    const searchFilter = buildSearchFilter(query.search);
    if (searchFilter) addOrCondition(where, searchFilter);
    return where;
}

function buildStudentFilter(query) {
    return buildWhereClause(query, { forStats: false });
}

function buildBaseFilter(query) {
    return buildWhereClause(query, { forStats: true });
}

module.exports = {
    buildStudentFilter,
    buildBaseFilter,
    buildWhereClause,
    buildAcademicYearFilter,
    buildPeriodeFilter,
    buildStatusFilter,
    buildSearchFilter,
    buildMultiSelectFilters,
    isAcademicSnapshot,
    ensurePopulationFilter,
    buildStatelessFilter,
    getPaginationParams,
};
