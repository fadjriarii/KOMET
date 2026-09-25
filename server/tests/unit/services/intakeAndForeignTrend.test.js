import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

describe('intakeTrend calculations and term assignments', () => {
  it('correctly maps digit 1 to Ganjil and digit 2 to Genap', () => {
    const rawStudents = [
      { periodeMasuk: '20251' }, // Ganjil
      { periodeMasuk: '20251' }, // Ganjil
      { periodeMasuk: '20252' }, // Genap
      { periodeMasuk: '20241' }  // Ganjil
    ];

    const yearlyMap = new Map();

    for (const s of rawStudents) {
      const acadYear = s.periodeMasuk ? `${s.periodeMasuk.substring(0, 4)}/${parseInt(s.periodeMasuk.substring(0, 4)) + 1}` : null;
      if (!acadYear) continue;

      if (!yearlyMap.has(acadYear)) {
        yearlyMap.set(acadYear, { total: 0, ganjil: 0, genap: 0 });
      }
      const counts = yearlyMap.get(acadYear);
      counts.total += 1;

      const termDigit = s.periodeMasuk.substring(4, 5);
      if (termDigit === '1') {
        counts.ganjil += 1;
      } else if (termDigit === '2') {
        counts.genap += 1;
      } else {
        counts.ganjil += 1;
      }
    }

    const data2025 = yearlyMap.get('2025/2026');
    expect(data2025).toBeDefined();
    expect(data2025.total).toBe(3);
    expect(data2025.ganjil).toBe(2);
    expect(data2025.genap).toBe(1);

    const data2024 = yearlyMap.get('2024/2025');
    expect(data2024).toBeDefined();
    expect(data2024.total).toBe(1);
    expect(data2024.ganjil).toBe(1);
    expect(data2024.genap).toBe(0);
  });

  it('calculates foreign rate based purely on totalActiveStudents', () => {
    const totalActiveStudents = 1000;
    const totalInternationalStudents = 25;

    const foreignRate = totalActiveStudents > 0
      ? `${((totalInternationalStudents / totalActiveStudents) * 100).toFixed(1)}%`
      : '0.0%';

    expect(foreignRate).toBe('2.5%');
  });
});
