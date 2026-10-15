import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { snapshotSemester } = require('../../../src/services/students/studentSnapshot');
const { resolveSnapshotSemesterWhere } = require('../../../src/services/students/studentSnapshot');

const row = (overrides) => ({
  nim: 'x',
  periodeMasuk: '20221',
  periodeMasukAwal: '',
  periodeTerakhir: '',
  semester: 6,
  ...overrides,
});

describe('semester snapshot per tahun ajaran', () => {
  it('tanpa tahun ajaran memakai semester tersimpan', () => {
    expect(snapshotSemester(row(), null)).toBe(6);
  });

  it('menghitung sampai akhir tahun terpilih bila masih aktif sesudahnya', () => {
    expect(snapshotSemester(row(), { startYear: '2022' })).toBe(2);
    expect(snapshotSemester(row(), { startYear: '2026' })).toBe(10);
  });

  it('memakai awal rantai transfer bila ada', () => {
    const transfer = row({ periodeMasukAwal: '20211' });
    expect(snapshotSemester(transfer, { startYear: '2022' })).toBe(4);
    expect(snapshotSemester(transfer, { startYear: '2024' })).toBe(8);
  });

  it('berhenti di periode keluar bila keluar di tahun itu (kasus Muhammad Ismail)', () => {
    const muhammad = row({
      periodeMasuk: '20141',
      periodeTerakhir: '20192',
      semester: 12,
    });
    expect(snapshotSemester(muhammad, { startYear: '2014' })).toBe(2);
  });

  it('keluar di Ganjil berarti semester ganjil itu', () => {
    const keluar = row({ periodeMasuk: '20211', periodeTerakhir: '20211', semester: 2 });
    expect(snapshotSemester(keluar, { startYear: '2021' })).toBe(1);
  });

  it('awal tak valid memakai semester tersimpan', () => {
    expect(
      snapshotSemester(row({ periodeMasuk: '', periodeMasukAwal: '' }), { startYear: '2022' }),
    ).toBe(6);
  });
});

describe('resolveSnapshotSemesterWhere', () => {
  const rows = [
    { nim: 'a', periodeMasuk: '20212', periodeMasukAwal: '', periodeTerakhir: '' },
    { nim: 'b', periodeMasuk: '20221', periodeMasukAwal: '20211', periodeTerakhir: '20242' },
    { nim: 'c', periodeMasuk: '20241', periodeMasukAwal: '', periodeTerakhir: '' },
  ];
  const db = { student: { findMany: async () => rows } };
  const base = { statusKeaktifan: 'Aktif', semester: { in: ['3'] } };

  it('mengganti filter semester tersimpan menjadi daftar NIM yang tampil', async () => {
    // 2022/23: a → 3 (20212→20222), b → 4 (awal 20211→20222), c → 1 (belum masuk).
    const where = await resolveSnapshotSemesterWhere(db, base, {
      tahunAjaran: '2022/2023',
      semester: ['3'],
    });
    expect(where).toEqual({ statusKeaktifan: 'Aktif', AND: [{ nim: { in: ['a'] } }] });
  });

  it('tanpa kombinasi tahun+semester tidak menambah query', async () => {
    let called = 0;
    const countingDb = { student: { findMany: async () => (called++, rows) } };
    const where = await resolveSnapshotSemesterWhere(countingDb, base, {});
    expect(where).toBe(base);
    expect(called).toBe(0);
  });
});
