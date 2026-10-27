const prisma = require('../../config/prisma');
const { resolveTargetNimBatch } = require('./sevimaLookup');

/**
 * Siapkan baris aktivitas untuk ditulis: resolusi NIM (termasuk varian tanpa
 * "x") tanpa N+1 query dan TANPA membuat mahasiswa baru, denormalisasi
 * statusKeaktifan dari baris mahasiswa, dan SKS konversi per aktivitas.
 * Aktivitas yang NIM-nya tidak dikenal tidak bisa ditulis (relasi ke Student)
 * dan dihitung sebagai yatim untuk laporan sync.
 *
 * @returns {{ rows: object[], orphans: number }}
 */
async function buildMbkmRows(validItems, sksByActivity = new Map()) {
  const nimMap = await resolveTargetNimBatch(
    validItems,
    (item) => item.nim,
    (item) => item.nama_mahasiswa,
    () => ({}),
    { createMissing: false },
  );

  const targetNims = [...new Set([...nimMap.values()])];
  const studentRows = await prisma.student.findMany({
    where: { nim: { in: targetNims } },
    select: { nim: true, statusKeaktifan: true },
  });
  const statusByNim = new Map(studentRows.map((row) => [row.nim, row.statusKeaktifan]));

  const rows = [];
  for (const item of validItems) {
    const nim = nimMap.get(item);
    if (!nim) continue;
    rows.push({
      idAktivitas: item.idAktivitas,
      nim,
      periode: item.periode,
      programStudi: item.programStudi,
      fakultas: item.fakultas,
      jenjang: item.jenjang,
      statusKeaktifan: statusByNim.get(nim) || '',
      jenisAktivitas: item.jenisAktivitas,
      idJenisKegiatan: item.idJenisKegiatan,
      judulAktivitas: item.judulAktivitas,
      mitra: item.mitra,
      statusAktivitas: item.statusAktivitas,
      idStatusAktivitas: item.idStatusAktivitas,
      tanggalMulai: item.tanggalMulai,
      tanggalSelesai: item.tanggalSelesai,
      sksKonversi: item.idAktivitas === null ? null : (sksByActivity.get(item.idAktivitas) ?? null),
      raw: item.raw,
    });
  }
  return { rows, orphans: validItems.length - rows.length };
}

module.exports = { buildMbkmRows };
