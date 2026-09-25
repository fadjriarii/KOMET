import { describe, it, expect } from 'vitest';
const {
    formatAngkatan,
    extractPeriode,
    hitungSemester,
    getCurrentAcademicPeriode,
    isStatusKeluar,
    isAkunLama,
    mapKewarganegaraan,
    cleanText
} = require('../../../src/controllers/sync/helpers');

describe('sync helpers — Data Cleansing & Transformation', () => {

    // ─── formatAngkatan ───
    describe('formatAngkatan', () => {
        it('digit 1 atau 2 → hanya tahun (4 digit)', () => {
            expect(formatAngkatan('20261')).toBe('2026');
            expect(formatAngkatan('20262')).toBe('2026');
        });

        it('4 digit tahun → hanya tahun', () => {
            expect(formatAngkatan('2026')).toBe('2026');
        });

        it('input kosong → string kosong', () => {
            expect(formatAngkatan('')).toBe('');
            expect(formatAngkatan(null)).toBe('');
        });
    });

    // ─── extractPeriode ───
    describe('extractPeriode', () => {
        it('"20251" → "Ganjil"', () => {
            expect(extractPeriode('20251')).toBe('Ganjil');
        });

        it('"20252" → "Genap"', () => {
            expect(extractPeriode('20252')).toBe('Genap');
        });

        it('input pendek → string kosong', () => {
            expect(extractPeriode('2025')).toBe('');
            expect(extractPeriode('')).toBe('');
        });
    });

    // ─── hitungSemester ───
    describe('hitungSemester', () => {
        it('masuk Ganjil 2022, selesai Ganjil 2024 → semester 5', () => {
            // (2024-2022)*2 + (1-1) + 1 = 5
            expect(hitungSemester('20221', '20241')).toBe(5);
        });

        it('masuk Ganjil 2022, selesai Genap 2024 → semester 6', () => {
            // (2024-2022)*2 + (2-1) + 1 = 6
            expect(hitungSemester('20221', '20242')).toBe(6);
        });

        it('masuk Ganjil 2026, selesai Ganjil 2026 (semester 1)', () => {
            // (2026-2026)*2 + (1-1) + 1 = 1
            expect(hitungSemester('20261', '20261')).toBe(1);
        });

        it('input kosong → semester 1 sebagai fallback', () => {
            expect(hitungSemester('')).toBe(1);
            expect(hitungSemester(null)).toBe(1);
        });

        it('periodeTerakhir tidak diberikan → hitung vs periode berjalan saat ini', () => {
            const now = new Date();
            const bulan = now.getMonth() + 1;
            const tahun = now.getFullYear();
            const term = bulan >= 8 ? 1 : 2;
            const currentPeriode = `${tahun}${term}`;

            const tahunMasuk = 2022;
            const termMasuk = 1;
            const tahunAkhir = parseInt(currentPeriode.substring(0, 4));
            const termAkhir = parseInt(currentPeriode.substring(4, 5));
            const expected = ((tahunAkhir - tahunMasuk) * 2) + (termAkhir - termMasuk) + 1;

            expect(hitungSemester('20221', null)).toBe(Math.max(1, expected));
        });
    });

    // ─── getCurrentAcademicPeriode ───
    describe('getCurrentAcademicPeriode', () => {
        it('mengembalikan string 5 digit', () => {
            expect(getCurrentAcademicPeriode()).toMatch(/^\d{5}$/);
        });

        it('digit ke-5 adalah 1 atau 2', () => {
            const periode = getCurrentAcademicPeriode();
            const term = periode.substring(4, 5);
            expect(['1', '2']).toContain(term);
        });
    });

    // ─── isStatusKeluar ───
    describe('isStatusKeluar', () => {
        it('status "L" (Lulus) → true', () => {
            expect(isStatusKeluar('L')).toBe(true);
        });

        it('status "D" (Drop Out) → true', () => {
            expect(isStatusKeluar('D')).toBe(true);
        });

        it('status "A" (Aktif) → false', () => {
            expect(isStatusKeluar('A')).toBe(false);
        });

        it('status kosong → false', () => {
            expect(isStatusKeluar('')).toBe(false);
            expect(isStatusKeluar(null)).toBe(false);
        });
    });

    // ─── isAkunLama ───
    describe('isAkunLama', () => {
        it('nama mengandung "Akun Lama" → true (case-insensitive)', () => {
            expect(isAkunLama('Bio Medis dan Rekayasa Hayati (Akun Lama)')).toBe(true);
            expect(isAkunLama('Teknologi Pangan (akun lama)')).toBe(true);
        });

        it('nama mengandung "keterangan akun lama" → true', () => {
            expect(isAkunLama('keterangan akun lama')).toBe(true);
        });

        it('nama normal → false', () => {
            expect(isAkunLama('Bio Teknologi')).toBe(false);
            expect(isAkunLama('Ilmu Kesehatan dan Biosains')).toBe(false);
        });

        it('input kosong/null → false', () => {
            expect(isAkunLama('')).toBe(false);
            expect(isAkunLama(null)).toBe(false);
        });
    });

    // ─── mapKewarganegaraan ───
    describe('mapKewarganegaraan', () => {
        it('id_negara "IDN" + nama_negara "Indonesia" → "Indonesia"', () => {
            expect(mapKewarganegaraan('IDN', 'Indonesia')).toBe('Indonesia');
        });

        it('id_negara "MYS" tanpa nama_negara → "Malaysia" dari fallback ISO-3', () => {
            expect(mapKewarganegaraan('MYS', '')).toBe('Malaysia');
        });

        it('nama_negara tersedia → gunakan nama langsung', () => {
            expect(mapKewarganegaraan('', 'Singapura')).toBe('Singapura');
        });

        it('tidak ada data → default "Indonesia"', () => {
            expect(mapKewarganegaraan('', '')).toBe('Indonesia');
            expect(mapKewarganegaraan(null, null)).toBe('Indonesia');
        });

        it('kode tidak dikenali + tanpa nama → default "Indonesia"', () => {
            expect(mapKewarganegaraan('ZZZ', '')).toBe('Indonesia');
        });
    });

    // ─── cleanText ───
    describe('cleanText', () => {
        it('membersihkan HTML entities dan lowercase', () => {
            expect(cleanText('Teknik &amp; Informatika ')).toBe('teknik & informatika');
        });

        it('input kosong → string kosong', () => {
            expect(cleanText('')).toBe('');
            expect(cleanText(null)).toBe('');
        });
    });
});
