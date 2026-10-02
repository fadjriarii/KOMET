const prisma = require('../../config/prisma');
const { getAcademicYear } = require('./filterBuilder');

function getRequestedAcademicYear(query = {}) {
    const tahunAjaran = typeof query.tahunAjaran === 'string' ? query.tahunAjaran : null;
    const selectedPeriode = typeof query.selectedPeriode === 'string' ? query.selectedPeriode : null;
    return getAcademicYear(tahunAjaran || (selectedPeriode?.includes('/') ? selectedPeriode : null));
}

/**
 * A Student row stores the latest SEVIMA status. For historical snapshots the
 * table must instead show the status at the selected year boundary. A future
 * graduation/exit is therefore rendered as Aktif in an earlier snapshot.
 */
function getSnapshotStatus(student, academicYear) {
    if (!academicYear) return student.statusKeaktifan;
    const academicEnd = `${academicYear.startYear}2`;
    const finalPeriod = String(student.periodeTerakhir || '').trim();
    const hasReachedFinalStatus = finalPeriod
        && finalPeriod <= academicEnd
        && student.statusKeaktifan !== 'Aktif';
    return hasReachedFinalStatus ? student.statusKeaktifan : 'Aktif';
}

function projectSnapshotStudent(student, academicYear) {
    if (!academicYear) return student;
    const snapshotStatus = getSnapshotStatus(student, academicYear);
    return {
        ...student,
        // Preserve the current value for API consumers that need auditing,
        // while the standard status field represents the requested snapshot.
        currentStatusKeaktifan: student.statusKeaktifan,
        statusKeaktifan: snapshotStatus,
    };
}

/**
 * Mengambil daftar mahasiswa dari database dengan filter, pagination, dan default sort.
 *
 * Default behaviour (sesuai business rules):
 *   - Filter default: hanya mahasiswa dengan statusKeaktifan = "Aktif"
 *     (kecuali jika caller sudah menyertakan filter statusKeaktifan di whereFilter)
 *   - Sort default: descending berdasarkan angkatan (mahasiswa paling baru di atas),
 *     lalu nama ascending sebagai tiebreaker
 *
 * @param {object} whereFilter  Prisma where clause dari buildStudentFilter()
 * @param {number} page         Halaman (default 1)
 * @param {number} limit        Jumlah baris per halaman (default 10)
 */
async function getStudentList(whereFilter, page = 1, limit = 10, cursor, query = {}) {
    const skip = (page - 1) * limit;

    if (cursor) {
        const cursorStudent = await prisma.student.findUnique({
            where: { nim: cursor },
            select: { nim: true }
        });
        if (!cursorStudent) {
            const error = new Error('Invalid cursor.');
            error.statusCode = 400;
            throw error;
        }
    }

    const listQuery = buildStudentListQuery(whereFilter, page, limit, cursor);
    const [rawData, total] = await Promise.all([
        prisma.student.findMany(listQuery),
        prisma.student.count({ where: whereFilter })
    ]);

    const hasNextPage = rawData.length > limit;
    const academicYear = getRequestedAcademicYear(query);
    const data = rawData.slice(0, limit).map((student) => projectSnapshotStudent(student, academicYear));
    return {
        data,
        nextCursor: hasNextPage ? data[data.length - 1].nim : null,
        hasNextPage,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}

function buildStudentListQuery(whereFilter, page, limit, cursor) {
    const skip = (page - 1) * limit;
    const query = {
        where: whereFilter,
        select: {
            nim: true,
            nama: true,
            angkatan: true,
            periode: true,
            periodeMasuk: true,
            periodeTerakhir: true,
            programStudi: true,
            fakultas: true,
            jenjang: true,
            semester: true,
            kewarganegaraan: true,
            statusKeaktifan: true
        },
        take: limit + 1,
        orderBy: { nim: 'asc' }
    };

    if (cursor) {
        query.cursor = { nim: cursor };
        query.skip = 1;
    }
    else query.skip = skip;

    return query;
}

module.exports = {
    getStudentList,
    buildStudentListQuery,
    getRequestedAcademicYear,
    getSnapshotStatus,
    projectSnapshotStudent,
};
