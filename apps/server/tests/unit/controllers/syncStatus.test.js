import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const prisma = require('../../../src/config/prisma');
const syncJobTracker = require('../../../src/utils/syncJobTracker');
const getSyncStatus = require('../../../src/controllers/sync/syncStatus');
const { getSyncHistory } = require('../../../src/controllers/sync/syncHistory');

const STATE_FILE = path.join(__dirname, '../../../logs/sync-state.json');
const saved = fs.existsSync(STATE_FILE) ? fs.readFileSync(STATE_FILE, 'utf8') : null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const STALE_MS = 11 * 60 * 1000; // lewat batas 10 menit tanpa progres

/**
 * Status dan riwayat diuji berdampingan: job yang mati di tengah jalan baru tercatat di
 * riwayat saat daftarnya dibaca, jadi dua-duanya dibutuhkan untuk melihat hasil akhirnya.
 * Delegate Prisma ditukar untuk seluruh file — test ini tidak menyentuh DB asli.
 */
const realSyncRun = prisma.syncRun;

function stubRunTable(rows = []) {
  const table = [...rows];
  prisma.syncRun = {
    create: vi.fn(async ({ data }) => {
      const row = { id: table.length + 1, ...data };
      table.push(row);
      return row;
    }),
    findFirst: vi.fn(async ({ where }) => {
      const wanted = Number(where.finishedAt);
      return table.find((row) => new Date(row.finishedAt).getTime() === wanted) || null;
    }),
    findMany: vi.fn(async () => [...table].sort((a, b) => b.id - a.id)),
    deleteMany: vi.fn(async () => ({ count: 0 })),
  };
  return prisma.syncRun;
}

/** State 'running' mentah, seperti yang ditinggal proses yang berhenti. */
const runningState = (over = {}) => ({
  status: 'running',
  currentModule: 'students',
  scope: ['students', 'graduates'],
  progress: {
    students: { status: 'running', current_page: 2, total_pages: 9, total_synced: 80, skipped: 1 },
    graduates: { status: 'pending', current_page: 0, total_pages: 0, total_synced: 0, skipped: 0 },
    mbkm: { status: 'idle', current_page: 0, total_pages: 0, total_synced: 0, skipped: 0 },
  },
  startedAt: new Date().toISOString(),
  finishedAt: null,
  lastError: null,
  pid: process.pid,
  actor: 'API Key',
  lastActivityAt: new Date().toISOString(),
  unloggedDeath: null,
  ...over,
});

/** Tulis state langsung ke file — jalur yang sama dengan proses yang mati mendadak. */
function plantState(state) {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

/** Membaca /sync/status seperti routes, tanpa Express. */
function readStatus() {
  let payload;
  getSyncStatus(
    {},
    {
      json: (body) => {
        payload = body;
      },
    },
  );
  return payload.data;
}

/** Membaca /sync/history seperti routes; di server asli inilah baris mati dicatat. */
async function readHistory() {
  let payload;
  await getSyncHistory(
    { params: {} },
    {
      json: (body) => {
        payload = body;
      },
    },
  );
  return payload.data;
}

// saveState menulis asinkron, jadi tulis terakhir dari finishJob bisa mendarat
// setelah restore naive. Tunggu, kembalikan, lalu verifikasi dan tulis ulang sekali
// lagi bila masih tertimpa: file ini dipakai bersama server yang sedang berjalan.
afterAll(async () => {
  prisma.syncRun = realSyncRun;
  await sleep(150);
  const restore = () =>
    saved === null ? fs.rmSync(STATE_FILE, { force: true }) : fs.writeFileSync(STATE_FILE, saved);
  restore();
  if (saved !== null && fs.readFileSync(STATE_FILE, 'utf8') !== saved) restore();
});

describe('GET /api/sync/status menurunkan angka progres', () => {
  beforeAll(() => {
    stubRunTable();
    syncJobTracker.finishJob(true);
  });

  it('percent per modul, overallPercent dan totals hanya atas cakupan job', () => {
    syncJobTracker.startJob('students', ['students', 'mbkm']);
    syncJobTracker.updateProgress('students', {
      status: 'running',
      page: 3,
      totalPages: 4,
      synced: 120,
      skipped: 2,
    });
    // Lulusan sudah selesai tapi tidak ikut di-sync job ini.
    syncJobTracker.updateProgress('graduates', {
      status: 'completed',
      page: 9,
      totalPages: 9,
      synced: 900,
      skipped: 0,
    });

    const data = readStatus();
    expect(data.scope).toEqual(['students', 'mbkm']);
    expect(data.progress.students.percent).toBe(75);
    expect(data.progress.graduates.percent).toBe(100);
    expect(data.progress.mbkm.percent).toBe(0);
    expect(data.overallPercent).toBe(38);
    expect(data.totals).toEqual({ synced: 120, skipped: 2 });
    // Bookkeeping tracker tidak ikut keluar ke klien.
    expect(data.pid).toBeUndefined();
    expect(data.actor).toBeUndefined();
    expect(data.lastActivityAt).toBeUndefined();
    expect(data.unloggedDeath).toBeUndefined();
  });

  it('modul yang berjalan tapi belum tahu jumlah halaman tetap terlihat bergerak', () => {
    syncJobTracker.updateProgress('students', { status: 'running', totalPages: 0 });
    expect(readStatus().overallPercent).toBe(4);
  });
});

describe('cakupan job pada syncJobTracker', () => {
  beforeAll(() => {
    stubRunTable();
  });

  it('job sempit menghapus angka lama modul tercakup, dan POST berikutnya membiarkannya', () => {
    syncJobTracker.startJob('mbkm', ['mbkm']);
    syncJobTracker.updateProgress('mbkm', {
      status: 'completed',
      page: 2,
      totalPages: 2,
      synced: 556,
      skipped: 4,
    });

    // Job berikutnya: hanya mahasiswa + mbkm, dan mbkm harus mulai dari nol.
    syncJobTracker.startJob('students', ['students', 'mbkm']);
    let data = readStatus();
    expect(data.progress.mbkm).toMatchObject({ status: 'pending', total_synced: 0, skipped: 0 });
    expect(data.progress.students.status).toBe('pending');
    expect(data.overallPercent).toBe(0);

    syncJobTracker.updateProgress('students', {
      status: 'completed',
      page: 5,
      totalPages: 5,
      synced: 2059,
    });
    // POST kedua dalam job yang sama (mbkm) tidak menghapus hasil students.
    syncJobTracker.startJob('mbkm', ['students', 'mbkm']);
    data = readStatus();
    expect(data.progress.students).toMatchObject({ status: 'completed', total_synced: 2059 });
    expect(data.progress.mbkm.status).toBe('pending');
    expect(data.overallPercent).toBe(50);
  });

  afterAll(() => {
    syncJobTracker.finishJob(true);
  });
});

describe('job yang mati di tengah jalan ditutup dan tercatat sebagai Failed', () => {
  // Debounce saveState harus selesai lebih dulu, kalau tidak tulisannya menimpa state
  // yang ditanami test.
  beforeAll(async () => {
    await sleep(200);
  });

  it('job yang berhenti menulis progres dianggap mati dan barisnya ikut di riwayat', async () => {
    const table = stubRunTable();
    plantState(runningState({ lastActivityAt: new Date(Date.now() - STALE_MS).toISOString() }));

    expect(readStatus().status).toBe('failed');
    expect(readStatus().lastError).toContain('tidak ada progres');

    // Barisnya sudah ada dalam daftar yang sama, bukan pada pembacaan berikutnya.
    const rows = await readHistory();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      status: 'failed',
      actor: 'API Key',
      succeeded: 0,
      total: 2,
      modules: [
        { key: 'students', status: 'failed' },
        { key: 'graduates', status: 'failed' },
      ],
    });

    // Kematian yang sama tidak dicatat dua kali.
    expect(await readHistory()).toHaveLength(1);
    expect(table.create).toHaveBeenCalledTimes(1);
  });

  it('state warisan proses yang sudah hilang tidak mengunci sync baru', async () => {
    stubRunTable();
    plantState(runningState({ pid: 0x7ffffff0 }));

    expect(readStatus().lastError).toContain('di-restart');
    expect(syncJobTracker.isRunning()).toBe(false);
    expect((await readHistory())[0]).toMatchObject({ status: 'failed' });
  });

  it('job yang prosesnya hidup dan baru menulis progres tidak disentuh', async () => {
    const table = stubRunTable();
    plantState(runningState());

    expect(readStatus().status).toBe('running');
    expect(syncJobTracker.isRunning()).toBe(true);
    expect(await readHistory()).toEqual([]);
    expect(table.create).not.toHaveBeenCalled();
  });

  it('baris yang sudah tercatat tidak ditimpa lagi', async () => {
    const finishedAt = new Date(Date.now() - 60 * 1000);
    const table = stubRunTable([
      {
        id: 7,
        finishedAt,
        trigger: 'manual',
        actor: 'API Key',
        status: 'failed',
        modules: [{ key: 'students', status: 'failed' }],
        error: 'Sinkronisasi berhenti',
      },
    ]);
    plantState(
      runningState({
        finishedAt: finishedAt.toISOString(),
        lastActivityAt: new Date(Date.now() - STALE_MS).toISOString(),
      }),
    );

    expect(readStatus().status).toBe('failed');
    const rows = await readHistory();
    expect(table.create).not.toHaveBeenCalled();
    // Yang ada tetap baris lama, lengkap dengan id-nya.
    expect(rows[0].id).toBe(7);
  });
});
