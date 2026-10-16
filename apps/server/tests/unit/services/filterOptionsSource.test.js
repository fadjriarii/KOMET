import { afterAll, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const prisma = require('../../../src/config/prisma');
const { createFilterOptionsSource } = require('../../../src/services/filterOptionsSource');

describe('sumber opsi filter', () => {
  const original = prisma.student.groupBy;

  afterAll(() => {
    prisma.student.groupBy = original;
  });

  it('mengagregat lewat groupBy, bukan mengirim seluruh baris', async () => {
    const calls = [];
    prisma.student.groupBy = vi.fn(async (args) => {
      calls.push(args);
      return [{ fakultas: 'FIB', _count: { fakultas: 3 } }];
    });

    const source = createFilterOptionsSource({
      queries: {
        fakultas: { model: 'student', field: 'fakultas', where: { jenjang: 'S1' } },
      },
    });

    await expect(source.getFilterOptions()).resolves.toEqual({ fakultas: ['FIB'] });
    expect(calls[0]).toMatchObject({
      by: ['fakultas'],
      where: { jenjang: 'S1' },
      _count: { fakultas: true },
    });
    expect(calls[0].select).toBeUndefined();
  });

  it('menyaring nilai kosong, mengurutkan, dan membalik saat desc', async () => {
    const rows = ['Zeta', '', null, 'Alpha', 'Mid'].map((fakultas) => ({
      fakultas,
      _count: { fakultas: 1 },
    }));
    prisma.student.groupBy = vi.fn(async () => rows);

    const source = createFilterOptionsSource({
      queries: {
        asc: { model: 'student', field: 'fakultas' },
        desc: { model: 'student', field: 'fakultas', desc: true },
        raw: { model: 'student', field: 'fakultas', rawOrder: true },
      },
    });

    const options = await source.getFilterOptions();
    expect(options.asc).toEqual(['Alpha', 'Mid', 'Zeta']);
    expect(options.desc).toEqual(['Zeta', 'Mid', 'Alpha']);
    // Scope nilai (mis. jenjang di luar JENJANGS) disaring database lewat `where`,
    // bukan dibuang setelah baris tiba di Node.
    expect(options.raw).toEqual(['Zeta', 'Alpha', 'Mid']);
  });

  it('mengurutkan menurun berdasarkan jumlah bila byCount', async () => {
    const rows = [
      { prodi: 'Kecil', _count: { prodi: 2 } },
      { prodi: 'Besar', _count: { prodi: 9 } },
      { prodi: 'Sedang', _count: { prodi: 5 } },
      { prodi: '', _count: { prodi: 99 } },
    ];
    prisma.student.groupBy = vi.fn(async () => rows);

    const source = createFilterOptionsSource({
      queries: {
        prodi: { model: 'student', field: 'prodi', byCount: true },
      },
    });

    const options = await source.getFilterOptions();
    // Nilai kosong tetap disaring; seri diurut alfabet agar deterministik.
    expect(options.prodi).toEqual(['Besar', 'Sedang', 'Kecil']);
  });

  it('memakai cache sampai cache dibersihkan, lalu mengirim ulang queries', async () => {
    const groupBy = vi.fn(async () => [{ fakultas: 'FT', _count: { fakultas: 1 } }]);
    prisma.student.groupBy = groupBy;

    const source = createFilterOptionsSource({
      queries: { fakultas: { model: 'student', field: 'fakultas' } },
      derive: ({ fakultas }) => ({ total: fakultas.length }),
    });

    const first = await source.getFilterOptions();
    const cached = await source.getFilterOptions();

    expect(first).toEqual({ fakultas: ['FT'], total: 1 });
    // Nilai distinct di-cache (satu fetch), turunannya dihitung per panggilan
    // supaya bisa mengikuti parameter tanpa mengorbankan cache query berat.
    expect(cached).toEqual(first);
    expect(groupBy).toHaveBeenCalledTimes(1);

    await source.getFilterOptions(true);
    expect(groupBy).toHaveBeenCalledTimes(2);
  });
});
