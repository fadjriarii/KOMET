/**
 * graduateList.js
 * 
 * Query daftar lulusan dengan filter lengkap, kalkulasi predikatLulus, snake_case aliases, dan pagination.
 */

const prisma = require('../../config/prisma');
const { calculatePredikat } = require('../../utils/graduateUtils');

async function getGraduateList(whereFilter, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
        prisma.graduate.findMany({
            where: whereFilter,
            select: {
                nim: true,
                jenjang: true,
                statusKelulusan: true,
                tahunLulus: true,
                periodeWisuda: true,
                ipk: true,
                sksLulus: true,
                student: {
                    select: {
                        nama: true,
                        angkatan: true,
                        programStudi: true,
                        fakultas: true,
                        statusKeaktifan: true
                    }
                }
            },
            skip,
            take: limit,
            orderBy: [{ tahunLulus: 'desc' }, { student: { nama: 'asc' } }]
        }),
        prisma.graduate.count({ where: whereFilter })
    ]);

    const flatData = data.map(g => {
        const tahunLulusNum = g.tahunLulus ? parseInt(g.tahunLulus) || g.tahunLulus : g.tahunLulus;
        const predikat = calculatePredikat(g.ipk, true);
        return {
            nim: g.nim,
            nama: g.student?.nama || '',
            angkatan: g.student?.angkatan || '',
            programStudi: g.student?.programStudi || '',
            program_studi: g.student?.programStudi || '',
            fakultas: g.student?.fakultas || '',
            jenjang: g.jenjang,
            tahunLulus: tahunLulusNum,
            tahun_lulus: tahunLulusNum,
            ipk: g.ipk,
            sksLulus: g.sksLulus,
            sks_lulus: g.sksLulus,
            predikatLulus: predikat,
            predikat_lulus: predikat,
            statusKelulusan: g.statusKelulusan,
            statusKeaktifan: 'Lulus',
            status_keaktifan: 'Lulus'
        };
    });

    return {
        data: flatData,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
}

module.exports = { getGraduateList };
