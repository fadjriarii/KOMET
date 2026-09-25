/**
 * activeStudents.js
 * 
 * Menghitung total mahasiswa aktif dan breakdown multisektor (byProdi, byFaculty, byJenjang).
 */

const prisma = require('../../config/prisma');

/**
 * Hitung total mahasiswa aktif sesuai base filter.
 */
async function getTotalActiveStudents(baseFilter) {
    return prisma.student.count({
        where: {
            ...baseFilter,
            ...(baseFilter.statusKeaktifan ? {} : { statusKeaktifan: 'Aktif' })
        }
    });
}

/**
 * Breakdown multisektor mahasiswa aktif untuk ActiveStudentsView.jsx:
 * - byProdi: [{ name, count, percentage }]
 * - byFaculty: [{ name, count }]
 * - byJenjang: [{ name: "Sarjana (S1)", count }]
 */
async function getActiveStudentsMultisector(baseFilter) {
    const students = await prisma.student.findMany({
        where: {
            ...baseFilter,
            ...(baseFilter.statusKeaktifan ? {} : { statusKeaktifan: 'Aktif' })
        },
        select: { programStudi: true, fakultas: true, jenjang: true }
    });

    const totalCount = students.length;
    const prodiMap = {};
    const facultyMap = {};
    const jenjangMap = {};

    students.forEach(s => {
        const prodi = s.programStudi || 'Lainnya';
        const faculty = s.fakultas || 'Lainnya';
        let jenjangName = s.jenjang || 'Lainnya';
        if (jenjangName === 'S1') jenjangName = 'Sarjana (S1)';
        else if (jenjangName === 'S2') jenjangName = 'Magister (S2)';

        prodiMap[prodi] = (prodiMap[prodi] || 0) + 1;
        facultyMap[faculty] = (facultyMap[faculty] || 0) + 1;
        jenjangMap[jenjangName] = (jenjangMap[jenjangName] || 0) + 1;
    });

    const byProdi = Object.entries(prodiMap).map(([name, count]) => {
        const pct = totalCount > 0 ? ((count / totalCount) * 100).toFixed(1) : '0';
        return {
            name,
            count,
            formattedCount: new Intl.NumberFormat('id-ID').format(count),
            percentage: `${pct}%`,
            percentageFormatted: `${pct}%`
        };
    }).sort((a, b) => b.count - a.count);

    const byFaculty = Object.entries(facultyMap).map(([name, count]) => {
        const pct = totalCount > 0 ? ((count / totalCount) * 100).toFixed(1) : '0';
        return {
            name,
            count,
            formattedCount: new Intl.NumberFormat('id-ID').format(count),
            percentage: `${pct}%`,
            percentageFormatted: `${pct}%`
        };
    }).sort((a, b) => b.count - a.count);

    const byJenjang = Object.entries(jenjangMap).map(([name, count]) => {
        const pct = totalCount > 0 ? ((count / totalCount) * 100).toFixed(1) : '0';
        return {
            name,
            count,
            formattedCount: new Intl.NumberFormat('id-ID').format(count),
            percentage: `${pct}%`,
            percentageFormatted: `${pct}%`
        };
    }).sort((a, b) => b.count - a.count);

    return { totalActiveStudents: totalCount, byProdi, byFaculty, byJenjang };
}

module.exports = { getTotalActiveStudents, getActiveStudentsMultisector };
