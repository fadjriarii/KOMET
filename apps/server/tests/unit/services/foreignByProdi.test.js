import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { foreignByProdi } = require('../../../src/services/students/international/nationality');

describe('foreignByProdi', () => {
  const row = (programStudi, idNegara, kewarganegaraan, count) => ({
    programStudi,
    idNegara,
    kewarganegaraan,
    _count: { kewarganegaraan: count },
  });

  it('menghitung WNA dan persentasenya per prodi dengan aturan kode negara', () => {
    const result = foreignByProdi([
      row('Farmasi', 'IDN', 'Indonesia', 18),
      row('Farmasi', 'MYS', 'Malaysia', 2),
      row('Biomedis', 'IDN', 'Indonesia', 40),
      row('Biomedis', '', 'Timor Leste', 1),
    ]);
    expect(result).toEqual([
      { name: 'Farmasi', count: 2, total: 20, percentage: 10 },
      { name: 'Biomedis', count: 1, total: 41, percentage: 2.44 },
    ]);
  });
});
