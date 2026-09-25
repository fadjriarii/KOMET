const prisma = require('../../config/prisma');

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
async function getStudentList(whereFilter, page = 1, limit = 10, cursor) {
    const skip = (page - 1) * limit;

    const query = buildStudentListQuery(whereFilter, page, limit, cursor);
    const [rawData, total] = await Promise.all([
        prisma.student.findMany(query),
        prisma.student.count({ where: whereFilter })
    ]);

    const hasNextPage = rawData.length > limit;
    const data = rawData.slice(0, limit);
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

module.exports = { getStudentList, buildStudentListQuery };
