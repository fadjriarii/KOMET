import { describe, expect, it } from 'vitest';
import { formatCutiHistory, formatCutiPeriod } from '../src/utils/studentText';

describe('formatCutiHistory', () => {
  it('menampilkan periode Ganjil/Genap dan jumlah semester', () => {
    expect(formatCutiPeriod('20241')).toBe('Ganjil 2024/2025');
    expect(formatCutiHistory(['20241'], 1)).toBe('Ganjil 2024/2025 · 1 semester');
    expect(formatCutiHistory(['20241', '20242'], 2)).toBe(
      'Ganjil 2024/2025, Genap 2024/2025 · 2 semester',
    );
  });

  it('kosong bila tidak ada riwayat atau kode periode tidak valid', () => {
    expect(formatCutiHistory([])).toBe('');
    expect(formatCutiPeriod('2024')).toBe('');
  });
});
