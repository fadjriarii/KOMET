import { describe, it, expect } from 'vitest';
const { calculatePredikat } = require('../../../src/utils/graduateUtils');

describe('graduateUtils', () => {
    it('calculatePredikat harus mengembalikan "Cum Laude" untuk IPK >= 3.51', () => {
        expect(calculatePredikat(3.8)).toBe('Cum Laude');
        expect(calculatePredikat(3.8, true)).toBe('Dengan Pujian (Cum Laude)');
    });

    it('calculatePredikat harus mengembalikan "Sangat Memuaskan" untuk IPK 3.01 - 3.50', () => {
        expect(calculatePredikat(3.2)).toBe('Sangat Memuaskan');
    });

    it('calculatePredikat harus mengembalikan "Memuaskan" untuk IPK < 3.01', () => {
        expect(calculatePredikat(2.9)).toBe('Memuaskan');
    });
});
