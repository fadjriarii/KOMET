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

  it('keeps all non-empty statuses when the UI requests all statuses', () => {
    const filter = buildBaseFilter({ statusKeaktifan: '__ALL__' });
    expect(filter.statusKeaktifan).toEqual({ not: '' });
  });

  it('filters by tahunAjaran academic year', () => {
    const filter = buildStudentFilter({ tahunAjaran: '2024/2025' });
    expect(filter.AND).toContainEqual({ periodeMasuk: { lte: '20242' } });
    expect(filter.AND).toContainEqual({
      OR: [
        { periodeTerakhir: { gte: '20241' } },
        { AND: [{ periodeTerakhir: '' }, { semester: { gte: 1 } }] },
      ],
    });
    expect(filter.statusKeaktifan).toBeUndefined();
  });

  it('combines tahunAjaran with periodeMasuk Ganjil/Genap', () => {
    const filter = buildStudentFilter({ tahunAjaran: '2024/2025', periodeMasuk: 'Ganjil' });
    expect(filter.AND).toContainEqual({ periodeMasuk: { endsWith: '1' } });
  });

  it('ignores non-string selectedPeriode values', () => {
    const filter = buildStudentFilter({ selectedPeriode: ['2024/2025'] });
    expect(filter.AND).toBeUndefined();
    expect(filter.statusKeaktifan).toBe('Aktif');
  });

  it('uses historical active population instead of current status', () => {
    const filter = buildStudentFilter({
      tahunAjaran: '2020/2021',
      statusKeaktifan: 'Aktif',
    });

    expect(filter.AND).toContainEqual({ periodeMasuk: { lte: '20202' } });
    expect(filter.AND).toContainEqual({
      OR: [
        { periodeTerakhir: { gte: '20201' } },
        { AND: [{ periodeTerakhir: '' }, { semester: { gte: 1 } }] },
      ],
    });
    // Status saat ini (misalnya Lulus/Mengundurkan diri) tidak membatasi
    // mahasiswa yang masih aktif pada tahun ajaran historis tersebut.
    expect(filter.statusKeaktifan).toBeUndefined();
  });

  it('excludes students who leave during the selected academic year', () => {
    const filter = buildBaseFilter({ tahunAjaran: '2015/2016' });

    expect(filter.AND).toContainEqual({ periodeMasuk: { lte: '20152' } });
    expect(filter.AND).toContainEqual({
      OR: [
        { periodeTerakhir: { gte: '20151' } },
        { AND: [{ periodeTerakhir: '' }, { semester: { gte: 1 } }] },
      ],
    });
  });
});
