import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const prisma = require('../../../src/config/prisma');
const { getSyncHistory, deleteSyncRun } = require('../../../src/controllers/sync/syncHistory');

const realSyncRun = prisma.syncRun;
afterEach(() => {
  prisma.syncRun = realSyncRun;
});

/** Memanggil handler seperti routes memanggilnya, tanpa Express. */
async function call(handler, req = {}) {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  await handler({ params: {}, ...req }, res);
  return res;
}

function stubTable(rows = [], count = 0) {
  prisma.syncRun = {
    findMany: vi.fn(async () => rows),
    deleteMany: vi.fn(async () => ({ count })),
  };
  return prisma.syncRun;
}

const runRow = {
  id: 3,
  finishedAt: new Date('2026-10-07T08:00:00Z'),
  trigger: 'manual',
  actor: 'Dashboard',
  status: 'completed',
  modules: [{ key: 'students', status: 'completed' }],
  error: null,
};

describe('GET /api/sync/history', () => {
  it('mengembalikan baris yang sudah siap render', async () => {
    stubTable([runRow]);
    const res = await call(getSyncHistory);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      success: true,
      data: [{ ...runRow, finishedAt: '2026-10-07T08:00:00.000Z', succeeded: 1, total: 1 }],
    });
  });

  it('tabel kosong adalah history kosong, bukan error', async () => {
    stubTable([]);
    expect((await call(getSyncHistory)).body.data).toEqual([]);
  });

  it('kegagalan DB memakai pesan katalog, bukan pesan Prisma', async () => {
    prisma.syncRun = {
      findMany: vi.fn(async () => {
        throw new Error('PrismaClientKnownRequestError: connection refused to 10.0.0.5:3306');
      }),
    };
    const res = await call(getSyncHistory);
    expect(res.statusCode).toBe(500);
    expect(res.body).toMatchObject({
      success: false,
      code: 'DATA_READ_FAILED',
      message: 'Gagal mengambil data.',
    });
    expect(JSON.stringify(res.body)).not.toContain('3306');
  });
});

describe('DELETE /api/sync/history/:id', () => {
  it('menghapus log yang ada', async () => {
    const table = stubTable([], 1);
    const res = await call(deleteSyncRun, { params: { id: '3' } });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(table.deleteMany.mock.calls[0][0].where).toEqual({ id: 3 });
  });

  it('id yang sudah hilang menjawab 404 dengan kode katalog', async () => {
    stubTable([], 0);
    const res = await call(deleteSyncRun, { params: { id: '3' } });
    expect(res.statusCode).toBe(404);
    expect(res.body).toMatchObject({
      success: false,
      code: 'SYNC_RUN_NOT_FOUND',
      message: 'Riwayat sinkronisasi tidak ditemukan.',
    });
  });

  it('id yang bukan angka ditolak sebelum menyentuh DB', async () => {
    const table = stubTable([], 1);
    for (const id of ['abc', '3;drop', '99999999999', '-1', '']) {
      expect((await call(deleteSyncRun, { params: { id } })).statusCode).toBe(404);
    }
    expect(table.deleteMany).not.toHaveBeenCalled();
  });
});
