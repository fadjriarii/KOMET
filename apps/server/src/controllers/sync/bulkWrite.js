/**
 * Jalur tulis DB pipeline sinkronisasi. Semua statement dibuat per chunk, bukan
 * per baris: `upsert()` per record berarti satu roundtrip per mahasiswa, sedangkan
 * satu `INSERT … ON DUPLICATE KEY UPDATE` menutupi satu halaman penuh.
 */
const { Prisma } = require('@prisma/client');
const prisma = require('../../config/prisma');
const { STUDENT_STATUS } = require('@komet/shared/constants');
const { chunkBy } = require('./config');

const toStr = (value) => String(value ?? '');
const toNum = (value) => Number(value) || 0;
/**
 * Nama kolom/tabel tidak bisa dikirim sebagai parameter, jadi ditulis mentah.
 * `ident` mengembalikan string agar bisa dirangkai (mis. daftar kolom dan klausa
 * `x = VALUES(x)`); `sqlIdent` membungkus satu nama jadi fragmen mentah untuk
 * disisipkan ke `Prisma.sql`. Yang tidak boleh: menyisipkan hasil `sqlIdent` ke
 * dalam template string lain — objeknya tercetak `[object Object]` dan MariaDB
 * menolak statement-nya (error 1064).
 */
const ident = (name) => `\`${String(name).replace(/[^A-Za-z0-9_]/g, '')}\``;
const sqlIdent = (name) => Prisma.raw(ident(name));

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
  'statusKeaktifan',
  'semester',
  'kewarganegaraan',
  'nik',
  'tanggalLahir',
];

const GRADUATE_COLUMNS = [
  'nim',
  'jenjang',
  'statusKelulusan',
  'tahunLulus',
  'periodeWisuda',
  'ipk',
  'sksLulus',
];

/**
 * Satu `INSERT … ON DUPLICATE KEY UPDATE` per chunk. Yang berbeda antar tabel
 * hanyalah daftar kolom dan cara satu baris disusun menjadi tuple; chunking,
 * join, dan statement-nya sama persis.
 */
async function bulkUpsert({ table, columns, keyColumn, rows, valuesOf, afterChunk }) {
  const columnList = Prisma.raw(columns.map(ident).join(', '));
  const updateList = Prisma.raw(
    columns
      .filter((column) => column !== keyColumn)
      .map((column) => `${ident(column)} = VALUES(${ident(column)})`)
      .join(', '),
  );

  for (const chunk of chunkBy(rows)) {
    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO ${sqlIdent(table)} (${columnList})
      VALUES ${Prisma.join(chunk.map(valuesOf), ', ')}
      ON DUPLICATE KEY UPDATE ${updateList}
    `);
    if (afterChunk) await afterChunk(chunk);
  }
  return rows.length;
}

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
      ${toStr(row.programStudi)}, ${toStr(row.fakultas)}, ${toStr(row.statusKeaktifan)},
      ${toNum(row.semester)}, ${toStr(row.kewarganegaraan)}, ${toStr(row.nik)},
      ${toStr(row.tanggalLahir)}, CURRENT_TIMESTAMP(3)
    )`,
  });
}

/**
 * Tulis kelulusan secara massal, lalu tandai mahasiswa terkait sebagai Lulus.
 * periodeTerakhir dikelompokkan per nilainya agar satu UPDATE menutupi banyak NIM.
 */
async function bulkUpsertGraduates(rows) {
  if (!rows || rows.length === 0) return 0;

  async function markStudentsGraduated(chunk) {
    const nims = chunk.map((row) => toStr(row.nim));
    await prisma.$executeRaw(Prisma.sql`
      UPDATE ${sqlIdent('students')}
      SET ${sqlIdent('statusKeaktifan')} = ${STUDENT_STATUS.LULUS}
      WHERE ${sqlIdent('nim')} IN (${Prisma.join(nims)})
    `);

    const nimsByPeriode = new Map();
    chunk.forEach((row, index) => {
      const periode = toStr(row.periodeTerakhir);
      if (!periode) return;
      if (!nimsByPeriode.has(periode)) nimsByPeriode.set(periode, []);
      nimsByPeriode.get(periode).push(nims[index]);
    });
    for (const [periode, subset] of nimsByPeriode) {
      await prisma.$executeRaw(Prisma.sql`
        UPDATE ${sqlIdent('students')}
        SET ${sqlIdent('periodeTerakhir')} = ${periode}
        WHERE ${sqlIdent('nim')} IN (${Prisma.join(subset)})
      `);
    }
  }

  return bulkUpsert({
    table: 'graduates',
    columns: GRADUATE_COLUMNS,
    keyColumn: 'nim',
    rows,
    valuesOf: (row) => Prisma.sql`(
      ${toStr(row.nim)}, ${toStr(row.jenjang)}, ${toStr(row.statusKelulusan)},
      ${toStr(row.tahunLulus)}, ${toStr(row.periodeWisuda)}, ${toNum(row.ipk)},
      ${toNum(row.sksLulus)}
    )`,
    afterChunk: markStudentsGraduated,
  });
}

/**
 * MBKM selalu di-truncate sebelum sinkronisasi, jadi cukup satu createMany per chunk
 * tanpa upsert per baris.
 */
async function bulkCreateMbkmActivities(rows) {
  if (!rows || rows.length === 0) return 0;
  for (const chunk of chunkBy(rows)) {
    await prisma.mbkmActivity.createMany({
      data: chunk.map((row) => ({
        nim: toStr(row.nim),
        periode: toStr(row.periode),
        programStudi: toStr(row.programStudi),
        fakultas: toStr(row.fakultas),
        jenjang: toStr(row.jenjang),
        statusKeaktifan: toStr(row.statusKeaktifan),
        jenisAktivitas: toStr(row.jenisAktivitas),
        judulAktivitas: toStr(row.judulAktivitas),
        mitra: toStr(row.mitra),
        statusAktivitas: toStr(row.statusAktivitas),
      })),
    });
  }
  return rows.length;
}

module.exports = { bulkUpsertStudents, bulkUpsertGraduates, bulkCreateMbkmActivities };
