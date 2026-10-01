import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { isSamePerson } = require('../../../src/services/studentDeduplicationService');

describe('student deduplication identity matching', () => {
    it('matches students with the same non-empty NIK', () => {
        expect(isSamePerson(
            { nik: ' 1234567890 ', tanggalLahir: '' },
            { nik: '1234567890', tanggalLahir: '2000-01-01' }
        )).toBe(true);
    });

    it('matches students with the same non-empty birth date', () => {
        expect(isSamePerson(
            { nik: '', tanggalLahir: ' 2000-01-01 ' },
            { nik: '', tanggalLahir: '2000-01-01' }
        )).toBe(true);
    });

    it('does not match same-name records without a shared identity value', () => {
        expect(isSamePerson(
            { nik: '', tanggalLahir: '' },
            { nik: '', tanggalLahir: '' }
        )).toBe(false);
        expect(isSamePerson(
            { nik: '123', tanggalLahir: '2000-01-01' },
            { nik: '456', tanggalLahir: '2000-02-02' }
        )).toBe(false);
    });
});
