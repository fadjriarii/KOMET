import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { studySemesters } = require('../../../src/utils/academicUtils');

describe('studySemesters', () => {
  it('menghitung semester inklusif dari periode masuk ke periode lulus', () => {
    expect(studySemesters({ periodeMasuk: '20201' }, { periodeWisuda: '20232' })).toBe(8);
    expect(studySemesters({ periodeMasuk: '20201' }, { periodeWisuda: '20241' })).toBe(9);
    expect(studySemesters({ periodeMasuk: '20202' }, { periodeWisuda: '20202' })).toBe(1);
  });

  it('memakai periode masuk awal rantai transfer bila ada', () => {
    const student = { periodeMasukAwal: '20191', periodeMasuk: '20211' };
    expect(studySemesters(student, { periodeWisuda: '20232' })).toBe(10);
  });

  it('tanpa periode lulus, tahun lulus dianggap Genap; tanpa periode masuk, angkatan = Ganjil', () => {
    expect(studySemesters({ periodeMasuk: '20201' }, { tahunLulus: '2023/2024' })).toBe(8);
    expect(studySemesters({ angkatan: '2020/2021' }, { periodeWisuda: '20232' })).toBe(8);
  });

  it('data tidak lengkap atau terbalik = null, bukan durasi palsu', () => {
    expect(studySemesters({}, { periodeWisuda: '20232' })).toBeNull();
    expect(studySemesters({ periodeMasuk: '20201' }, {})).toBeNull();
    expect(studySemesters({ periodeMasuk: '20241' }, { periodeWisuda: '20232' })).toBeNull();
  });
});
