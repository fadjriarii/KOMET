/**
 * filterBuilder.js
 * 
 * Mengkonversi query parameters dari HTTP request menjadi Prisma where clause.
 * Digunakan oleh semua service stats agar filter konsisten di setiap endpoint.
 */

const { getPaginationParams } = require('../../utils/paginationUtils');
const { toArray } = require('../../utils/queryUtils');

/**
 * Core builder internal untuk membangun where clause Prisma dari query params.
 * @param {object} query - req.query
 * @param {object} options - { forStats: boolean }
 */
function buildWhereClause(query = {}, options = {}) {
    const {
        fakultas,
        programStudi,
        jenjang,
        angkatan,
        angkatanTahun,
        semester,
        periodeMasuk,
        periode,
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

    const jenjangArr = toArray(jenjang);
    if (jenjangArr) where.jenjang = { in: jenjangArr };

    const angkatanArr = toArray(angkatan);
    if (angkatanArr) where.angkatan = { in: angkatanArr };

    const angkatanTahunArr = toArray(angkatanTahun);
    if (angkatanTahunArr) addOrCondition(where, angkatanTahunArr.map(year => ({ angkatan: { startsWith: year } })));

    const semArr = toArray(semester);
    if (semArr) {
        const semList = semArr.map(Number).filter(n => !isNaN(n) && n > 0);
        if (semList.length > 0) where.semester = { in: semList };
    }

    // Single-select (dropdown)
    if (periodeMasuk) where.periodeMasuk = buildPeriodeFilter(periodeMasuk);
    if (periode) where.periode = periode;
    if (kewarganegaraan) {
        if (kewarganegaraan === 'WNI') {
            where.kewarganegaraan = 'Indonesia';
        } else if (kewarganegaraan === 'WNA') {
            where.NOT = {
                kewarganegaraan: 'Indonesia'
            };
        } else {
            where.kewarganegaraan = kewarganegaraan;
        }
    }

    if (options.forStats) {
        // Default dashboard memakai populasi aktif
        const statusArr = toArray(statusKeaktifan);
        if (statusArr?.includes('__ALL__')) {
            // Penanda eksplisit agar service statistik tidak menerapkan
            // fallback default status Aktif.
            where.statusKeaktifan = { not: '' };
        } else {
            where.statusKeaktifan = statusArr
            ? (statusArr.length === 1 ? statusArr[0] : { in: statusArr })
            : 'Aktif';
        }
    } else {
        const statusArr = toArray(statusKeaktifan);
        if (statusArr?.includes('__ALL__')) {
            where.statusKeaktifan = { not: '' };
        } else if (statusArr) {
            where.statusKeaktifan = statusArr.length === 1 ? statusArr[0] : { in: statusArr };
        } else {
            // Tabel dan KPI harus memiliki populasi default yang sama.
            where.statusKeaktifan = 'Aktif';
        }
    }

    if (search && search.trim()) {
        const searchTerm = search.trim().substring(0, 100);
        addOrCondition(where, [
            { nim: { contains: searchTerm } },
            { nama: { contains: searchTerm } }
        ]);
    }

    return where;
}

/**
 * Build filter untuk tabel mahasiswa — semua parameter user berlaku penuh.
 * Termasuk statusKeaktifan, semester, dan search.
 */
function buildStudentFilter(query) {
    return buildWhereClause(query, { forStats: false });
}

/**
 * Build filter "dasar" untuk kalkulasi statistik card.
 */
function buildBaseFilter(query) {
    return buildWhereClause(query, { forStats: true });
}

function addOrCondition(where, condition) {
    where.AND = where.AND || [];
    where.AND.push({ OR: condition });
}

/**
 * Konversi label Ganjil/Genap dari UI ke filter kode periode database.
 *
 * Mapping (sesuai business rules):
 *   Ganjil → kode periode berakhir "1" (contoh: 20261)
 *   Genap  → kode periode berakhir "2" (contoh: 20262)
 *
 * UI mengirim label "Ganjil"/"Genap"; database menyimpan kode periode mentah (contoh 20251/20252).
 */
function buildPeriodeFilter(value) {
    if (value === 'Ganjil') return { endsWith: '1' };
    if (value === 'Genap')  return { endsWith: '2' };
    return value;
}

module.exports = { buildStudentFilter, buildBaseFilter, getPaginationParams };
