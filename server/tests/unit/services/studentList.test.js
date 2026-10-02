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

  it('renders a completed historical status after its final period has occurred', () => {
    const student = { statusKeaktifan: 'Lulus', periodeTerakhir: '20252' };
    expect(getSnapshotStatus(student, { startYear: '2025' })).toBe('Lulus');
  });
});
