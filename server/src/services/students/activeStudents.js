/**
 * activeStudents.js
 * 
 * Menghitung total mahasiswa aktif dan breakdown multisektor (byProdi, byFaculty, byJenjang).
 */

const prisma = require('../../config/prisma');
const { ensurePopulationFilter } = require('./filterBuilder');

/**
 * Hitung total mahasiswa aktif sesuai base filter.
 */
async function getTotalActiveStudents(baseFilter) {
    return prisma.student.count({
        where: ensurePopulationFilter(baseFilter)
    });
}

/**
 * Breakdown multisektor mahasiswa aktif untuk ActiveStudentsView.jsx:
 * - byProdi: [{ name, count, percentage }]
 * - byFaculty: [{ name, count }]
 * - byJenjang: [{ name: "Sarjana (S1)", count }]
 */
async function getActiveStudentsMultisector(baseFilter) {
    const where = ensurePopulationFilter(baseFilter);

    const [totalCount, rawProdi, rawFaculty, rawJenjang] = await Promise.all([
        prisma.student.count({ where }),
        prisma.student.groupBy({
            by: ['programStudi'],
            where,
            _count: { programStudi: true },
            orderBy: { _count: { programStudi: 'desc' } }
        }),
        prisma.student.groupBy({
            by: ['fakultas'],
            where,
            _count: { fakultas: true },
            orderBy: { _count: { fakultas: 'desc' } }
        }),
        prisma.student.groupBy({
            by: ['jenjang'],
            where,
            _count: { jenjang: true },
            orderBy: { _count: { jenjang: 'desc' } }
        })
    ]);

    const formatter = new Intl.NumberFormat('id-ID');
    const toPercentage = (count) => (
        totalCount > 0 ? ((count / totalCount) * 100).toFixed(1) : '0'
    );
    const mapResult = (raw, nameKey, countKey) => raw.map((item) => {
        let name = item[nameKey] || 'Lainnya';
        if (nameKey === 'jenjang') {
            if (name === 'S1') name = 'Sarjana (S1)';
            else if (name === 'S2') name = 'Magister (S2)';
        }

        const count = item._count[countKey];
        const percentage = `${toPercentage(count)}%`;
        return {
            name,
            count,
            formattedCount: formatter.format(count),
            percentage,
            percentageFormatted: percentage
        };
    });

    return {
        totalActiveStudents: totalCount,
        byProdi: mapResult(rawProdi, 'programStudi', 'programStudi'),
        byFaculty: mapResult(rawFaculty, 'fakultas', 'fakultas'),
        byJenjang: mapResult(rawJenjang, 'jenjang', 'jenjang')
    };
}

module.exports = { getTotalActiveStudents, getActiveStudentsMultisector };
