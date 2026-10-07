import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const prisma = require('../../../src/config/prisma');
const syncJobTracker = require('../../../src/utils/syncJobTracker');
const createSyncHandler = require('../../../src/controllers/sync/createSyncHandler');

const STATE_FILE = path.join(__dirname, '../../../logs/sync-state.json');
const saved = fs.existsSync(STATE_FILE) ? fs.readFileSync(STATE_FILE, 'utf8') : null;

const realSyncRun = prisma.syncRun;
afterEach(() => {
  prisma.syncRun = realSyncRun;
});

// saveState menulis asinkron dan file ini dipakai bersama dengan server dev yang
// sedang berjalan, jadi pulihkan isinya seperti di syncStatus.test.
afterAll(async () => {
  await new Promise((resolve) => setTimeout(resolve, 150));
  const restore = () =>
    saved === null ? fs.rmSync(STATE_FILE, { force: true }) : fs.writeFileSync(STATE_FILE, saved);
  restore();
  if (saved !== null && fs.readFileSync(STATE_FILE, 'utf8') !== saved) restore();
});

/** Job jadi dengan ETL palsu yang menandai modulnya selesai (atau gagal). */
function makeHandler({ fails = false } = {}) {
  return createSyncHandler({
    moduleName: 'students',
    label: 'Data mahasiswa',
    execute: async () => {
      if (fails) throw new Error('axios: timeout of 5000ms exceeded');
      syncJobTracker.updateProgress('students', {
        status: 'completed',
        page: 3,
        totalPages: 3,
        synced: 2059,
      });
      return { totalSynced: 2059 };
    },
    successMessage: () => 'sync ok',
  });
}

/**
 * Baris yang ditulis ditangkap ke `writes`. Status tracker saat itu ikut dicatat:
 * bila ia sudah 'completed', artinya riwayat ditulis setelah job ditutup dan klien
 * yang polling bisa melihat job selesai tanpa barisnya ada.
 */
function stubTable(writes) {
  prisma.syncRun = {
    create: vi.fn(async ({ data }) => {
      writes.push({ statusAtWrite: syncJobTracker.peekState().status, ...data });
      return { id: writes.length, ...data };
    }),
    findMany: vi.fn(async () => [{ id: 1 }]),
    deleteMany: vi.fn(async () => ({ count: 0 })),
  };
}

function fakeRes() {
  return {
    statusCode: null,
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
}

/** Mode sinkron (isAsync: false) menunggu respons, tanpa setImmediate. */
async function invoke(
  handler,
  { scope = ['students'], isAsync = true, syncActor = 'Dashboard' } = {},
) {
  const res = fakeRes();
  const req = {
    body: isAsync ? { async: true, scope } : { scope },
    query: {},
    syncActor,
  };
  await handler(req, res);
  if (isAsync) await new Promise((resolve) => setTimeout(resolve, 50));
  return res;
}

describe('riwayat ditulis oleh pembungkus job, bukan oleh tiap modul', () => {
  it('job async sukses -> satu baris, ditulis sebelum job ditandai selesai', async () => {
    const writes = [];
    stubTable(writes);

    const res = await invoke(makeHandler());

    expect(res.statusCode).toBe(202);
    expect(writes).toHaveLength(1);
    expect(writes[0]).toMatchObject({
      statusAtWrite: 'running',
      trigger: 'manual',
      actor: 'Dashboard',
      status: 'completed',
      error: null,
      modules: [{ key: 'students', status: 'completed' }],
    });
    expect(writes[0].finishedAt).toBeInstanceOf(Date);
    expect(syncJobTracker.peekState().status).toBe('completed');
  });

  it('job async gagal -> baris failed dengan pesan katalog, bukan detail axios', async () => {
    const writes = [];
    stubTable(writes);

    await invoke(makeHandler({ fails: true }));

    expect(writes[0].status).toBe('failed');
    expect(writes[0].error).toBe('Terjadi kesalahan pada server. Silakan coba lagi.');
    expect(writes[0].modules).toEqual([{ key: 'students', status: 'failed' }]);
    expect(JSON.stringify(writes[0])).not.toContain('timeout of 5000ms');
  });

  it('mode sinkron mencatat baris dengan actor dari kredensial, bukan dari body', async () => {
    const writes = [];
    stubTable(writes);

    const res = await invoke(makeHandler(), { isAsync: false, syncActor: 'API Key' });

    expect(res.body).toMatchObject({ success: true });
    expect(writes).toHaveLength(1);
    expect(writes[0]).toMatchObject({ actor: 'API Key', status: 'completed' });
  });

  it('gagal menulis riwayat tidak menggagalkan sinkronisasi', async () => {
    prisma.syncRun = {
      create: vi.fn(async () => {
        throw new Error('DB write lock');
      }),
    };

    const res = await invoke(makeHandler());

    expect(res.statusCode).toBe(202);
    expect(syncJobTracker.peekState().status).toBe('completed');
  });
});
