import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  FILTER_SCOPES,
  buildStudentFilter,
  buildTerminalPeriodCondition,
  ensurePopulationFilter,
  getAcademicPeriodBounds,
  isTerminalInAcademicYear,
  matchesStudentCondition,
} = require('../../../src/services/students/filterBuilder');

describe('student filter builder', () => {
  // ── Filter dasar (tanpa Tahun Ajaran) ───────────────────────────────────────

  it('defaults to statusKeaktifan Aktif when no params given', () => {
    const filter = buildStudentFilter({});
    expect(filter.statusKeaktifan).toBe('Aktif');
    expect(filter.AND).toBeUndefined();
  });

  it('keeps angkatan year filtering as OR startsWith conditions', () => {
    const filter = buildStudentFilter({
      angkatanTahun: ['2025', '2024'],
      statusKeaktifan: 'Aktif',
    });
    expect(filter.AND).toEqual([
      { OR: [{ angkatan: { startsWith: '2025' } }, { angkatan: { startsWith: '2024' } }] },
    ]);
    expect(filter.statusKeaktifan).toBe('Aktif');
  });

  it('applies multi-select filters and defaults status to Aktif', () => {
    const filter = buildStudentFilter({ jenjang: 'S1', semester: '1', periodeMasuk: 'Ganjil' });
    expect(filter.jenjang).toEqual({ in: ['S1'] });
    expect(filter.semester).toEqual({ in: [1] });
    expect(filter.periodeMasuk).toEqual({ endsWith: '1' });
    expect(filter.statusKeaktifan).toBe('Aktif');
  });

  it('Semua Status (ALL) menjadi predikat eksplisit, bukan default Aktif', () => {
    const filter = buildStudentFilter({ statusKeaktifan: 'ALL' });
    expect(filter.statusKeaktifan).toEqual({ not: '' });
  });

  it('Semua Status (ALL) bertahan setelah ensurePopulationFilter', () => {
    // Kartu mahasiswa aktif & mahasiswa asing memakai populasi yang sama
    // dengan filter pengguna, bukan dipaksa kembali ke 'Aktif'.
    const filter = ensurePopulationFilter(buildStudentFilter({ statusKeaktifan: 'ALL' }));
    expect(filter.statusKeaktifan).toEqual({ not: '' });
  });

  it('kosong atau tidak dikirim memakai populasi default Aktif', () => {
    expect(buildStudentFilter({}).statusKeaktifan).toBe('Aktif');
    expect(buildStudentFilter({ statusKeaktifan: '' }).statusKeaktifan).toBe('Aktif');
    expect(buildStudentFilter({ statusKeaktifan: [] }).statusKeaktifan).toBe('Aktif');
  });

  it('ignores non-string selectedPeriode values (e.g. array)', () => {
    const filter = buildStudentFilter({ selectedPeriode: ['2024/2025'] });
    expect(filter.AND).toBeUndefined();
    expect(filter.statusKeaktifan).toBe('Aktif');
  });

  // ── Tahun Ajaran + Status default 'Aktif' ───────────────────────────────────

  it('TA historis + status Aktif (default): memproyeksikan status Aktif pada batas akhir TA', () => {
    const filter = buildStudentFilter({ tahunAjaran: '2023/2024' });
    expect(filter.AND).toContainEqual({ periodeMasuk: { lte: '20232' } });
    // Status aktif historis memperhitungkan paritas semester yang ditempuh.
    expect(filter.AND).toContainEqual({
      OR: [
        {
          OR: [
            { statusKeaktifan: 'Aktif' },
            { periodeTerakhir: '' },
            { periodeTerakhir: { gt: '20232' } },
            { AND: [{ periodeTerakhir: '20232' }, { periodeMasuk: { endsWith: '2' } }] },
          ],
        },
      ],
    });
    expect(filter.statusKeaktifan).toBeUndefined();
  });

  it('TA historis + statusKeaktifan Aktif eksplisit: sama dengan default snapshot', () => {
    const filter = buildStudentFilter({ tahunAjaran: '2020/2021', statusKeaktifan: 'Aktif' });
    expect(filter.AND).toContainEqual({ periodeMasuk: { lte: '20202' } });
    expect(filter.AND).toContainEqual({
      OR: [
        {
          OR: [
            { statusKeaktifan: 'Aktif' },
            { periodeTerakhir: '' },
            { periodeTerakhir: { gt: '20202' } },
            { AND: [{ periodeTerakhir: '20202' }, { periodeMasuk: { endsWith: '2' } }] },
          ],
        },
      ],
    });
    expect(filter.statusKeaktifan).toBeUndefined();
  });

  // ── Tahun Ajaran + Semua Status ─────────────────────────────────────────────

  it('TA + Semua Status: seluruh mahasiswa dari awal berdiri s.d. akhir TA, tanpa filter status', () => {
    const filter = buildStudentFilter({ tahunAjaran: '2026/2027', statusKeaktifan: 'ALL' });

    // Hanya kondisi periodeMasuk <= akhir TA — tidak ada batasan periodeTerakhir
    expect(filter.AND).toContainEqual({ periodeMasuk: { lte: '20262' } });
    const hasPeriodeTerakhirBound = filter.AND?.some((c) =>
      c?.OR?.some((o) => o?.periodeTerakhir !== undefined),
    );
    expect(hasPeriodeTerakhirBound).toBeFalsy();

    expect(filter.statusKeaktifan).toBeUndefined();
  });

  it('TA + status kosong [] sama dengan tidak dikirim: default populasi Aktif', () => {
    const filter = buildStudentFilter({ tahunAjaran: '2025/2026', statusKeaktifan: [] });
    expect(filter.AND).toContainEqual({ periodeMasuk: { lte: '20252' } });
    expect(filter.AND).toContainEqual({
      OR: [
        {
          OR: [
            { statusKeaktifan: 'Aktif' },
            { periodeTerakhir: '' },
            { periodeTerakhir: { gt: '20252' } },
            { AND: [{ periodeTerakhir: '20252' }, { periodeMasuk: { endsWith: '2' } }] },
          ],
        },
      ],
    });
    expect(filter.statusKeaktifan).toBeUndefined();
  });

  // ── Tahun Ajaran + Status spesifik (Lulus / Transfer / dll.) ───────────────

  it('TA + Lulus: hanya kelulusan sebelum awal TA yang dipilih', () => {
    const filter = buildStudentFilter({ tahunAjaran: '2026/2027', statusKeaktifan: 'Lulus' });
    expect(filter.AND).toContainEqual({ periodeMasuk: { lte: '20262' } });
    expect(filter.AND).toContainEqual({
      OR: [
        {
          AND: [
            { statusKeaktifan: 'Lulus' },
            {
              OR: [
                { periodeTerakhir: { not: '', lt: '20261' } },
                { periodeTerakhir: '20261' },
                { AND: [{ periodeTerakhir: '20262' }, { periodeMasuk: { endsWith: '1' } }] },
              ],
            },
          ],
        },
      ],
    });
    expect(filter.statusKeaktifan).toBeUndefined();
  });

  it('TA + Transfer: keluar pada TA berjalan tetap Aktif sampai TA berikutnya', () => {
    const filter = buildStudentFilter({ tahunAjaran: '2025/2026', statusKeaktifan: 'Transfer' });
    expect(filter.AND).toContainEqual({ periodeMasuk: { lte: '20252' } });
    expect(filter.AND).toContainEqual({
      OR: [
        {
          AND: [
            { statusKeaktifan: 'Transfer' },
            {
              OR: [
                { periodeTerakhir: { not: '', lt: '20251' } },
                { periodeTerakhir: '20251' },
                { AND: [{ periodeTerakhir: '20252' }, { periodeMasuk: { endsWith: '1' } }] },
              ],
            },
          ],
        },
      ],
    });
    expect(filter.statusKeaktifan).toBeUndefined();
  });

  it('TA + multi-status terminal: memakai status dan batas periode kumulatif', () => {
    const filter = buildStudentFilter({
      tahunAjaran: '2024/2025',
      statusKeaktifan: ['Lulus', 'Drop Out'],
    });
    expect(filter.AND).toContainEqual({ periodeMasuk: { lte: '20242' } });
    expect(filter.AND).toContainEqual({
      OR: [
        {
          AND: [
            { statusKeaktifan: { in: ['Lulus', 'Drop Out'] } },
            {
              OR: [
                { periodeTerakhir: { not: '', lt: '20241' } },
                { periodeTerakhir: '20241' },
                { AND: [{ periodeTerakhir: '20242' }, { periodeMasuk: { endsWith: '1' } }] },
              ],
            },
          ],
        },
      ],
    });

    expect(filter.statusKeaktifan).toBeUndefined();
  });

  it('does not return a student who left during the selected academic year as terminal', () => {
    const filter = buildStudentFilter({
      tahunAjaran: '2014/2015',
      statusKeaktifan: 'Keluar',
    });

    expect(filter.AND).toContainEqual({
      OR: [
        {
          AND: [
            { statusKeaktifan: 'Keluar' },
            {
              OR: [
                { periodeTerakhir: { not: '', lt: '20141' } },
                { periodeTerakhir: '20141' },
                { AND: [{ periodeTerakhir: '20142' }, { periodeMasuk: { endsWith: '1' } }] },
              ],
            },
          ],
        },
      ],
    });
  });

  it('TA + Aktif dan Lulus: menggabungkan state aktif historis dan kelulusan kumulatif', () => {
    const filter = buildStudentFilter({
      tahunAjaran: '2025/2026',
      statusKeaktifan: ['Aktif', 'Lulus'],
    });
    expect(filter.AND).toContainEqual({
      OR: [
        {
          OR: [
            { statusKeaktifan: 'Aktif' },
            { periodeTerakhir: '' },
            { periodeTerakhir: { gt: '20252' } },
            { AND: [{ periodeTerakhir: '20252' }, { periodeMasuk: { endsWith: '2' } }] },
          ],
        },
        {
          AND: [
            { statusKeaktifan: 'Lulus' },
            {
              OR: [
                { periodeTerakhir: { not: '', lt: '20251' } },
                { periodeTerakhir: '20251' },
                { AND: [{ periodeTerakhir: '20252' }, { periodeMasuk: { endsWith: '1' } }] },
              ],
            },
          ],
        },
      ],
    });
  });

  // ── Kombinasi Tahun Ajaran + Periode Masuk (Ganjil/Genap) ──────────────────

  it('TA + Aktif + Periode Masuk Ganjil: tambah filter endsWith:1 dalam AND', () => {
    const filter = buildStudentFilter({
      tahunAjaran: '2024/2025',
      periodeMasuk: 'Ganjil',
    });
    expect(filter.AND).toContainEqual({ periodeMasuk: { endsWith: '1' } });
    expect(filter.statusKeaktifan).toBeUndefined();
  });

  // ── Scope filter: populasi dipilih saat filter dibangun, bukan dibuang sesudahnya ──

  it('COHORT: batas tahun akademik tetap ada, predikat status tidak pernah dibangun', () => {
    const cohort = buildStudentFilter(
      { tahunAjaran: '2025/2026', statusKeaktifan: 'Aktif' },
      { scope: FILTER_SCOPES.COHORT },
    );
    expect(cohort.AND).toEqual([{ periodeMasuk: { lte: '20252' } }]);
    expect(cohort.statusKeaktifan).toBeUndefined();
  });

  it('ALL_YEARS: tahun akademik terpilih diabaikan, status berjalan tetap berlaku', () => {
    const allYears = buildStudentFilter(
      { tahunAjaran: '2025/2026', statusKeaktifan: 'Aktif' },
      { scope: FILTER_SCOPES.ALL_YEARS },
    );
    expect(allYears.AND).toBeUndefined();
    expect(allYears.statusKeaktifan).toBe('Aktif');
  });

  it('search yang menyebut nama field filter tidak mengubah set kondisi', () => {
    // Regresi: dulu kondisi dibuang dengan mencocokkan hasil JSON.stringify,
    // jadi kata "periodeMasuk"/"periodeTerakhir" di dalam `search` ikut
    // mengubah populasi. Sekarang scope memilih kondisi sejak awal.
    for (const term of ['periodeMasuk', 'periodeTerakhir', 'statusKeaktifan']) {
      const withTerm = buildStudentFilter({ tahunAjaran: '2025/2026', search: term });
      const without = buildStudentFilter({ tahunAjaran: '2025/2026' });
      // `search` hanya menambah satu kondisi OR paling akhir; tidak ada
      // kondisi snapshot yang hilang karena namanya ikut disebut.
      expect(withTerm.AND).toHaveLength(without.AND.length + 1);
      expect(withTerm.AND.slice(0, without.AND.length)).toEqual(without.AND);
    }

    const searchOnly = buildStudentFilter({ search: 'periodeTerakhir' });
    expect(searchOnly.statusKeaktifan).toBe('Aktif');
    expect(searchOnly.AND).toEqual([
      {
        OR: [{ nim: { contains: 'periodeTerakhir' } }, { nama: { contains: 'periodeTerakhir' } }],
      },
    ]);
  });

  it('satu aturan periode akademik: proyeksi tabel mirror kondisi SQL terminal', () => {
    const academicYear = { startYear: '2024' };
    const { start, end } = getAcademicPeriodBounds(academicYear);
    const terminalCondition = buildTerminalPeriodCondition(start, end);

    const rows = [
      { periodeMasuk: '20241', periodeTerakhir: '' },
      { periodeMasuk: '20241', periodeTerakhir: '20232' },
      { periodeMasuk: '20241', periodeTerakhir: '20241' },
      { periodeMasuk: '20241', periodeTerakhir: '20242' },
      { periodeMasuk: '20242', periodeTerakhir: '20242' },
      { periodeMasuk: '20241', periodeTerakhir: '20251' },
      // Periode masuk cacat (4 digit): kondisi SQL tidak menganggapnya Ganjil,
      // jadi proyeksi status juga tidak boleh.
      { periodeMasuk: '2024', periodeTerakhir: '20242' },
    ];

    rows.forEach((row) => {
      expect(isTerminalInAcademicYear(row, academicYear)).toBe(
        matchesStudentCondition(row, terminalCondition),
      );
    });
    expect(isTerminalInAcademicYear(rows[rows.length - 1], academicYear)).toBe(false);
  });

  it('matchesStudentCondition menolak operator yang belum dikenali, bukan menebak', () => {
    expect(() => matchesStudentCondition({ nim: '1' }, { nim: { someop: '1' } })).toThrow(
      /belum didukung/,
    );
  });
});
