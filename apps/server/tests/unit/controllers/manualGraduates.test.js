import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const prisma = require('../../../src/config/prisma');
const { selectManualGraduates } = require('../../../src/controllers/sync/manualGraduates');
const { insertManualGraduates } = require('../../../src/controllers/sync/syncGraduates');

describe('manual graduates selector', () => {
  it('memilih hanya NIM yang tidak ada di API response', async () => {
    const syncedNims = new Set(['17010091']); // Jayne dari API (dummy)
    const pending = selectManualGraduates(syncedNims);
    expect(pending).toHaveLength(4);
    expect(pending.map((r) => r.nim)).not.toContain('17010091');
  });

  it('semua NIM ada → kosong', () => {
    const syncedNims = new Set(['17010091', '18010193', '18010037', '18010209', '18010226']);
    expect(selectManualGraduates(syncedNims)).toHaveLength(0);
  });
});

describe('insert manual graduates', () => {
  let originalFindMany;
  let originalExecuteRaw;

  beforeAll(() => {
    originalFindMany = prisma.student.findMany;
    originalExecuteRaw = prisma.$executeRaw;
  });

  afterAll(() => {
    prisma.student.findMany = originalFindMany;
    prisma.$executeRaw = originalExecuteRaw;
  });

  it('semua NIM sudah ada di API → tidak menulis apa pun', async () => {
    const count = await insertManualGraduates(
      new Set(['17010091', '18010193', '18010037', '18010209', '18010226']),
    );
    expect(count).toBe(0);
  });

  it('mencari jenjang via student dan upsert dengan data benar', async () => {
    prisma.student.findMany = async () => [
      { nim: '17010091', jenjang: 'S1' },
      { nim: '18010193', jenjang: 'S1' },
    ];

    const captured = [];
    const capturedValues = [];
    prisma.$executeRaw = async (q) => {
      captured.push(String(q.sql ?? q.rawValue));
      capturedValues.push(q.values ?? []);
      return 1;
    };

    // 2 dari 5 belum terbit di API → 2 baris manual; 3 sisanya dilewati.
    const result = await insertManualGraduates(new Set(['18010037', '18010209', '18010226']));

    expect(result).toBe(2);
    // Satu INSERT graduate + satu UPDATE status mahasiswa (periode kosong → tak ada UPDATE periode).
    expect(captured).toHaveLength(2);
    const insertIndex = captured.findIndex((sql) => sql.includes('INSERT INTO `graduates`'));
    expect(insertIndex).toBeGreaterThanOrEqual(0);
    expect(captured[insertIndex]).toContain('ON DUPLICATE KEY UPDATE');
    expect(captured[insertIndex]).not.toContain('[object Object]');

    // Nilai operator benar-benar terkirim: 3.42 / 127 milik Jayne Salma Cross.
    expect(capturedValues[insertIndex]).toContain(3.42);
    expect(capturedValues[insertIndex]).toContain(127);
    expect(capturedValues[insertIndex]).toContain('17010091');
  });
});
