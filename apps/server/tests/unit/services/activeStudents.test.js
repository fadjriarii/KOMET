import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { groupStudentRows } = require('../../../src/services/students/activeStudents');
const { projectSnapshotStudent } = require('../../../src/services/students/studentSnapshot');
const { getAcademicYear } = require('../../../src/services/students/filterBuilder');

const base = {
  angkatan: '2021/2022',
  periodeMasuk: '20211',
  periodeMasukAwal: '20211',
  programStudi: 'Biomedis',
  fakultas: 'SHLS',
  jenjang: 'S1',
  semester: 7,
  kewarganegaraan: 'Indonesia',
  idNegara: 'IDN',
};

describe('groupStudentRows', () => {
  it('memecah tiap dimensi per status dan totalnya sama dengan jumlah baris', () => {
    const rows = [
      { ...base, statusKeaktifan: 'Aktif' },
      { ...base, statusKeaktifan: 'Aktif', programStudi: 'Farmasi' },
      { ...base, statusKeaktifan: 'Lulus', angkatan: '2019/2020' },
      { ...base, statusKeaktifan: 'Keluar', idNegara: 'MYS', kewarganegaraan: 'Malaysia' },
    ];
    const result = groupStudentRows(rows);

    expect(result.totalActiveStudents).toBe(4);
    expect(result.statuses).toEqual(['Aktif', 'Keluar', 'Lulus']);
    expect(result.byStatus.map(({ name, count }) => [name, count])).toEqual([
      ['Aktif', 2],
      ['Keluar', 1],
      ['Lulus', 1],
    ]);
    expect(result.byProdi[0]).toMatchObject({
      name: 'Biomedis',
      count: 3,
      byStatus: { Aktif: 1, Lulus: 1, Keluar: 1 },
    });
    expect(result.byJenjang[0].name).toBe('Sarjana (S1)');
    expect(result.byAngkatan.map((item) => item.name)).toEqual(['2021/2022', '2019/2020']);
    expect(result.byNationality.map(({ name, count }) => [name, count])).toEqual([
      ['WNI', 3],
      ['WNA', 1],
    ]);
    for (const key of ['byStatus', 'byFaculty', 'byProdi', 'byJenjang', 'byAngkatan']) {
      expect(
        result[key].reduce((sum, item) => sum + item.count, 0),
        key,
      ).toBe(4);
    }
  });

  it('Per Angkatan hanya 5 tahun ajaran mundur dari tahun terpilih', () => {
    const years = ['2016/2017', '2017/2018', '2018/2019', '2019/2020', '2020/2021', '2021/2022'];
    const rows = years.map((angkatan) => ({ ...base, angkatan, statusKeaktifan: 'Lulus' }));
    const result = groupStudentRows(rows, '2021/2022');
    expect(result.byAngkatan.map((item) => item.name)).toEqual(years.slice(1).reverse());
    // Total dan dimensi lain tetap menghitung semua angkatan.
    expect(result.totalActiveStudents).toBe(6);
    expect(result.byProdi[0].count).toBe(6);
    expect(groupStudentRows(rows).byAngkatan).toHaveLength(6);
  });

  it('memakai status proyeksi snapshot: lulus di tahun depan masih Aktif', () => {
    const graduatedLater = { ...base, statusKeaktifan: 'Lulus', periodeTerakhir: '20252' };
    const year = getAcademicYear('2023/2024');
    const result = groupStudentRows([projectSnapshotStudent(graduatedLater, year, 'ALL')]);
    expect(result.byStatus.map((item) => item.name)).toEqual(['Aktif']);
    expect(result.bySemester.map((item) => item.name)).toEqual(['Semester 6']);
  });
});
