/**
 * Satu `INSERT … ON DUPLICATE KEY UPDATE` per chunk. Yang berbeda antar tabel
 * hanyalah daftar kolom dan cara satu baris disusun menjadi tuple; chunking,
 * join, dan statement-nya sama persis.
 */
const { Prisma } = require('@prisma/client');
const prisma = require('../../../config/prisma');
const { chunkBy } = require('../config');

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

const toStr = (value) => String(value ?? '');
const toNum = (value) => Number(value) || 0;

module.exports = { bulkUpsert, sqlIdent, prisma, toStr, toNum };
