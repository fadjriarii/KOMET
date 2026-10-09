import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  buildGraduateFilter,
  getRequestedJenjang,
  includesJenjang,
} = require('../../../src/services/graduates/filterBuilder');

describe('graduate filter builder', () => {
  it('turns repeated faculty and jenjang query values into Prisma in filters', () => {
    const where = buildGraduateFilter({
      fakultas: ['FIK', 'FEB'],
      jenjang: ['S1', 'S2'],
      programStudi: ['Informatika', 'Akuntansi'],
    });

    // Populasi student-base: kolom student flat di top-level.
    expect(where.statusKeaktifan).toBe('Lulus');
    expect(where.jenjang).toEqual({ in: ['S1', 'S2'] });
    expect(where.fakultas).toEqual({ in: ['FIK', 'FEB'] });
    expect(where.programStudi).toEqual({ in: ['Informatika', 'Akuntansi'] });
  });

  it('membaca bentuk `{ in: [...] }`, bukan hanya string', () => {
    // Bentuk asli dari buildGraduateFilter(); perbandingan string terhadapnya
    // selalu false dan membuat kedua jenjang dihitung dari populasi yang sama.
    expect(getRequestedJenjang(buildGraduateFilter({ jenjang: 'S2' }))).toEqual(['S2']);
    expect(getRequestedJenjang(buildGraduateFilter({ jenjang: ['S2', 'S1'] }))).toEqual([
      'S2',
      'S1',
    ]);
    expect(includesJenjang(buildGraduateFilter({ jenjang: 'S2' }), 'S1')).toBe(false);
    expect(includesJenjang(buildGraduateFilter({ jenjang: 'S2' }), 'S2')).toBe(true);
  });

  it('tanpa filter jenjang, seluruh populasi diminta (bukan daftar statis)', () => {
    // `Prof` ikut populasi: helper tak boleh mengunci S1/S2.
    expect(getRequestedJenjang({})).toBeNull();
    expect(getRequestedJenjang(buildGraduateFilter({}))).toBeNull();
    expect(includesJenjang({}, 'Prof', ['S1', 'S2', 'Prof'])).toBe(true);
    // Nilai yang diminta user dikembalikan apa adanya — termasuk yang asing.
    expect(getRequestedJenjang({ jenjang: 'D3' })).toEqual(['D3']);
  });

  it('periode wisuda Ganjil/Genap = akhiran kode seperti periode masuk', () => {
    expect(buildGraduateFilter({ periodeWisuda: 'Ganjil' }).graduate.periodeWisuda).toEqual({
      endsWith: '1',
    });
    expect(buildGraduateFilter({ periodeWisuda: 'Genap' }).graduate.periodeWisuda).toEqual({
      endsWith: '2',
    });
  });

  it('tahun lulus hidup di relasi graduate, bukan kolom student', () => {
    const where = buildGraduateFilter({ tahunLulus: '2023/2024' });
    expect(where.tahunLulus).toBeUndefined();
    expect(where.graduate.tahunLulus).toEqual({ in: ['2023/2024'] });
  });

  it('angkatan memakai label ajaran penuh (exact-match in)', () => {
    const where = buildGraduateFilter({ angkatanTahun: ['2021/2022', '2020/2021'] });
    expect(where.angkatan).toEqual({ in: ['2021/2022', '2020/2021'] });
  });

  it('predikat memfilter label tersimpan ATAU fallback IPK baris lama', () => {
    const where = buildGraduateFilter({ predikat: ['Cum Laude'] });
    const branch = where.graduate.AND[0].OR[0].OR;
    expect(branch).toContainEqual({ predikatLulus: 'Cum Laude' });
    expect(branch).toContainEqual({ predikatLulus: '', ipk: { gte: 3.51 } });
  });
});
