import { describe, expect, it } from 'vitest';
import { intakeExtraTabs } from '../src/modules/students/components/modals/intakeExtraTabs';

const breakdown = (overrides) => ({
  anchorYear: '2026/2027',
  years: ['2025/2026', '2026/2027'],
  byProdi: [
    { name: 'Bio Teknologi', count: 40, percentage: 60, years: {}, declinePercentage: 4 },
    { name: 'Farmasi', count: 27, percentage: 40, years: {}, declinePercentage: -2 },
  ],
  statusByYear: [],
  statuses: ['Aktif', 'Lulus'],
  ...overrides,
});
const keys = (data, options) => intakeExtraTabs(data, options).tabs.map((tab) => tab.key);

describe('intakeExtraTabs', () => {
  it('Intake: Per Program Studi dan Status Saat Ini saat datanya lebih dari satu', () => {
    expect(keys(breakdown(), { withStatus: true })).toEqual(['prodi', 'status']);
  });

  it('Penurunan: hanya Per Program Studi', () => {
    expect(keys(breakdown())).toEqual(['prodi']);
  });

  it('menyembunyikan tab yang isinya satu kategori, dan tidak ada tab saat memuat', () => {
    const single = breakdown({ byProdi: [breakdown().byProdi[0]], statuses: ['Aktif'] });
    expect(keys(single, { withStatus: true })).toEqual([]);
    expect(keys(undefined, { withStatus: true })).toEqual([]);
  });
});
