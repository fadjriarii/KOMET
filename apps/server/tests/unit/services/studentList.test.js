import { afterAll, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const prisma = require('../../../src/config/prisma');
const {
  buildStudentListQuery,
  getSnapshotStatus,
  getStudentList,
  projectSnapshotStudent,
} = require('../../../src/services/students/studentList');

describe('student list pagination query', () => {
  it('uses offset pagination without a cursor', () => {
    const query = buildStudentListQuery({ statusKeaktifan: 'Aktif' }, 3, 10);
    expect(query.skip).toBe(20);
    expect(query.take).toBe(11);
    expect(query.cursor).toBeUndefined();
    // Tabel terbaru dulu: angkatan tertinggi, lalu `nim` sebagai pemecah ties.
    expect(query.orderBy).toEqual([
      { angkatan: 'desc' },
      { periodeMasuk: 'desc' },
      { nim: 'desc' },
    ]);
  });

  it('uses cursor pagination and stable primary-key ordering', () => {
    const query = buildStudentListQuery({ statusKeaktifan: 'Aktif' }, 1, 50, '2024001');
    expect(query.cursor).toEqual({ nim: '2024001' });
    expect(query.skip).toBe(1);
    expect(query.take).toBe(51);
    expect(query.orderBy).toEqual({ nim: 'asc' });
  });

  it('mengunci proyeksi kolom: data diri sensitif tidak pernah ikut terbawa', () => {
    const { select } = buildStudentListQuery({}, 1, 10);
    expect(Object.keys(select).sort()).toEqual(
      [
        'nim',
        'nama',
        'angkatan',
        'periode',
        'periodeMasuk',
        'periodeTerakhir',
        'programStudi',
        'fakultas',
        'jenjang',
        'semester',
        'kewarganegaraan',
        'statusKeaktifan',
      ].sort(),
    );
    expect(select).not.toHaveProperty('nik');
    expect(select).not.toHaveProperty('tanggalLahir');
  });

  it('renders a future graduate as Aktif in an earlier academic-year snapshot', () => {
    const student = { statusKeaktifan: 'Lulus', periodeTerakhir: '20261' };
    const academicYear = { startYear: '2025' };
    expect(getSnapshotStatus(student, academicYear)).toBe('Aktif');
    // Satu field status saja: nilai snapshot, bukan nilai hidup saat ini.
    expect(projectSnapshotStudent(student, academicYear)).toEqual({
      statusKeaktifan: 'Aktif',
      periodeTerakhir: '20261',
    });
  });

  it('marks a student terminal in the same year after an odd number of semesters', () => {
    const student = {
      statusKeaktifan: 'Keluar',
      periodeMasuk: '20141',
      periodeTerakhir: '20142',
    };
    expect(getSnapshotStatus(student, { startYear: '2014' })).toBe('Keluar');
    expect(getSnapshotStatus(student, { startYear: '2015' })).toBe('Keluar');
  });

  it('periode masuk cacat (4 digit) tidak dianggap Ganjil, sama seperti kondisi SQL', () => {
    const student = {
      statusKeaktifan: 'Keluar',
      periodeMasuk: '2014',
      periodeTerakhir: '20142',
    };
    // Baris ini tidak lolos cabang terminal maupun cabang aktif pada snapshot
    // 2014/2015, jadi proyeksi status mengikuti SQL: belum terminal.
    expect(getSnapshotStatus(student, { startYear: '2014' })).toBe('Aktif');
  });

  it('defers terminal status to the following academic year after an even number of semesters', () => {
    const student = {
      statusKeaktifan: 'Keluar',
      periodeMasuk: '20241',
      periodeTerakhir: '20251',
    };
    expect(getSnapshotStatus(student, { startYear: '2024' })).toBe('Aktif');
    expect(getSnapshotStatus(student, { startYear: '2025' })).toBe('Keluar');
    expect(getSnapshotStatus(student, { startYear: '2026' })).toBe('Keluar');
  });

  it('preserves terminal status when a terminal status filter is selected', () => {
    const student = { statusKeaktifan: 'Keluar', periodeTerakhir: '20152' };
    expect(getSnapshotStatus(student, { startYear: '2015' }, 'Keluar')).toBe('Keluar');
  });

  it('renders a completed historical status after its final period has occurred', () => {
    const student = { statusKeaktifan: 'Lulus', periodeTerakhir: '20252' };
    expect(getSnapshotStatus(student, { startYear: '2026' })).toBe('Lulus');
  });
});

describe('student list cursor pagination', () => {
  const original = {
    findUnique: prisma.student.findUnique,
    findMany: prisma.student.findMany,
    count: prisma.student.count,
  };

  afterAll(() => Object.assign(prisma.student, original));

  it('tidak menjalankan COUNT penuh pada jalur cursor', async () => {
    prisma.student.findUnique = vi.fn(async () => ({ nim: '2024001' }));
    prisma.student.findMany = vi.fn(async () => [{ nim: '2024002' }, { nim: '2024003' }]);
    prisma.student.count = vi.fn(async () => {
      throw new Error('COUNT tidak boleh dijalankan pada jalur cursor.');
    });

    const result = await getStudentList({ statusKeaktifan: 'Aktif' }, 1, 1, '2024001');

    expect(prisma.student.count).not.toHaveBeenCalled();
    expect(result.data).toEqual([{ nim: '2024002' }]);
    expect(result).toMatchObject({
      nextCursor: '2024002',
      hasNextPage: true,
      pagination: { page: null, limit: 1, total: null, totalPages: null },
    });
  });
});
