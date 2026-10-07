import { describe, expect, it } from 'vitest';
import { createQuerySanitizer, sanitizeSearch, sanitizeText } from '../src/utils/querySanitizer';
import { matchKpiFilterScope } from '../src/utils/kpiScope';

const sanitizeQuery = createQuerySanitizer({
  single: ['nationality', 'tahunAjaran'],
  multi: ['faculty', 'status'],
});

const control = String.fromCharCode(0) + String.fromCharCode(7);
const DEL = String.fromCharCode(127);

describe('sanitizeText / sanitizeSearch', () => {
  it('membuang karakter kontrol dan DEL, bukan hanya men-trim', () => {
    expect(sanitizeText(`${control}Fakultas${DEL} Teknik`)).toBe('Fakultas Teknik');
    expect(sanitizeText('   spaces   ')).toBe('spaces');
  });

  it('membatasi panjang: 100 untuk search, 255 untuk nilai lain', () => {
    expect(sanitizeSearch('a'.repeat(300))).toHaveLength(100);
    expect(sanitizeText('a'.repeat(300))).toHaveLength(255);
  });

  it('mengembalikan string kosong untuk input non-string', () => {
    expect(sanitizeText(undefined)).toBe('');
    expect(sanitizeText({ nope: true })).toBe('');
    expect(sanitizeText(['S1'])).toBe('');
  });
});

describe('createQuerySanitizer', () => {
  it('menormalkan scalar menjadi array dan membatasi 50 item', () => {
    const { sanitized } = sanitizeQuery({
      faculty: 'Fakultas Hukum',
      status: Array.from({ length: 80 }, (_, i) => `S${i}`),
    });
    expect(sanitized.faculty).toEqual(['Fakultas Hukum']);
    expect(sanitized.status).toHaveLength(50);
  });

  it('field multi yang tidak dikirim tidak muncul di hasil; string tunggal jadi array', () => {
    expect(sanitizeQuery({}).sanitized).toEqual({});
    expect(sanitizeQuery({ faculty: undefined }).sanitized).toEqual({});
    // Dikirim tapi kosong = pilihan eksplisit, beda artinya dari tidak dikirim.
    expect(sanitizeQuery({ status: '' }).sanitized).toEqual({ status: [] });
    expect(sanitizeQuery({ status: [], faculty: ['A'] }).sanitized).toEqual({
      status: [],
      faculty: ['A'],
    });
    expect(sanitizeQuery({ status: 'Cuti' }).sanitized).toEqual({ status: ['Cuti'] });
  });

  it('field tunggal yang kosong tidak dikirim sama sekali', () => {
    const { sanitized } = sanitizeQuery({ nationality: '   ', tahunAjaran: '2025/2026' });
    expect(sanitized.nationality).toBeUndefined();
    expect(sanitized.tahunAjaran).toBe('2025/2026');
  });

  it('memotong karakter kontrol dari nilai multi-select sebelum sampai server', () => {
    const { sanitized } = sanitizeQuery({ faculty: [`${control}Fakultas`, 'ok'] });
    expect(sanitized.faculty).toEqual(['Fakultas', 'ok']);
  });
});

describe('matchKpiFilterScope', () => {
  // Contoh deklarasi server: kartu intake mengabaikan status, kartu aktif tidak.
  const scope = {
    active: ['search', 'statusKeaktifan', 'tahunAjaran'],
    intake: ['search', 'tahunAjaran'],
  };

  it('hanya menyalakan kartu yang param-nya benar-benar dipakai', () => {
    expect(matchKpiFilterScope(scope, ['statusKeaktifan'])).toEqual({
      active: true,
      intake: false,
    });
  });

  it('tanpa filter aktif, tidak ada kartu yang ditandai', () => {
    expect(matchKpiFilterScope(scope, [])).toEqual({ active: false, intake: false });
  });

  it('kartu yang tidak diumumkan server tidak punya badge', () => {
    expect(matchKpiFilterScope(undefined, ['search'])).toEqual({});
  });
});
