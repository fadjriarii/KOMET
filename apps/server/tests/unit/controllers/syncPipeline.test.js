import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// Delay & window dibaca saat modul dimuat, jadi environment diset sebelum require.
process.env.SEVIMA_PAGE_DELAY_MS = '0';
process.env.SEVIMA_FETCH_WINDOW = '3';

const sevimaApi = require('../../../src/config/sevimaApi');
const prisma = require('../../../src/config/prisma');
const { paginateSevimaPages } = require('../../../src/controllers/sync/sevimaLookup');
const { bulkUpsertStudents } = require('../../../src/controllers/sync/bulkWrite');
const { chunkBy } = require('../../../src/controllers/sync/config');

describe('paginateSevimaPages', () => {
  let getSpy;
  let originalGet;

  beforeAll(() => {
    originalGet = sevimaApi.get;
  });

  afterAll(() => {
    sevimaApi.get = originalGet;
  });

  function stubPages(totalPages, { pageSize = 1 } = {}) {
    const requested = [];
    let maxInFlight = 0;
    let inFlight = 0;
    getSpy = (url) => {
      const page = Number(new URL(`http://x${url}`).searchParams.get('page'));
      requested.push(page);
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      return new Promise((resolve) => {
        setTimeout(() => {
          inFlight -= 1;
          if (page > totalPages)
            return resolve({ data: { data: [], meta: { last_page: totalPages } } });
          resolve({
            data: {
              data: Array.from({ length: pageSize }, (_, i) => ({ attributes: { page, i } })),
              meta: { last_page: totalPages },
            },
          });
        }, 5);
      });
    };
    sevimaApi.get = getSpy;
    return { requested, maxInFlight: () => maxInFlight };
  }

  it('memproses halaman berurutan dan berhenti di last_page', async () => {
    const { requested } = stubPages(3, { pageSize: 2 });
    const seen = [];

    await paginateSevimaPages({
      endpoint: '/siakadcloud/v1/mahasiswa',
      onPage: (list, { page, totalPages }) => {
        seen.push({ page, totalPages, size: list.length });
      },
    });

    expect(seen.map((entry) => entry.page)).toEqual([1, 2, 3]);
    expect(seen[0].totalPages).toBe(3);
    expect(seen[0].size).toBe(2);
    expect(requested).toContain(1);
  });

  it('membiarkan halaman berikutnya diminta sebelum halaman sebelumnya selesai ditulis', async () => {
    const tracker = stubPages(4);
    let writeDone = 0;

    await paginateSevimaPages({
      endpoint: '/siakadcloud/v1/x',
      onPage: async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        writeDone += 1;
      },
    });

    expect(writeDone).toBe(4);
    expect(tracker.maxInFlight()).toBeGreaterThan(1);
  });

  it('tidak menggantung saat onPage melempar error', async () => {
    stubPages(5);
    await expect(
      paginateSevimaPages({
        endpoint: '/siakadcloud/v1/x',
        onPage: () => {
          throw new Error('DB down');
        },
      }),
    ).rejects.toThrow('DB down');
  });
});

describe('bulkUpsertStudents', () => {
  const originalExecuteRaw = prisma.$executeRaw;

  afterAll(() => {
    prisma.$executeRaw = originalExecuteRaw;
  });

  it('satu statement per chunk dan nilai user lewat parameter, bukan string SQL', async () => {
    const captured = [];
    prisma.$executeRaw = async (query) => {
      captured.push(query);
      return 1;
    };

    const rows = Array.from({ length: 201 }, (_, index) => ({
      nim: `2024${String(index).padStart(4, '0')}`,
      nama: index === 0 ? "Budi'; DROP TABLE students;--" : `Mahasiswa ${index}`,
      jenjang: 'S1',
      periodeMasuk: '20241',
      periodeTerakhir: '',
      angkatan: '2024',
      periode: 'Ganjil',
      programStudi: 'Informatika',
      fakultas: 'FST',
      statusKeaktifan: 'Aktif',
      semester: 3,
      kewarganegaraan: 'Indonesia',
      nik: '',
      tanggalLahir: '',
    }));

    const written = await bulkUpsertStudents(rows);

    // DB_CHUNK_SIZE default 200 -> 201 baris jadi 2 statement, bukan 201.
    expect(written).toBe(201);
    expect(captured.length).toBe(2);
    expect(captured[0].sql).toContain('ON DUPLICATE KEY UPDATE');
    expect(captured[0].sql).not.toContain('Budi');
    expect(captured[0].values).toContain(rows[0].nama);
  });

  it('identifier tercetak sebagai nama kolom, bukan objek fragmen', async () => {
    // Regresi nyata: `Prisma.raw` yang disisipkan ke template `Prisma.raw` mencetak
    // `[object Object] = VALUES([object Object])` dan MariaDB menolak statement itu
    // (error 1064) — sync students & graduates mati total. Bentuk SQL-nya harus
    // diperiksa, bukan sekadar "ada klausa ON DUPLICATE KEY UPDATE".
    const captured = [];
    prisma.$executeRaw = async (query) => {
      captured.push(query.sql);
      return 1;
    };

    await bulkUpsertStudents([{ nim: 'A1', nama: 'Ann', semester: 1 }]);

    expect(captured[0]).toContain('INSERT INTO `students` (`nim`, `nama`, `jenjang`');
    expect(captured[0]).toContain('`nama` = VALUES(`nama`)');
    expect(captured[0]).toContain('`updatedAt` = VALUES(`updatedAt`)');
    expect(captured[0]).not.toContain('`nim` = VALUES(`nim`)');
    expect(captured[0]).not.toContain('[object Object]');
  });

  it('chunkBy memotong list sesuai ukuran', () => {
    expect(chunkBy([], 10)).toEqual([]);
    expect(chunkBy([1, 2, 3], 2).length).toBe(2);
  });

  it('tidak memanggil DB untuk input kosong', async () => {
    let calls = 0;
    prisma.$executeRaw = async () => {
      calls += 1;
      return 0;
    };
    await expect(bulkUpsertStudents([])).resolves.toBe(0);
    expect(calls).toBe(0);
  });
});
