import { afterAll, describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const prisma = require('../../../src/config/prisma');
const {
  getGraduateFilterOptions,
  clearGraduateFilterCache,
} = require('../../../src/services/graduates/filterOptions');

const originalStudentGroupBy = prisma.student.groupBy;
const originalGraduateGroupBy = prisma.graduate.groupBy;

afterAll(() => {
  prisma.student.groupBy = originalStudentGroupBy;
  prisma.graduate.groupBy = originalGraduateGroupBy;
  clearGraduateFilterCache();
});

// Opsi distinct per kolom; predikat menyertakan satu label baru dari API
// dan satu baris kosong (baris lama) yang bukan pilihan.
function stubGroupBy() {
  prisma.student.groupBy = async ({ by }) => {
    const field = by[0];
    const values =
      {
        programStudi: ['Bio Teknologi'],
        angkatan: ['2021/2022', '2022/2023', '2023/2024', '2024/2025', '2025/2026'],
        fakultas: ['Ilmu Kesehatan dan Biosains'],
        jenjang: ['S1'],
      }[field] || [];
    return values.map((value) => ({ [field]: value, _count: { [field]: 1 } }));
  };
  prisma.graduate.groupBy = async ({ by }) => {
    const field = by[0];
    const values =
      {
        tahunLulus: ['2021/2022', '2022/2023', '2023/2024', '2024/2025', '2025/2026'],
        predikatLulus: ['Cum Laude', 'Dengan Pujian', ''],
      }[field] || [];
    return values.map((value) => ({ [field]: value, _count: { [field]: 1 } }));
  };
}

describe('graduate filterOptions', () => {
  it('menggabungkan label predikat baru dari API ke opsi Status Kelulusan', async () => {
    stubGroupBy();
    clearGraduateFilterCache();
    const options = await getGraduateFilterOptions();
    expect(options.predikatOptions.map((option) => option.value)).toEqual([
      'Cum Laude',
      'Sangat Memuaskan',
      'Memuaskan',
      'Belum Terklasifikasi',
      'Dengan Pujian',
    ]);
  });

  it('opsi fakultas, prodi, dan jenjang mengikuti data DB apa adanya', async () => {
    stubGroupBy();
    clearGraduateFilterCache();
    const options = await getGraduateFilterOptions();
    expect(options.fakultas).toEqual(['Ilmu Kesehatan dan Biosains']);
    expect(options.programStudi).toEqual(['Bio Teknologi']);
    expect(options.jenjang).toEqual(['S1']);
  });
});
