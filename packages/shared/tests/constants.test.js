import { describe, expect, it } from 'vitest';
import {
  ACADEMIC_YEAR_ROLLOVER_MONTH,
  HTTP_STATUS,
  MAX_PAGE_SIZE,
  STUDENT_STATUS,
  TABLE_LIMIT,
  TARGET_IKU2_PERCENT,
} from '../src/constants.js';

describe('konstanta bersama', () => {
  it('nilai status mahasiswa unik — inilah string yang disimpan di kolom DB', () => {
    const values = Object.values(STUDENT_STATUS);
    expect(new Set(values).size).toBe(values.length);
    expect(values.every((value) => typeof value === 'string' && value.length > 0)).toBe(true);
  });

  it('batas paginasi konsisten: bawaan di bawah plafon server', () => {
    expect(TABLE_LIMIT).toBeGreaterThan(0);
    expect(MAX_PAGE_SIZE).toBeGreaterThanOrEqual(TABLE_LIMIT);
  });

  it('kode HTTP cocok dengan standar yang dipakai client untuk bercabang', () => {
    expect(HTTP_STATUS).toMatchObject({
      OK: 200,
      BAD_REQUEST: 400,
      UNAUTHORIZED: 401,
      FORBIDDEN: 403,
      NOT_FOUND: 404,
      TOO_MANY_REQUESTS: 429,
      INTERNAL_SERVER_ERROR: 500,
    });
  });

  it('bulan rollover tahun akademik berada dalam rentang 1..12', () => {
    expect(ACADEMIC_YEAR_ROLLOVER_MONTH).toBeGreaterThanOrEqual(1);
    expect(ACADEMIC_YEAR_ROLLOVER_MONTH).toBeLessThanOrEqual(12);
  });

  it('target IKU-2 adalah angka, bukan label', () => {
    expect(typeof TARGET_IKU2_PERCENT).toBe('number');
    expect(Number.isFinite(TARGET_IKU2_PERCENT)).toBe(true);
  });
});
