import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { contractFor, contractProblems } = require('@komet/shared/contracts');
const { getStudentSummary } = require('../../../src/services/students/studentSummary');

// These assertions read live SEVIMA data, so they drift after every sync and
// cannot run in CI. Opt in with RUN_DB_TESTS=1 after a sync.
const describeDb = process.env.RUN_DB_TESTS === '1' ? describe : describe.skip;

describeDb('student summary service (real database)', () => {
  it('menyusun kpis default dari database riil Sevima', async () => {
    const result = await getStudentSummary({});

    expect(result.kpis).toMatchObject({
      activeStudentsCount: 611,
      foreignStudentsCount: 14,
      intakeCohortCount: 169,
      intakePeriod: '2026/2027',
      intakeSemesterTerm: null,
      declinePeriod: '2026/2027',
      hasEnoughDeclineData: true,
      activeStudentStatus: { isAll: false, statuses: ['Aktif'], isCumulative: false },
    });

    expect(
      contractProblems(contractFor('/students/summary'), { success: true, ...result }),
    ).toEqual([]);
  });

  it('mengumumkan scope filter yang tepat untuk badge terfilter', async () => {
    const { kpiFilterScope } = await getStudentSummary({});

    expect(kpiFilterScope.active).toContain('statusKeaktifan');
    expect(kpiFilterScope.active).toContain('semester');
    expect(kpiFilterScope.foreign).toContain('tahunAjaran');
    expect(kpiFilterScope.foreign).not.toContain('kewarganegaraan');
    expect(kpiFilterScope.intake).toContain('semester');
    expect(kpiFilterScope.intake).not.toContain('statusKeaktifan');
    expect(kpiFilterScope.decline).not.toContain('semester');
    expect(kpiFilterScope.decline).not.toContain('statusKeaktifan');
  });

  it('menghitung total mahasiswa baru intake saat filter semester 2 (data riil)', async () => {
    const result = await getStudentSummary({ semester: '2' });

    // Mahasiswa semester 2 masuk pada periode Genap 2025/2026 (20252).
    // Total mahasiswa baru yang masuk pada periode tersebut adalah 46 mahasiswa.
    expect(result.kpis.intakeCohortCount).toBe(46);
    expect(result.kpis.intakePeriod).toBe('2025/2026');
    expect(result.kpis.intakeSemesterTerm).toBe('Genap');
  });

  it('menghitung total mahasiswa baru intake saat filter semester 1 (data riil)', async () => {
    const result = await getStudentSummary({ semester: '1' });

    // Mahasiswa semester 1 masuk pada periode Ganjil 2026/2027 (20261).
    // Total mahasiswa baru yang masuk pada periode tersebut adalah 169 mahasiswa.
    expect(result.kpis.intakeCohortCount).toBe(169);
    expect(result.kpis.intakePeriod).toBe('2026/2027');
    expect(result.kpis.intakeSemesterTerm).toBe('Ganjil');
  });

  it('menjumlahkan total mahasiswa baru saat multi-semester dipilih', async () => {
    const result = await getStudentSummary({ semester: ['1', '2'] });

    // 169 (semester 1) + 46 (semester 2) = 215 mahasiswa baru
    expect(result.kpis.intakeCohortCount).toBe(215);
    expect(result.kpis.intakePeriod).toBe('terpilih');
  });
});
