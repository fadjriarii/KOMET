import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { getRollingYears } = require('../../../src/services/students/filterOptions');
const { applyCountOrder } = require('../../../src/services/students/filterOptions');

const LABELS = [
  '2026/2027',
  '2025/2026',
  '2024/2025',
  '2023/2024',
  '2022/2023',
  '2021/2022',
  '2020/2021',
  '2019/2020',
  '2018/2019',
  '2017/2018',
];

describe('rolling angkatan mengikuti tahun ajaran terpilih', () => {
  it('tanpa tahun: 5 terbaru dari data', () => {
    expect(getRollingYears(LABELS)).toEqual([
      '2026/2027',
      '2025/2026',
      '2024/2025',
      '2023/2024',
      '2022/2023',
    ]);
  });

  it('tahun 2021/2022: 5 tahun ke belakang dari tahun itu', () => {
    expect(getRollingYears(LABELS, 2021)).toEqual([
      '2021/2022',
      '2020/2021',
      '2019/2020',
      '2018/2019',
      '2017/2018',
    ]);
  });

  it('hanya label yang ada di data (tidak mengarang tahun kosong)', () => {
    expect(getRollingYears(['2021/2022', '2019/2020'], 2021)).toEqual(['2021/2022', '2019/2020']);
  });
});

describe('urutan opsi mengikuti hitungan aktif tahun terpilih', () => {
  it('terbanyak dulu, sisanya alfabetis, tak ada opsi hilang', () => {
    expect(applyCountOrder(['B', 'A', 'C'], ['C', 'A'])).toEqual(['C', 'A', 'B']);
    expect(applyCountOrder(['B', 'A'], [])).toEqual(['A', 'B']);
  });

  it('urutan fakultas/prodi 2024/2025 количеству populasi aktif tahun itu', async () => {
    const { getFilterOptions } = require('../../../src/services/students/filterOptions');
    const { getTotalActiveStudents } = require('../../../src/services/students/activeStudents');
    const { buildStudentFilter } = require('../../../src/services/students/filterBuilder');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const q = { statusKeaktifan: 'Aktif', tahunAjaran: '2024/2025' };
    const opts = await getFilterOptions('2024/2025');
    // Fakultas teratas = pemilik hitungan aktif terbesar tahun itu.
    const counts = await prisma.student.groupBy({
      by: ['fakultas'],
      where: buildStudentFilter(q),
      _count: { fakultas: true },
    });
    const top = counts.sort((a, b) => b._count.fakultas - a._count.fakultas)[0].fakultas;
    expect(opts.fakultas[0]).toBe(top);
    // Total opsi utuh (tak ada yang hilang karena sepi tahun itu).
    const all = await prisma.student.groupBy({ by: ['fakultas'], _count: { fakultas: true } });
    expect([...opts.fakultas].sort()).toEqual(
      all
        .map((r) => r.fakultas)
        .filter(Boolean)
        .sort(),
    );
    expect(await getTotalActiveStudents(buildStudentFilter(q))).toBeGreaterThan(0);
    await prisma.$disconnect();
  });
});
