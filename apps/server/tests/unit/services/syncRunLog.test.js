import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const prisma = require('../../../src/config/prisma');
const {
  HISTORY_LIMIT,
  isJobOver,
  recordRun,
  listRuns,
  deleteRun,
} = require('../../../src/services/sync/syncRunLog');
const { SYNC_TRIGGER } = require('@komet/shared/constants');

// Delegate model Prisma adalah properti writable, jadi cukup ditukar — sama seperti
// stub sevimaApi.get di syncPipeline.test.
const realSyncRun = prisma.syncRun;
afterEach(() => {
  prisma.syncRun = realSyncRun;
});

/** State shaped like `syncJobTracker.getState()`. */
const state = (scope, statuses = {}) => ({
  scope,
  progress: Object.fromEntries(
    ['students', 'graduates', 'mbkm'].map((key) => [key, { status: statuses[key] || 'pending' }]),
  ),
});

function stubTable({ keptIds = [], created = [], count = 0 } = {}) {
  prisma.syncRun = {
    create: vi.fn(async ({ data }) => {
      const row = { id: created.length + 1, finishedAt: new Date('2026-10-07T08:00:00Z'), ...data };
      created.push(row);
      return row;
    }),
    findMany: vi.fn(async () => keptIds.map((id) => ({ id }))),
    deleteMany: vi.fn(async () => ({ count })),
  };
  return prisma.syncRun;
}

describe('isJobOver: satu run untuk seluruh urutan POST UI', () => {
  it('gagal kapan pun = selesai', () => {
    expect(isJobOver(state(['students', 'mbkm'], { mbkm: 'running' }), false)).toBe(true);
  });

  it('sukses di tengah urutan belum selesai', () => {
    // POST /students sudah beres, graduates & mbkm masih menunggu giliran.
    expect(
      isJobOver(state(['students', 'graduates', 'mbkm'], { students: 'completed' }), true),
    ).toBe(false);
  });

  it('sukses saat modul terakhir dalam cakupan beres', () => {
    expect(
      isJobOver(state(['students', 'mbkm'], { students: 'completed', mbkm: 'completed' }), true),
    ).toBe(true);
  });

  it('cakupan kosong tidak menulis apa pun', () => {
    expect(isJobOver(state([]), true)).toBe(false);
  });
});

describe('recordRun', () => {
  it('POST tengah urutan tidak menulis baris', async () => {
    const table = stubTable();
    const written = await recordRun({
      state: state(['students', 'graduates', 'mbkm'], { students: 'completed' }),
      success: true,
      actor: 'Dashboard',
    });
    expect(written).toBeNull();
    expect(table.create).not.toHaveBeenCalled();
  });

  it('POST penutup menulis satu baris lengkap', async () => {
    const table = stubTable();
    const run = await recordRun({
      state: state(['students', 'graduates'], { students: 'completed', graduates: 'completed' }),
      success: true,
      actor: 'API Key',
    });
    expect(table.create.mock.calls[0][0].data).toMatchObject({
      trigger: SYNC_TRIGGER.MANUAL,
      actor: 'API Key',
      status: 'completed',
      error: null,
      modules: [
        { key: 'students', status: 'completed' },
        { key: 'graduates', status: 'completed' },
      ],
    });
    expect(run.id).toBe(1);
  });

  it('job gagal menandai modul yang tidak selesai sebagai failed', async () => {
    const table = stubTable();
    await recordRun({
      state: state(['students', 'graduates', 'mbkm'], {
        students: 'completed',
        graduates: 'running',
      }),
      success: false,
      error: 'Sinkronisasi gagal diselesaikan.',
      actor: 'Dashboard',
    });
    expect(table.create.mock.calls[0][0].data).toMatchObject({
      status: 'failed',
      error: 'Sinkronisasi gagal diselesaikan.',
      modules: [
        { key: 'students', status: 'completed' },
        { key: 'graduates', status: 'failed' },
        { key: 'mbkm', status: 'failed' },
      ],
    });
  });

  it('memangkas tabel ke run terbaru', async () => {
    const deleted = [];
    prisma.syncRun = {
      create: vi.fn(async () => ({ id: 42 })),
      findMany: vi.fn(async ({ take }) =>
        Array.from({ length: take }, (_, index) => ({ id: 42 - index })),
      ),
      deleteMany: vi.fn(async ({ where }) => {
        deleted.push(where.id.lt);
        return { count: 1 };
      }),
    };
    await recordRun({
      state: state(['students'], { students: 'completed' }),
      success: true,
      actor: 'Dashboard',
    });
    // Run ke-42 disimpan bersama 4 pendahulunya; yang lebih lama dari itu dibuang.
    expect(deleted).toEqual([42 - HISTORY_LIMIT + 1]);
  });
});

describe('baris riwayat siap-render', () => {
  beforeAll(() => {
    prisma.syncRun = {
      findMany: vi.fn(async () => [
        {
          id: 7,
          finishedAt: new Date('2026-10-07T08:00:00Z'),
          trigger: 'manual',
          actor: 'Dashboard',
          status: 'failed',
          modules: [
            { key: 'students', status: 'completed' },
            { key: 'graduates', status: 'failed' },
          ],
          error: 'Sinkronisasi gagal diselesaikan.',
        },
      ]),
    };
  });

  it('memuat hitungan dan tanggal ISO; label dan warna tetap milik client', async () => {
    const rows = await listRuns();
    expect(rows).toEqual([
      {
        id: 7,
        finishedAt: '2026-10-07T08:00:00.000Z',
        trigger: 'manual',
        actor: 'Dashboard',
        status: 'failed',
        modules: [
          { key: 'students', status: 'completed' },
          { key: 'graduates', status: 'failed' },
        ],
        succeeded: 1,
        total: 2,
        error: 'Sinkronisasi gagal diselesaikan.',
      },
    ]);
  });
});

describe('deleteRun', () => {
  it('id yang tidak ada dilaporkan sebagai false, bukan error', async () => {
    prisma.syncRun = { deleteMany: vi.fn(async () => ({ count: 0 })) };
    expect(await deleteRun(99)).toBe(false);
    prisma.syncRun = { deleteMany: vi.fn(async () => ({ count: 1 })) };
    expect(await deleteRun(99)).toBe(true);
  });
});
