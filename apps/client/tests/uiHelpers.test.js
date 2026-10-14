import { describe, expect, it } from 'vitest';
import { getDemographicContextLabel, getStudentStatusPresentation } from '../src/utils/uiHelpers';

describe('getStudentStatusPresentation (hanya tata bahasa)', () => {
  it('memakai populasi default sebelum snapshot server tiba', () => {
    expect(getStudentStatusPresentation()).toMatchObject({
      cardTitle: 'Mahasiswa Aktif',
      cardBadge: 'Status Aktif',
      summaryLabel: 'Total Aktif',
      statusLabel: 'Aktif',
      isCumulative: false,
    });
  });

  it('menyusun label untuk satu status, banyak status, dan semua status', () => {
    expect(getStudentStatusPresentation({ statuses: ['Cuti'], isCumulative: true })).toMatchObject({
      cardTitle: 'Mahasiswa Cuti',
      modalSubtitle: 'Informasi total student body dengan status cuti',
      statusLabel: 'Cuti',
      isCumulative: true,
    });
    expect(
      getStudentStatusPresentation({ statuses: ['Cuti', 'Lulus'], isCumulative: true }),
    ).toMatchObject({
      cardTitle: 'Mahasiswa Status Terpilih',
      summaryLabel: 'Total Status Terpilih',
      statusLabel: 'Cuti, Lulus',
    });
    expect(
      getStudentStatusPresentation({ isAll: true, statuses: [], isCumulative: true }),
    ).toMatchObject({
      cardTitle: 'Mahasiswa Semua Status',
      cardBadge: 'Semua Status',
      modalSubtitle: 'Informasi total student body untuk seluruh status keaktifan',
      statusLabel: 'semua status',
      isCumulative: true,
    });
  });
});

describe('getDemographicContextLabel (hanya tata bahasa)', () => {
  it('mengosongkan label saat tidak ada filter demografis aktif', () => {
    expect(getDemographicContextLabel([], [], [])).toBe('');
    expect(getDemographicContextLabel([[], [], []])).toBe('');
    expect(getDemographicContextLabel([undefined, null, ''])).toBe('');
    expect(getDemographicContextLabel()).toBe('');
  });

  it('tidak menghasilkan koma berlebih saat filter terisi sebagian', () => {
    expect(getDemographicContextLabel([['FST'], [], []])).toBe('FST');
    expect(getDemographicContextLabel(['FST'], [], [])).toBe('FST');
    expect(getDemographicContextLabel([[], ['Informatika'], []])).toBe('Informatika');
  });

  it('menyambung label multi-pilihan dengan koma', () => {
    expect(getDemographicContextLabel(['FST'], ['Ilmu Komputer'], ['S1'])).toBe(
      'FST, Ilmu Komputer, S1',
    );
    expect(getDemographicContextLabel([['FST'], ['Ilmu Komputer'], ['S1']])).toBe(
      'FST, Ilmu Komputer, S1',
    );
  });
});
