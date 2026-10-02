import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { buildStudentFilter, buildBaseFilter, buildStatelessFilter } = require('../../../src/services/students/filterBuilder');

describe('student filter builder', () => {
  // ── Filter dasar (tanpa Tahun Ajaran) ───────────────────────────────────────

  it('defaults to statusKeaktifan Aktif when no params given', () => {
    const filter = buildStudentFilter({});
    expect(filter.statusKeaktifan).toBe('Aktif');
    expect(filter.AND).toBeUndefined();
  });

  it('keeps angkatan year filtering as OR startsWith conditions', () => {
    const filter = buildStudentFilter({ angkatanTahun: ['2025', '2024'], statusKeaktifan: 'Aktif' });
    expect(filter.AND).toEqual([{ OR: [
      { angkatan: { startsWith: '2025' } },
      { angkatan: { startsWith: '2024' } },
    ] }]);
    expect(filter.statusKeaktifan).toBe('Aktif');
  });

  it('applies multi-select filters and defaults status to Aktif', () => {
    const filter = buildBaseFilter({ jenjang: 'S1', semester: '1', periodeMasuk: 'Ganjil' });
    expect(filter.jenjang).toEqual({ in: ['S1'] });
    expect(filter.semester).toEqual({ in: [1] });
    expect(filter.periodeMasuk).toEqual({ endsWith: '1' });
    expect(filter.statusKeaktifan).toBe('Aktif');
  });

  it('removes status predicate when UI requests Semua Status (ALL)', () => {
    const filter = buildBaseFilter({ statusKeaktifan: '__ALL__' });
    expect(filter.statusKeaktifan).toBeUndefined();
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
    const filter = buildStudentFilter({ tahunAjaran: '2026/2027', statusKeaktifan: '__ALL__' });

    // Hanya kondisi periodeMasuk <= akhir TA — tidak ada batasan periodeTerakhir
    expect(filter.AND).toContainEqual({ periodeMasuk: { lte: '20262' } });
    const hasPeriodeTerakhirBound = filter.AND?.some((c) =>
      c?.OR?.some((o) => o?.periodeTerakhir !== undefined)
    );
    expect(hasPeriodeTerakhirBound).toBeFalsy();

    expect(filter.statusKeaktifan).toBeUndefined();
  });

  it('TA + Semua Status array kosong []: sama seperti __ALL__', () => {
    const filter = buildStudentFilter({ tahunAjaran: '2025/2026', statusKeaktifan: [] });
    expect(filter.AND).toContainEqual({ periodeMasuk: { lte: '20252' } });
    expect(filter.statusKeaktifan).toBeUndefined();
  });

  // ── Tahun Ajaran + Status spesifik (Lulus / Transfer / dll.) ───────────────

  it('TA + Lulus: hanya kelulusan sebelum awal TA yang dipilih', () => {
    const filter = buildStudentFilter({ tahunAjaran: '2026/2027', statusKeaktifan: 'Lulus' });
    expect(filter.AND).toContainEqual({ periodeMasuk: { lte: '20262' } });
    expect(filter.AND).toContainEqual({
      OR: [{
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
      }],
    });
    expect(filter.statusKeaktifan).toBeUndefined();
  });

  it('TA + Transfer: keluar pada TA berjalan tetap Aktif sampai TA berikutnya', () => {
    const filter = buildStudentFilter({ tahunAjaran: '2025/2026', statusKeaktifan: 'Transfer' });
    expect(filter.AND).toContainEqual({ periodeMasuk: { lte: '20252' } });
    expect(filter.AND).toContainEqual({
      OR: [{
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
      }],
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
      OR: [{
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
      }],
    });

    expect(filter.statusKeaktifan).toBeUndefined();
  });

  it('does not return a student who left during the selected academic year as terminal', () => {
    const filter = buildStudentFilter({
      tahunAjaran: '2014/2015',
      statusKeaktifan: 'Keluar',
    });

    expect(filter.AND).toContainEqual({
      OR: [{
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
      }],
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

  it('intake stateless filter keeps the selected TA boundary but removes snapshot status', () => {
    const snapshot = buildBaseFilter({ tahunAjaran: '2025/2026', statusKeaktifan: 'Aktif' });
    const stateless = buildStatelessFilter(snapshot);
    expect(stateless.AND).toContainEqual({ periodeMasuk: { lte: '20252' } });
    expect(JSON.stringify(stateless)).not.toContain('periodeTerakhir');
  });
});
