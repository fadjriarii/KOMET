import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { buildIntakeBreakdown } = require('../../../src/services/students/intakeBreakdown');

const row = (periodeMasuk, programStudi, statusKeaktifan, count) => ({
  periodeMasuk,
  programStudi,
  statusKeaktifan,
  _count: { periodeMasuk: count },
});

describe('buildIntakeBreakdown', () => {
  const rows = [
    row('20211', 'Biomedis', 'Lulus', 8),
    row('20211', 'Biomedis', 'Keluar', 2),
    row('20221', 'Biomedis', 'Aktif', 5),
    row('20222', 'Bisnis', 'Aktif', 4),
    row('20231', 'Bisnis', 'Aktif', 6),
    row('20151', 'Bisnis', 'Lulus', 9), // di luar jendela 2019/2020–2023/2024
  ];
  const result = buildIntakeBreakdown(rows, '2023/2024');

  it('memakai jendela 5 tahun mundur dari tahun terpilih', () => {
    expect(result.years).toEqual(['2019/2020', '2020/2021', '2021/2022', '2022/2023', '2023/2024']);
    expect(result.anchorYear).toBe('2023/2024');
  });

  it('memecah intake per prodi per tahun dan menghitung penurunan per prodi', () => {
    const bisnis = result.byProdi.find((item) => item.name === 'Bisnis');
    expect(bisnis.count).toBe(6);
    expect(bisnis.years['2022/2023']).toBe(4);
    // (6 - 4) / 4 = +50%, satu-satunya pembanding yang ada di data.
    expect(bisnis.declinePercentage).toBeCloseTo(50);
    expect(result.byProdi[0].name).toBe('Bisnis');
    expect(bisnis.percentage).toBe(100);
  });

  it('memecah tiap tahun masuk per status saat ini', () => {
    const y2021 = result.statusByYear.find((item) => item.tahun === '2021/2022');
    expect(y2021).toEqual({ tahun: '2021/2022', total: 10, byStatus: { Lulus: 8, Keluar: 2 } });
    // Lulus angkatan 2015 di luar jendela tidak ikut menaikkan urutan status.
    expect(result.statuses).toEqual(['Aktif', 'Lulus', 'Keluar']);
  });
});
