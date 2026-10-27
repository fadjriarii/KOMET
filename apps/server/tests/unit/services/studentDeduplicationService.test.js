import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  isSamePerson,
  isLegacyGraduatedTwin,
  survivorFirst,
} = require('../../../src/services/studentDeduplicationService');

describe('student deduplication identity matching', () => {
  it('matches students with the same valid NIK', () => {
    expect(
      isSamePerson(
        { nama: 'Budi', nik: '3201010101010101', tanggalLahir: '' },
        { nama: 'Budi Santoso', nik: '3201010101010101', tanggalLahir: '2000-01-01' },
      ),
    ).toBe(true);
  });

  it('matches students with the same normalized name and birth date', () => {
    expect(
      isSamePerson(
        { nama: 'Vincent', nik: '', tanggalLahir: '2000-01-01' },
        // Spasi ganda dan &amp; tidak boleh menggagalkan pasangan.
        { nama: '  Vincent  ', nik: '', tanggalLahir: '2000-01-01' },
      ),
    ).toBe(true);
  });

  it('does not match on birth date alone without the same name', () => {
    expect(
      isSamePerson(
        { nama: 'Andi', nik: '', tanggalLahir: '2000-01-01' },
        { nama: 'Budi', nik: '', tanggalLahir: '2000-01-01' },
      ),
    ).toBe(false);
  });

  it('does not match without a shared identity value', () => {
    expect(
      isSamePerson(
        { nama: 'A', nik: '', tanggalLahir: '' },
        { nama: 'A', nik: '', tanggalLahir: '' },
      ),
    ).toBe(false);
    expect(
      isSamePerson(
        { nama: 'A', nik: '123', tanggalLahir: '2000-01-01' },
        { nama: 'A', nik: '456', tanggalLahir: '2000-02-02' },
      ),
    ).toBe(false);
  });

  it('ignores placeholder NIK (bukan 16 digit / digit seragam)', () => {
    expect(
      isSamePerson(
        { nama: 'Sama', nik: '0000000000000000', tanggalLahir: '2000-01-01' },
        { nama: 'Sama', nik: '1111111111111111', tanggalLahir: '2000-01-01' },
      ),
    ).toBe(true); // NIK placeholder diabaikan, nama + lahir yang memutuskan
    expect(
      isSamePerson(
        { nama: 'Beda', nik: '0000000000000000', tanggalLahir: '2000-01-01' },
        { nama: 'Lain', nik: '0000000000000000', tanggalLahir: '2000-01-01' },
      ),
    ).toBe(false);
  });
});

describe('legacy twin yang sudah lulus', () => {
  const legacy = {
    nim: '23020008',
    nama: 'Jasmine Angelica Syahirah Simanjuntak',
    jenjang: 'S2',
    programStudi: 'Magister Bio Manajemen',
    kodeProgramStudi: 'XX61101',
    statusKeaktifan: 'Aktif',
    periodeTerakhir: '20252',
    isAkunLama: true,
  };
  const twin = {
    nim: '24020003',
    nama: '  Jasmine  Angelica Syahirah Simanjuntak ',
    jenjang: 's2',
    programStudi: 'Magister Bio Manajemen',
    kodeProgramStudi: '61101',
    statusKeaktifan: 'Lulus',
    periodeTerakhir: '20252',
    isAkunLama: false,
  };
  const graduate = { nim: '24020003', periodeWisuda: '20252' };

  it('mencocokkan NIM lama aktif dengan NIM baru yang lulus pada periode yang sama', () => {
    expect(isLegacyGraduatedTwin(legacy, twin, graduate)).toBe(true);
  });

  it('menolak nama, jenjang, prodi, atau periode wisuda yang berbeda', () => {
    expect(isLegacyGraduatedTwin(legacy, { ...twin, nama: 'Orang Lain' }, graduate)).toBe(false);
    expect(isLegacyGraduatedTwin(legacy, { ...twin, jenjang: 'S1' }, graduate)).toBe(false);
    expect(isLegacyGraduatedTwin(legacy, { ...twin, kodeProgramStudi: '61201' }, graduate)).toBe(
      false,
    );
    expect(isLegacyGraduatedTwin(legacy, twin, { ...graduate, periodeWisuda: '20251' })).toBe(
      false,
    );
  });

  it('hanya berlaku untuk NIM lama yang masih aktif dan bukan sesama akun lama', () => {
    expect(isLegacyGraduatedTwin({ ...legacy, statusKeaktifan: 'Lulus' }, twin, graduate)).toBe(
      false,
    );
    expect(isLegacyGraduatedTwin(legacy, { ...twin, isAkunLama: true }, graduate)).toBe(false);
    expect(isLegacyGraduatedTwin(legacy, twin, null)).toBe(false);
  });
});

describe('survivor ordering (aturan A)', () => {
  const row = (nim, isAkunLama) => ({ nim, isAkunLama, updatedAt: new Date().toISOString() });

  it('data baru tanpa-x menang atas shell ber-x walaupun berlabel akun-lama', () => {
    // Kasus riil 16010010: Lulus "Farmasi (Akun Lama)" vs shell "16010010X" Transfer.
    const ordered = [row('16010010X', false), row('16010010', true)].sort(survivorFirst);
    expect(ordered[0].nim).toBe('16010010');
  });

  it('tanpa-x yang sama-sama bersih mendahulukan bukan akun-lama', () => {
    const ordered = [row('23020019', true), row('23020018', false)].sort(survivorFirst);
    expect(ordered[0].nim).toBe('23020018');
  });
});
