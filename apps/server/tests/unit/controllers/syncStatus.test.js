import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const syncJobTracker = require('../../../src/utils/syncJobTracker');
const getSyncStatus = require('../../../src/controllers/sync/syncStatus');

const STATE_FILE = path.join(__dirname, '../../../logs/sync-state.json');
const saved = fs.existsSync(STATE_FILE) ? fs.readFileSync(STATE_FILE, 'utf8') : null;

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

// saveState menulis asinkron, jadi tulis terakhir dari finishJob bisa mendarat
// setelah restore naive. Tunggu, kembalikan, lalu verifikasi dan tulis ulang sekali
// lagi bila masih tertimpa: file ini dipakai bersama server yang sedang berjalan.
afterAll(async () => {
  await new Promise((resolve) => setTimeout(resolve, 150));
  const restore = () =>
    saved === null ? fs.rmSync(STATE_FILE, { force: true }) : fs.writeFileSync(STATE_FILE, saved);
  restore();
  if (saved !== null && fs.readFileSync(STATE_FILE, 'utf8') !== saved) restore();
});

describe('GET /api/sync/status menurunkan angka progres', () => {
  beforeAll(() => {
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
  });

  it('modul yang berjalan tapi belum tahu jumlah halaman tetap terlihat bergerak', () => {
    syncJobTracker.updateProgress('students', { status: 'running', totalPages: 0 });
    expect(readStatus().overallPercent).toBe(4);
  });
});

describe('cakupan job pada syncJobTracker', () => {
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
