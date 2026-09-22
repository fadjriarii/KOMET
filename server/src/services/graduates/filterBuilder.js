/**
 * filterBuilder.js
 * 
 * Mengkonversi query parameters dari HTTP request menjadi Prisma where clause
 * untuk tabel graduates (dan relasi student).
 */

const { getPaginationParams } = require('../../utils/paginationUtils');
const { toArray } = require('../../utils/queryUtils');

function buildGraduateFilter(query) {
    const {
        programStudi,
        tahunLulus,
        periodeWisuda,
        statusKelulusan,
        fakultas,
        periodeMasuk,
        jenjang,
        search
    } = query;

    const where = {};

    // Filter langsung di tabel graduates
    if (jenjang) where.jenjang = jenjang;

    const tahunLulusArr = toArray(tahunLulus);
    if (tahunLulusArr && tahunLulusArr.length > 0) where.tahunLulus = { in: tahunLulusArr };

    const periodeWisudaArr = toArray(periodeWisuda);
    if (periodeWisudaArr && periodeWisudaArr.length > 0) where.periodeWisuda = { in: periodeWisudaArr };

    const statusKelulusanArr = toArray(statusKelulusan);
    if (statusKelulusanArr && statusKelulusanArr.length > 0) where.statusKelulusan = { in: statusKelulusanArr };

    // Filter lewat relasi ke student
    const studentFilter = {};
    const prodiArr = toArray(programStudi);
    if (prodiArr) studentFilter.programStudi = { in: prodiArr };

    if (fakultas) studentFilter.fakultas = fakultas;
    if (periodeMasuk) studentFilter.periodeMasuk = periodeMasuk;
    if (search && search.trim()) {
        const searchTerm = search.trim().substring(0, 100); // Batasi 100 karakter
        studentFilter.OR = [
            { nim: { contains: searchTerm } },
            { nama: { contains: searchTerm } }
        ];
    }

    if (Object.keys(studentFilter).length > 0) {
        where.student = studentFilter;
    }

    return where;
}

module.exports = { buildGraduateFilter, getPaginationParams };
