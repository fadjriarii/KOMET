import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { buildStudentListQuery, getSnapshotStatus, projectSnapshotStudent } = require('../../../src/services/students/studentList');

describe('student list pagination query', () => {
  it('uses offset pagination without a cursor', () => {
    const query = buildStudentListQuery({ statusKeaktifan: 'Aktif' }, 3, 10);
    expect(query.skip).toBe(20);
    expect(query.take).toBe(11);
    expect(query.cursor).toBeUndefined();
  });

  it('uses cursor pagination and stable primary-key ordering', () => {
    const query = buildStudentListQuery({ statusKeaktifan: 'Aktif' }, 1, 50, '2024001');
    expect(query.cursor).toEqual({ nim: '2024001' });
    expect(query.skip).toBe(1);
    expect(query.take).toBe(51);
    expect(query.orderBy).toEqual({ nim: 'asc' });
  });

  it('renders a future graduate as Aktif in an earlier academic-year snapshot', () => {
    const student = { statusKeaktifan: 'Lulus', periodeTerakhir: '20261' };
    const academicYear = { startYear: '2025' };
    expect(getSnapshotStatus(student, academicYear)).toBe('Aktif');
    expect(projectSnapshotStudent(student, academicYear)).toMatchObject({
      statusKeaktifan: 'Aktif',
      currentStatusKeaktifan: 'Lulus',
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

  it('handles a legacy four-digit entry period consistently', () => {
    const student = {
      statusKeaktifan: 'Keluar',
      periodeMasuk: '2014',
      periodeTerakhir: '20142',
    };
    expect(getSnapshotStatus(student, { startYear: '2014' })).toBe('Keluar');
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
