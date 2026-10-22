import { afterEach, describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { getRollingYears } = require('../../../src/services/students/filterOptions');
const { applyCountOrder } = require('../../../src/services/students/filterOptions');
const prisma = require('../../../src/config/prisma');

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
  const originalGroupBy = prisma.student.groupBy;

  afterEach(() => {
    prisma.student.groupBy = originalGroupBy;
  });

  it('terbanyak dulu, sisanya alfabetis, tak ada opsi hilang', () => {
    expect(applyCountOrder(['B', 'A', 'C'], ['C', 'A'])).toEqual(['C', 'A', 'B']);
    expect(applyCountOrder(['B', 'A'], [])).toEqual(['A', 'B']);
  });

  it('urutan fakultas/prodi 2024/2025 mengikuti populasi aktif tahun itu', async () => {
    const { getFilterOptions } = require('../../../src/services/students/filterOptions');
    const { buildStudentFilter } = require('../../../src/services/students/filterBuilder');
    const q = { statusKeaktifan: 'Aktif', tahunAjaran: '2024/2025' };

    prisma.student.groupBy = async ({ by, where }) => {
      const field = by[0];
      const isActiveScope = where?.statusKeaktifan === 'Aktif' && where?.periodeMasuk;

      if (field === 'fakultas') {
        return isActiveScope
          ? [
              { fakultas: 'FEB', _count: { fakultas: 10 } },
              { fakultas: 'FT', _count: { fakultas: 8 } },
            ]
          : [
              { fakultas: 'FIK', _count: { fakultas: 30 } },
              { fakultas: 'FT', _count: { fakultas: 20 } },
              { fakultas: 'FEB', _count: { fakultas: 10 } },
            ];
      }

      if (field === 'programStudi') {
        return isActiveScope
          ? [
              { programStudi: 'AK', _count: { programStudi: 9 } },
              { programStudi: 'TI', _count: { programStudi: 8 } },
            ]
          : [
              { programStudi: 'SI', _count: { programStudi: 30 } },
              { programStudi: 'TI', _count: { programStudi: 20 } },
              { programStudi: 'AK', _count: { programStudi: 10 } },
            ];
      }

      if (field === 'angkatan') {
        return [
          { angkatan: '2024/2025', _count: { angkatan: 12 } },
          { angkatan: '2023/2024', _count: { angkatan: 6 } },
        ];
      }
      if (field === 'semester') {
        return [
          { semester: '2', _count: { semester: 10 } },
          { semester: '10', _count: { semester: 2 } },
        ];
      }
      if (field === 'periodeMasuk') {
        return [
          { periodeMasuk: '2024/2025', _count: { periodeMasuk: 8 } },
          { periodeMasuk: '2023/2024', _count: { periodeMasuk: 4 } },
        ];
      }
      if (field === 'kewarganegaraan') {
        return [{ kewarganegaraan: 'WNI', _count: { kewarganegaraan: 12 } }];
      }
      if (field === 'statusKeaktifan') {
        return [{ statusKeaktifan: 'Aktif', _count: { statusKeaktifan: 12 } }];
      }
      if (field === 'jenjang') {
        return [{ jenjang: 'S1', _count: { jenjang: 12 } }];
      }

      return [];
    };

    const opts = await getFilterOptions('2024/2025');

    expect(opts.fakultas).toEqual(['FEB', 'FT', 'FIK']);
    expect([...opts.fakultas].sort()).toEqual(['FEB', 'FIK', 'FT']);
    expect(opts.programStudi).toEqual(['AK', 'TI', 'SI']);
    expect(prisma.student.groupBy).toHaveBeenCalledWith({
      by: ['fakultas'],
      where: buildStudentFilter(q),
      _count: { fakultas: true },
    });
  });
});
