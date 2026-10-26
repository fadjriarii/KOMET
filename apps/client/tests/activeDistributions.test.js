import { describe, expect, it } from 'vitest';
import {
  activeDistributions,
  statusSeries,
} from '../src/modules/students/components/modals/activeDistributions';

const item = (name, count, byStatus = { Aktif: count }) => ({ name, count, byStatus });
const keys = (detail) => activeDistributions(detail).map((tab) => tab.key);

const detail = (overrides) => ({
  totalActiveStudents: 10,
  statuses: ['Aktif'],
  byStatus: [item('Aktif', 10)],
  byFaculty: [item('SHLS', 6), item('SBE', 4)],
  byProdi: [item('Biomedis', 6), item('Bisnis', 4)],
  byJenjang: [item('Sarjana (S1)', 10)],
  byAngkatan: [item('2024/2025', 7), item('2023/2024', 3)],
  bySemester: [item('Semester 1', 7), item('Semester 3', 3)],
  byNationality: [item('WNI', 10)],
  ...overrides,
});

describe('activeDistributions', () => {
  it('menyembunyikan pengelompokan yang hanya berisi satu kategori', () => {
    expect(keys(detail())).toEqual(['fakultas', 'prodi', 'angkatan', 'semester']);
  });

  it('1 prodi + semua status: Per Status jadi tab pertama, fakultas/prodi hilang', () => {
    const allStatus = detail({
      statuses: ['Aktif', 'Lulus'],
      byStatus: [item('Aktif', 7), item('Lulus', 3, { Lulus: 3 })],
      byFaculty: [item('SHLS', 10)],
      byProdi: [item('Biomedis', 10)],
    });
    expect(keys(allStatus)).toEqual(['status', 'angkatan', 'semester']);
  });

  it('tanpa data (memuat, gagal, atau nol) tetap menampilkan tab dasar', () => {
    expect(keys(null)).toEqual(['fakultas', 'prodi', 'jenjang']);
    expect(keys(detail({ totalActiveStudents: 0 }))).toEqual(['fakultas', 'prodi', 'jenjang']);
  });

  it('satu mahasiswa: tidak ada tab yang layak', () => {
    const one = item('x', 1);
    const single = Object.fromEntries(
      [
        'byStatus',
        'byFaculty',
        'byProdi',
        'byJenjang',
        'byAngkatan',
        'bySemester',
        'byNationality',
      ].map((key) => [key, [one]]),
    );
    expect(keys({ totalActiveStudents: 1, statuses: ['Aktif'], ...single })).toEqual([]);
  });
});

describe('statusSeries', () => {
  it('memberi warna tetap per nama status, tidak tergantung urutan', () => {
    const series = statusSeries(['Aktif', 'Lulus', 'Keluar', 'Drop Out / Dikeluarkan']);
    expect(series.map((s) => s.key)).toEqual([
      'Aktif',
      'Lulus',
      'Keluar',
      'Drop Out / Dikeluarkan',
    ]);
    expect(new Set(series.map((s) => s.color)).size).toBe(4);
    const reordered = statusSeries(['Keluar', 'Aktif']);
    expect(reordered[1].color).toBe(series[0].color);
  });
});
