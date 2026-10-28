import { describe, expect, it, beforeAll, afterAll, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// Delay & window dibaca saat modul dimuat, jadi environment diset sebelum require.
process.env.SEVIMA_PAGE_DELAY_MS = '0';
process.env.SEVIMA_FETCH_WINDOW = '3';

const sevimaApi = require('../../../src/config/sevimaApi');
const prisma = require('../../../src/config/prisma');
const { paginateSevimaPages } = require('../../../src/controllers/sync/sevimaLookup');
const {
  fetchCutiNims,
  fetchCutiHistory,
  buildPeriodRange,
} = require('../../../src/controllers/sync/studentCuti');
const {
  bulkUpsertStudents,
  replaceCutiPeriods,
} = require('../../../src/controllers/sync/bulkWrite');
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

  it('window 1 memaksa halaman diambil satu per satu', async () => {
    const tracker = stubPages(3);
    await paginateSevimaPages({
      endpoint: '/siakadcloud/v1/x',
      window: 1,
      onPage: () => {},
    });
    expect(tracker.maxInFlight()).toBe(1);
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

  it('meneruskan filter sebagai params, bukan menempel di URL', async () => {
    const calls = [];
    sevimaApi.get = async (url, config) => {
      calls.push({ url, config });
      return { data: { data: [], meta: { last_page: 1 } } };
    };

    await paginateSevimaPages({
      endpoint: '/siakadcloud/v1/perwalian',
      params: { 'f-id_periode': '20261' },
      onPage: () => {},
    });

    expect(calls[0]).toEqual({
      url: '/siakadcloud/v1/perwalian',
      config: { params: { 'f-id_periode': '20261', page: 1 } },
    });
  });
});

describe('fetchCutiNims', () => {
  const originalGet = sevimaApi.get;

  afterAll(() => {
    sevimaApi.get = originalGet;
  });

  it('mengambil NIM berstatus C saja dan membuang baris ganda', async () => {
    sevimaApi.get = async () => ({
      data: {
        data: [
          { attributes: { nim: '23010099', id_status_mahasiswa: 'C' } },
          { attributes: { nim: '23010099', id_status_mahasiswa: 'C' } },
          { attributes: { nim: '25010108', id_status_mahasiswa: 'KM' } },
          { attributes: { nim: '', id_status_mahasiswa: 'C' } },
        ],
        meta: { last_page: 1 },
      },
    });

    await expect(fetchCutiNims('20261')).resolves.toEqual(new Set(['23010099']));
  });
});

describe('fetchCutiHistory', () => {
  const originalGet = sevimaApi.get;

  afterAll(() => {
    sevimaApi.get = originalGet;
  });

  it('mengambil cuti per periode dan mempertahankan periode yang gagal', async () => {
    sevimaApi.get = async (_url, { params }) => {
      if (params['f-id_periode'] === '20242') throw new Error('boom');
      return {
        data: {
          data: [{ attributes: { nim: '23010099', id_status_mahasiswa: 'C' } }],
          meta: { last_page: 1 },
        },
      };
    };

    const history = await fetchCutiHistory(['20241', '20242']);
    expect(history.get('20241')).toEqual(new Set(['23010099']));
    expect(history.get('20242')).toBeNull();
  });

  it('membangun rentang periode Ganjil/Genap inklusif', () => {
    expect(buildPeriodRange('20241', '20252')).toEqual(['20241', '20242', '20251', '20252']);
    expect(buildPeriodRange('tidak-valid', '20252')).toEqual(['20252']);
  });
});

describe('replaceCutiPeriods', () => {
  const originalFindMany = prisma.student.findMany;
  const originalTransaction = prisma.$transaction;

  afterAll(() => {
    prisma.student.findMany = originalFindMany;
    prisma.$transaction = originalTransaction;
  });

  it('hanya menyimpan NIM yang ada dan mengganti satu periode dalam transaksi', async () => {
    prisma.student.findMany = vi.fn(async ({ where }) =>
      where.nim.in.filter((nim) => nim !== 'tidak-ada').map((nim) => ({ nim })),
    );
    const tx = { studentCutiPeriod: { deleteMany: vi.fn(), createMany: vi.fn() } };
    prisma.$transaction = vi.fn(async (fn) => fn(tx));

    await expect(replaceCutiPeriods('20241', ['23010099', 'tidak-ada'])).resolves.toBe(1);
    expect(tx.studentCutiPeriod.deleteMany).toHaveBeenCalledWith({
      where: { periode: '20241' },
    });
    expect(tx.studentCutiPeriod.createMany.mock.calls[0][0].data).toEqual([
      { nim: '23010099', periode: '20241' },
    ]);
  });

  it('memetakan NIM akun lama xx ke NIM bersih yang ada', async () => {
    prisma.student.findMany = vi.fn(async ({ where }) =>
      where.nim.in.includes('23010099') ? [{ nim: '23010099' }] : [],
    );
    const tx = { studentCutiPeriod: { deleteMany: vi.fn(), createMany: vi.fn() } };
    prisma.$transaction = vi.fn(async (fn) => fn(tx));

    await expect(replaceCutiPeriods('20242', ['XX23010099'])).resolves.toBe(1);
    expect(tx.studentCutiPeriod.createMany.mock.calls[0][0].data).toEqual([
      { nim: '23010099', periode: '20242' },
    ]);
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
