const { Prisma } = require('@prisma/client');
const { bulkUpsert, toStr, toNum } = require('./bulk');

const STUDENT_COLUMNS = [
  'nim',
  'nama',
  'jenjang',
  'periodeMasuk',
  'periodeTerakhir',
  'angkatan',
  'periode',
  'programStudi',
  'fakultas',
  'kodeProgramStudi',
  'idNegara',
  'statusKeaktifan',
  'semester',
  'kewarganegaraan',
  'nik',
  'tanggalLahir',
  'isAkunLama',
];

/**
 * Tulis satu halaman mahasiswa dengan satu statement per chunk.
 * `updatedAt` ikut sebagai kolom sisip berisi CURRENT_TIMESTAMP, jadi pada baris
 * lama nilai itu tersalin lewat `VALUES(updatedAt)` — tidak perlu ekspresi kedua.
 */
async function bulkUpsertStudents(rows) {
  if (!rows || rows.length === 0) return 0;
  return bulkUpsert({
    table: 'students',
    columns: [...STUDENT_COLUMNS, 'updatedAt'],
    keyColumn: 'nim',
    rows,
    valuesOf: (row) => Prisma.sql`(
      ${toStr(row.nim)}, ${toStr(row.nama)}, ${toStr(row.jenjang)}, ${toStr(row.periodeMasuk)},
      ${toStr(row.periodeTerakhir)}, ${toStr(row.angkatan)}, ${toStr(row.periode)},
      ${toStr(row.programStudi)}, ${toStr(row.fakultas)}, ${toStr(row.kodeProgramStudi)},
      ${toStr(row.idNegara)}, ${toStr(row.statusKeaktifan)},
      ${toNum(row.semester)}, ${toStr(row.kewarganegaraan)}, ${toStr(row.nik)},
      ${toStr(row.tanggalLahir)}, ${row.isAkunLama ? 1 : 0}, CURRENT_TIMESTAMP(3)
    )`,
  });
}

module.exports = { bulkUpsertStudents };
