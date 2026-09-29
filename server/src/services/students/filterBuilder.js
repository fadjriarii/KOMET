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
function buildAcademicYearFilter(academicYear) {
    if (!academicYear) return [];
    const academicStart = `${academicYear.startYear}1`;
    const academicEnd = `${academicYear.startYear}2`;
    const conditions = [{ periodeMasuk: { lte: academicEnd } }];

    if (academicYear.isCurrent) {
        conditions.push({
            OR: [
                { periodeTerakhir: '' },
                { periodeTerakhir: { gte: academicStart } }
            ]
        });
    } else {
        conditions.push({
            OR: [
                { periodeTerakhir: { gte: academicStart } },
                { AND: [{ periodeTerakhir: '' }, { semester: { gte: 1 } }] }
            ]
        });
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

function buildStatusFilter(statusValues, academicYear, forStats) {
    if (statusValues?.includes('__ALL__')) return { not: '' };

    const hasDefaultActive = !statusValues
        || (statusValues.length === 1 && statusValues[0] === 'Aktif');
    // Historic snapshots describe the population in that year, so today's
    // status must not remove students who were enrolled then.
    if (academicYear && !academicYear.isCurrent && hasDefaultActive) return undefined;
    if (academicYear && academicYear.isCurrent && hasDefaultActive) return 'Aktif';
    if (statusValues?.length) return statusValues.length === 1 ? statusValues[0] : { in: statusValues };
    // List and statistics deliberately share the same default population.
    return forStats ? 'Aktif' : 'Aktif';
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

function buildWhereClause(query = {}, { forStats = false } = {}) {
    const where = {};
    buildMultiSelectFilters(query, where);

    const targetAcademicYear = query.tahunAjaran
        || (query.selectedPeriode?.includes('/') ? query.selectedPeriode : null);
    const academicYear = getAcademicYear(targetAcademicYear);
    const academicConditions = buildAcademicYearFilter(academicYear);
    if (academicConditions.length) {
        where.AND = [...(where.AND || []), ...academicConditions];
        if (query.periodeMasuk) {
            const periodeFilter = buildPeriodeFilter(query.periodeMasuk);
            if (periodeFilter?.endsWith) where.AND.push({ periodeMasuk: periodeFilter });
        }
    } else if (query.periodeMasuk && academicYear) {
        const periodeFilter = buildPeriodeFilter(query.periodeMasuk);
        where.periodeMasuk = periodeFilter?.endsWith
            ? { startsWith: academicYear.startYear, endsWith: periodeFilter.endsWith }
            : { startsWith: academicYear.startYear };
    } else if (query.periodeMasuk) {
        where.periodeMasuk = buildPeriodeFilter(query.periodeMasuk);
    } else if (academicYear) {
        where.periodeMasuk = { startsWith: academicYear.startYear };
    }

    if (query.periode) where.periode = query.periode;
    if (query.kewarganegaraan === 'WNI') where.kewarganegaraan = 'Indonesia';
    else if (query.kewarganegaraan === 'WNA') where.NOT = { kewarganegaraan: 'Indonesia' };
    else if (query.kewarganegaraan) where.kewarganegaraan = query.kewarganegaraan;

    const statusFilter = buildStatusFilter(toArray(query.statusKeaktifan), academicYear, forStats);
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
    getPaginationParams,
};
