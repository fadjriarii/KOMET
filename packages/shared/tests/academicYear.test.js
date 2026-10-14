import { describe, expect, it } from 'vitest';
import {
  getAcademicYearWindow,
  getBoundedAcademicYearWindow,
  MIN_ACADEMIC_YEAR_START,
  getCurrentAcademicYear,
  isValidAcademicYear,
  getCurrentAcademicYearStart,
  getRollingAcademicYears,
  parseAcademicYear,
} from '../src/academicYear.js';

const AUGUST_31 = new Date('2026-08-31T10:00:00');
const SEPTEMBER_1 = new Date('2026-09-01T10:00:00');

describe('rollover tahun akademik', () => {
  it('berflip tepat pada bulan rollover, bukan sebelumnya', () => {
    expect(getCurrentAcademicYearStart(AUGUST_31)).toBe(2025);
    expect(getCurrentAcademicYearStart(SEPTEMBER_1)).toBe(2026);
  });

  it('label berjalan mengikuti tahun awal', () => {
    expect(getCurrentAcademicYear(AUGUST_31)).toBe('2025/2026');
    expect(getCurrentAcademicYear(SEPTEMBER_1)).toBe('2026/2027');
  });
});

describe('jendela tahun akademik', () => {
  it('naik, sepanjang `size`, dan berakhir di `startYear`', () => {
    expect(getAcademicYearWindow(2025, 3)).toEqual(['2023/2024', '2024/2025', '2025/2026']);
    expect(getAcademicYearWindow(2025)).toHaveLength(5);
  });

  it('rolling tahun untuk pilihan UI urut menurun dari yang berjalan', () => {
    expect(getRollingAcademicYears(3, SEPTEMBER_1)).toEqual([
      '2026/2027',
      '2025/2026',
      '2024/2025',
    ]);
  });
});

describe('jendela tahun terbatas tahun berdiri kampus', () => {
  it('jangkar baru tidak terpotong', () => {
    expect(getBoundedAcademicYearWindow(2025)).toEqual(getAcademicYearWindow(2025));
  });

  it('filter 2016/2017 hanya menampilkan 3 titik sejak 2014/2015', () => {
    expect(MIN_ACADEMIC_YEAR_START).toBe(2014);
    expect(getBoundedAcademicYearWindow(2016)).toEqual(['2014/2015', '2015/2016', '2016/2017']);
  });

  it('filter tahun berdiri hanya menampilkan 1 titik', () => {
    expect(getBoundedAcademicYearWindow(2014)).toEqual(['2014/2015']);
  });
});

describe('parseAcademicYear', () => {
  it('hanya menerima bentuk YYYY/YYYY', () => {
    expect(parseAcademicYear('2024/2025')).toBe(2024);
    expect(parseAcademicYear('2024')).toBeNull();
    expect(parseAcademicYear('2024/25')).toBeNull();
    expect(parseAcademicYear(null)).toBeNull();
  });
});

describe('isValidAcademicYear', () => {
  it('kosong = tidak diisi, jadi valid', () => {
    expect(isValidAcademicYear(undefined)).toBe(true);
    expect(isValidAcademicYear('')).toBe(true);
  });

  it('menolak bentuk salah dan tahun yang tidak berurutan', () => {
    expect(isValidAcademicYear('2024/2025')).toBe(true);
    expect(isValidAcademicYear('2024/2026')).toBe(false);
    expect(isValidAcademicYear('2024')).toBe(false);
    expect(isValidAcademicYear('abcdef')).toBe(false);
  });
});
