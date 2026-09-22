const prisma = require('../../config/prisma');

async function getStudentList(whereFilter, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
        prisma.student.findMany({
            where: whereFilter,
            select: {
                nim: true,
                nama: true,
                angkatan: true,
                periodeMasuk: true,
                programStudi: true,
                fakultas: true,
                semester: true,
                kewarganegaraan: true,
                statusKeaktifan: true
            },
            skip,
            take: limit,
            orderBy: { nama: 'asc' }
        }),
        prisma.student.count({ where: whereFilter })
    ]);
    
    // Sediakan versi camelCase & snake_case (program_studi, status_keaktifan, periode)
    const formattedData = data.map(s => ({
        ...s,
        program_studi: s.programStudi,
        status_keaktifan: s.statusKeaktifan,
        periode: s.periodeMasuk
    }));

    return {
        data: formattedData,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}

module.exports = { getStudentList };