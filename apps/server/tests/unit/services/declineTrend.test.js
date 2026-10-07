import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { getNewStudentDecline } = require('../../../src/services/students/declineTrend');
const { getAcademicYearWindow } = require('@komet/shared/academicYear');

/** Intake per tahun akademik, urut menaik seperti `getAcademicYearWindow`. */
function yearCountsFor(latestStartYear, countsAscending) {
  return new Map(
    getAcademicYearWindow(latestStartYear, countsAscending.length).map((academicYear, index) => [
      academicYear,
      { total: countsAscending[index] },
    ]),
  );
}

describe('decline trend calculation', () => {
  const declining = [20, 24, 22, 19, 11];

  it('returns a negative average when the latest intake declines', () => {
    const decline = getNewStudentDecline('2025/2026', yearCountsFor(2025, declining));
    expect(decline.declinePercentage).toBeCloseTo(-11.019, 3);
    expect(decline.comparisonsUsed).toBe(4);
    // Deret dikirim terbaru dulu: A = tahun terpilih, tanpa pembanding ke depan.
    expect(decline.history[0]).toMatchObject({
      label: 'A',
      academicYear: '2025/2026',
      intakeCount: 11,
    });
    expect(decline.history[0].changeFromPrev).toBeCloseTo(-42.105, 3);
    expect(decline.history[3].changeFromPrev).toBeCloseTo(20, 6);
    // Titik terlama tidak punya pembanding di dalam jendela.
    expect(decline.history.at(-1).changeFromPrev).toBeNull();
  });

  it('returns null when no valid year-over-year comparison is available', () => {
    const decline = getNewStudentDecline('2025/2026', yearCountsFor(2025, [0, 0, 0, 0, 0]));
    expect(decline.declinePercentage).toBeNull();
    expect(decline.comparisonsUsed).toBe(0);
  });
});
