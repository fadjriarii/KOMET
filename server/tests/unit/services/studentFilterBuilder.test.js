import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { buildStudentFilter, buildBaseFilter } = require('../../../src/services/students/filterBuilder');

describe('student filter builder', () => {
  it('keeps year filtering in the backend as OR startsWith conditions', () => {
    const filter = buildStudentFilter({ angkatanTahun: ['2025', '2024'], statusKeaktifan: 'Aktif' });
    expect(filter.AND).toEqual([{ OR: [
      { angkatan: { startsWith: '2025' } },
      { angkatan: { startsWith: '2024' } },
    ] }]);
    expect(filter.statusKeaktifan).toBe('Aktif');
  });

  it('applies all dashboard filters and defaults status to active', () => {
    const filter = buildBaseFilter({ jenjang: 'S1', semester: '1', periodeMasuk: 'Ganjil' });
    expect(filter.jenjang).toEqual({ in: ['S1'] });
    expect(filter.semester).toEqual({ in: [1] });
    // Ganjil → kode periode berakhir "1" (business rules: 20251=Ganjil, 20252=Genap)
    expect(filter.periodeMasuk).toEqual({ endsWith: '1' });
    expect(filter.statusKeaktifan).toBe('Aktif');
  });
});
