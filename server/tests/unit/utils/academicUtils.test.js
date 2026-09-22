import { describe, it, expect } from 'vitest';
const { toAcademicYear, getYearRange, getReferenceYear } = require('../../../src/utils/academicUtils');

describe('academicUtils', () => {
    it('toAcademicYear harus memformat periode "20241" menjadi "2024/2025"', () => {
        expect(toAcademicYear('20241')).toBe('2024/2025');
    });

    it('toAcademicYear harus mengembalikan null untuk input invalid', () => {
        expect(toAcademicYear('')).toBeNull();
        expect(toAcademicYear(null)).toBeNull();
        expect(toAcademicYear('123')).toBeNull();
    });

    it('getYearRange harus mengembalikan 5 tahun berturut-turut', () => {
        const range = getYearRange();
        expect(range).toHaveLength(5);
        expect(Number(range[4])).toBe(new Date().getFullYear() - 1);
    });

    it('getReferenceYear harus mengembalikan tahun lalu', () => {
        expect(getReferenceYear()).toBe(new Date().getFullYear() - 1);
    });
});
