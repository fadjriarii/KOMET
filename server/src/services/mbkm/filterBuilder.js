/**
 * Mem-build Prisma where clause untuk query mbkm_activities
 * berdasarkan query parameters dari request.
 */

const prisma = require('../../config/prisma');
const { getPaginationParams } = require('../../utils/paginationUtils');
const { toArray } = require('../../utils/queryUtils');

function buildMbkmFilter(query) {
    const { search, fakultas, programStudi, angkatan, statusAktivitas, jenjang, periode } = query;

    const where = {};

    // Filter langsung di tabel mbkm_activities
    if (periode) where.periode = periode;

    if (statusAktivitas) where.statusAktivitas = statusAktivitas;

    if (jenjang) where.jenjang = jenjang;

    const fakultasArr = toArray(fakultas);
    if (fakultasArr && fakultasArr.length > 0) where.fakultas = { in: fakultasArr };

    const prodiArr = toArray(programStudi);
    if (prodiArr && prodiArr.length > 0) where.programStudi = { in: prodiArr };

    // Filter via relasi ke student
    const studentFilter = {};

    const angkatanArr = toArray(angkatan);
    if (angkatanArr && angkatanArr.length > 0) studentFilter.angkatan = { in: angkatanArr };

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

// Helper untuk mendapatkan periode terbaru dari database
async function getDefaultPeriode() {
    const latest = await prisma.mbkmActivity.findFirst({
        orderBy: { periode: 'desc' },
        select: { periode: true }
    });
    return latest?.periode || null;
}

// Helper untuk menghitung periode sebelumnya
function getPreviousPeriode(currentPeriode) {
    if (!currentPeriode || currentPeriode.length < 5) return null;
    const year = parseInt(currentPeriode.substring(0, 4));
    const sem = parseInt(currentPeriode.substring(4));
    return sem === 1 ? `${year - 1}2` : `${year}1`;
}

/**
 * Build student where clause dari query params MBKM
 * (untuk endpoint yang query ke tabel students, seperti eligible students dan rate)
 */
function buildStudentFilterFromMbkmQuery(query) {
    const studentFilter = {};
    if (query.angkatan) {
        const list = Array.isArray(query.angkatan) ? query.angkatan : [query.angkatan];
        if (list.length > 0) studentFilter.angkatan = { in: list };
    }
    if (query.fakultas) {
        const list = Array.isArray(query.fakultas) ? query.fakultas : [query.fakultas];
        if (list.length > 0) studentFilter.fakultas = { in: list };
    }
    if (query.programStudi) {
        const list = Array.isArray(query.programStudi) ? query.programStudi : [query.programStudi];
        if (list.length > 0) studentFilter.programStudi = { in: list };
    }
    if (query.jenjang) studentFilter.jenjang = query.jenjang;
    return studentFilter;
}

module.exports = { buildMbkmFilter, getPaginationParams, getDefaultPeriode, getPreviousPeriode, buildStudentFilterFromMbkmQuery };
