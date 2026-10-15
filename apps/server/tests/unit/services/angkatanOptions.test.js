import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { getRollingYears } = require('../../../src/services/students/filterOptions');

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
