/**
 * filterBuilder.js
 * 
 * Mengkonversi query parameters dari HTTP request menjadi Prisma where clause.
 * Digunakan oleh semua service stats agar filter konsisten di setiap endpoint.
 */

const { getPaginationParams } = require('../../utils/paginationUtils');
const { toArray } = require('../../utils/queryUtils');

/**
 * Build filter untuk tabel mahasiswa — semua parameter user berlaku penuh.
 * Termasuk statusKeaktifan, semester, dan search.
 */
function buildStudentFilter(query) {
    const {
        fakultas,
        programStudi,
        angkatan,
        semester,
        periodeMasuk,
        kewarganegaraan,
        statusKeaktifan,
        search
    } = query;

    const where = {};

    // Multi-select: gunakan Prisma `in` operator
    const fakultasArr = toArray(fakultas);
    if (fakultasArr) where.fakultas = { in: fakultasArr };

    const prodiArr = toArray(programStudi);
    if (prodiArr) where.programStudi = { in: prodiArr };

    const angkatanArr = toArray(angkatan);
    if (angkatanArr) where.angkatan = { in: angkatanArr };

    const semArr = toArray(semester);
    if (semArr) {
        const semList = semArr.map(Number).filter(n => !isNaN(n) && n > 0);
        if (semList.length > 0) where.semester = { in: semList };
    }

    // Single-select (dropdown)
    if (periodeMasuk) where.periodeMasuk = periodeMasuk;
    if (kewarganegaraan) where.kewarganegaraan = kewarganegaraan;
    if (statusKeaktifan) where.statusKeaktifan = statusKeaktifan;

    if (search && search.trim()) {
        const searchTerm = search.trim().substring(0, 100);
        where.OR = [
            { nim: { contains: searchTerm } },
            { nama: { contains: searchTerm } }
        ];
    }

    return where;
}

/**
 * Build filter "dasar" untuk kalkulasi statistik card.
 */
function buildBaseFilter(query) {
    const {
        fakultas,
        programStudi,
        angkatan,
        periodeMasuk,
        kewarganegaraan,
        search
    } = query;

    const where = {};

    const fakultasArr = toArray(fakultas);
    if (fakultasArr) where.fakultas = { in: fakultasArr };

    const prodiArr = toArray(programStudi);
    if (prodiArr) where.programStudi = { in: prodiArr };

    const angkatanArr = toArray(angkatan);
    if (angkatanArr) where.angkatan = { in: angkatanArr };

    if (periodeMasuk) where.periodeMasuk = periodeMasuk;
    if (kewarganegaraan) where.kewarganegaraan = kewarganegaraan;

    if (search && search.trim()) {
        const searchTerm = search.trim().substring(0, 100);
        where.OR = [
            { nim: { contains: searchTerm } },
            { nama: { contains: searchTerm } }
        ];
    }

    return where;
}

module.exports = { buildStudentFilter, buildBaseFilter, getPaginationParams };