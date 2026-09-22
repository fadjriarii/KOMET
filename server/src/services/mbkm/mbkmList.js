const prisma = require('../../config/prisma');

async function getMbkmList(whereFilter, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
        prisma.mbkmActivity.findMany({
            where: whereFilter,
            select: {
                nim: true,
                periode: true,
                programStudi: true,
                fakultas: true,
                jenjang: true,
                statusKeaktifan: true,
                jenisAktivitas: true,
                judulAktivitas: true,
                mitra: true,
                statusAktivitas: true,
                student: {
                    select: {
                        nama: true,
                        angkatan: true
                    }
                }
            },
            skip,
            take: limit,
            orderBy: [{ periode: 'desc' }, { student: { nama: 'asc' } }]
        }),
        prisma.mbkmActivity.count({ where: whereFilter })
    ]);

    const flatData = data.map((item, index) => ({
        no: skip + index + 1,
        nim: item.nim,
        nama: item.student?.nama || '',
        periode: item.periode,
        angkatan: item.student?.angkatan || '',
        programStudi: item.programStudi,
        program_studi: item.programStudi,
        fakultas: item.fakultas,
        jenjang: item.jenjang,
        statusKeaktifan: item.statusKeaktifan,
        status_keaktifan: item.statusKeaktifan,
        jenisAktivitas: item.jenisAktivitas,
        jenis_kegiatan: item.jenisAktivitas,
        aktivitas: item.jenisAktivitas,
        bentuk_kegiatan: item.jenisAktivitas,
        judulAktivitas: item.judulAktivitas,
        mitra: item.mitra,
        instansi: item.mitra,
        statusAktivitas: item.statusAktivitas,
        status_aktivitas: item.statusAktivitas,
        status_kegiatan: item.statusAktivitas,
        tahun: item.periode ? item.periode.substring(0, 4) : '',
        tahun_kegiatan: item.periode ? item.periode.substring(0, 4) : ''
    }));

    return {
        data: flatData,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}

module.exports = { getMbkmList };
