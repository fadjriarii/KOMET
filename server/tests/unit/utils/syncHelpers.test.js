import { describe, it, expect } from 'vitest';
const { formatAngkatan, hitungSemester, cleanText } = require('../../../src/controllers/sync/helpers');

describe('sync helpers', () => {
    it('formatAngkatan harus memformat idPeriode dengan tepat', () => {
        expect(formatAngkatan('20241')).toBe('2024 Genap');
        expect(formatAngkatan('20242')).toBe('2024 Ganjil');
    });

    it('hitungSemester harus mengkalkulasi selisih semester dengan tepat', () => {
        expect(hitungSemester('20221', '20241')).toBe(5);
    });

    it('cleanText harus membersihkan HTML entities & lowercase', () => {
        expect(cleanText('Teknik &amp; Informatika ')).toBe('teknik & informatika');
    });
});
