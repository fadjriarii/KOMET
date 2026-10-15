import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { buildAwalMap } = require('../../../src/controllers/sync/transferSemester');

const row = (overrides) => ({
  nim: 'x',
  jenjang: 'S1',
  periodeMasuk: '',
  periodeTerakhir: '',
  statusKeaktifan: 'Aktif',
  semester: 1,
  nik: '',
  nama: 'Orang Sama',
  tanggalLahir: '2003-07-31',
  ...overrides,
});

describe('rantai semester transfer', () => {
  it('menyambung transfer bersambung ke awal masuk (kasus Russell Christian)', () => {
    const rows = [
      row({
        nim: '21010163',
        periodeMasuk: '20211',
        periodeTerakhir: '20212',
        statusKeaktifan: 'Transfer',
      }),
      row({
        nim: '22010190',
        periodeMasuk: '20221',
        periodeTerakhir: '20242',
        statusKeaktifan: 'Lulus',
      }),
    ];
    expect(buildAwalMap(rows).get('22010190')).toBe('20211');
    expect(buildAwalMap(rows).has('21010163')).toBe(false);
  });

  it('tidak menyambung dua enrollment paralel yang tumpang-tindih', () => {
    const rows = [
      row({
        nim: '23010146',
        periodeMasuk: '20231',
        periodeTerakhir: '',
        statusKeaktifan: 'Aktif',
      }),
      row({
        nim: '26010120',
        periodeMasuk: '20261',
        periodeTerakhir: '',
        statusKeaktifan: 'Aktif',
      }),
    ];
    expect(buildAwalMap(rows).size).toBe(0);
  });

  it('tidak menyambung bila ada jeda bertahun-tahun', () => {
    const rows = [
      row({
        nim: 'a',
        periodeMasuk: '20201',
        periodeTerakhir: '20202',
        statusKeaktifan: 'Transfer',
      }),
      row({ nim: 'b', periodeMasuk: '20251', periodeTerakhir: '', statusKeaktifan: 'Aktif' }),
    ];
    expect(buildAwalMap(rows).size).toBe(0);
  });

  it('tidak menyambung beda jenjang (S1 ke S2 studi baru)', () => {
    const rows = [
      row({
        nim: 's1',
        periodeMasuk: '20211',
        periodeTerakhir: '20212',
        statusKeaktifan: 'Transfer',
      }),
      row({
        nim: 's2',
        jenjang: 'S2',
        periodeMasuk: '20221',
        periodeTerakhir: '',
        statusKeaktifan: 'Aktif',
      }),
    ];
    expect(buildAwalMap(rows).size).toBe(0);
  });

  it('tidak menyambung bila pendahulu bukan pindahan (DO misalnya)', () => {
    const rows = [
      row({
        nim: 'a',
        periodeMasuk: '20211',
        periodeTerakhir: '20212',
        statusKeaktifan: 'Drop Out / Dikeluarkan',
      }),
      row({ nim: 'b', periodeMasuk: '20221', periodeTerakhir: '', statusKeaktifan: 'Aktif' }),
    ];
    expect(buildAwalMap(rows).size).toBe(0);
  });

  it('merangkai rantai multi-hop ke awal pertama', () => {
    const rows = [
      row({
        nim: 'a',
        periodeMasuk: '20201',
        periodeTerakhir: '20202',
        statusKeaktifan: 'Transfer',
      }),
      row({ nim: 'b', periodeMasuk: '20211', periodeTerakhir: '20212', statusKeaktifan: 'Mutasi' }),
      row({ nim: 'c', periodeMasuk: '20221', periodeTerakhir: '', statusKeaktifan: 'Aktif' }),
    ];
    const awal = buildAwalMap(rows);
    expect(awal.get('b')).toBe('20201');
    expect(awal.get('c')).toBe('20201');
  });
});
