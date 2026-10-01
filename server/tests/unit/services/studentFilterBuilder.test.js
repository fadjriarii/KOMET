import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { buildStudentFilter, buildBaseFilter } = require('../../../src/services/students/filterBuilder');

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

  it('TA historis + status Aktif (default): cukup pakai periodeTerakhir agar terdeteksi masih terdaftar', () => {
    const filter = buildStudentFilter({ tahunAjaran: '2023/2024' });
    // periodeMasuk <= akhir TA
    expect(filter.AND).toContainEqual({ periodeMasuk: { lte: '20232' } });
    // Tambahan: masih terdaftar di TA historis itu (periodeTerakhir kosong atau >= awal TA)
    expect(filter.AND).toContainEqual({
      OR: [
        { periodeTerakhir: '' },
        { periodeTerakhir: { gte: '20231' } },
      ],
    });
    // Status Aktif tetap di-set untuk memfilter hanya mahasiswa aktif
    expect(filter.statusKeaktifan).toBe('Aktif');
  });

  it('TA historis + statusKeaktifan Aktif eksplisit: sama persis dengan default', () => {
    const filter = buildStudentFilter({ tahunAjaran: '2020/2021', statusKeaktifan: 'Aktif' });
    expect(filter.AND).toContainEqual({ periodeMasuk: { lte: '20202' } });
    expect(filter.AND).toContainEqual({
      OR: [
        { periodeTerakhir: '' },
        { periodeTerakhir: { gte: '20201' } },
      ],
    });
    expect(filter.statusKeaktifan).toBe('Aktif');
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

  it('TA + Lulus: semua mahasiswa Lulus yang masuk s.d. akhir TA, tanpa filter periodeTerakhir', () => {
    const filter = buildStudentFilter({ tahunAjaran: '2026/2027', statusKeaktifan: 'Lulus' });

    // periodeMasuk <= akhir TA
    expect(filter.AND).toContainEqual({ periodeMasuk: { lte: '20262' } });
    // Tidak ada batas periodeTerakhir — cukup filter status
    const hasPeriodeTerakhirBound = filter.AND?.some((c) =>
      c?.OR?.some((o) => o?.periodeTerakhir !== undefined)
    );
    expect(hasPeriodeTerakhirBound).toBeFalsy();

    expect(filter.statusKeaktifan).toBe('Lulus');
  });

  it('TA + Transfer: semua mahasiswa Transfer yang masuk s.d. akhir TA', () => {
    const filter = buildStudentFilter({ tahunAjaran: '2025/2026', statusKeaktifan: 'Transfer' });

    expect(filter.AND).toContainEqual({ periodeMasuk: { lte: '20252' } });
    const hasPeriodeTerakhirBound = filter.AND?.some((c) =>
      c?.OR?.some((o) => o?.periodeTerakhir !== undefined)
    );
    expect(hasPeriodeTerakhirBound).toBeFalsy();

    expect(filter.statusKeaktifan).toBe('Transfer');
  });

  it('TA + multi-status [Lulus, Drop Out]: pakai { in: [...] }', () => {
    const filter = buildStudentFilter({
      tahunAjaran: '2024/2025',
      statusKeaktifan: ['Lulus', 'Drop Out'],
    });
    expect(filter.AND).toContainEqual({ periodeMasuk: { lte: '20242' } });
    expect(filter.statusKeaktifan).toEqual({ in: ['Lulus', 'Drop Out'] });
  });

  // ── Kombinasi Tahun Ajaran + Periode Masuk (Ganjil/Genap) ──────────────────

  it('TA + Aktif + Periode Masuk Ganjil: tambah filter endsWith:1 dalam AND', () => {
    const filter = buildStudentFilter({
      tahunAjaran: '2024/2025',
      periodeMasuk: 'Ganjil',
    });
    expect(filter.AND).toContainEqual({ periodeMasuk: { endsWith: '1' } });
    expect(filter.statusKeaktifan).toBe('Aktif');
  });
});
