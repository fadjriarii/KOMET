import { describe, it, expect } from 'vitest';
const {
    toAcademicYear,
    getYearRange,
    getReferenceYear,
    getCurrentAcademicYearStart,
    get5YearRollingAcademicYears
} = require('../../../src/utils/academicUtils');

describe('academicUtils', () => {
    it('toAcademicYear harus memformat periode "20241" menjadi "2024/2025"', () => {
        expect(toAcademicYear('20241')).toBe('2024/2025');
    });

    it('toAcademicYear harus mengembalikan null untuk input invalid', () => {
        expect(toAcademicYear('')).toBeNull();
        expect(toAcademicYear(null)).toBeNull();
        expect(toAcademicYear('123')).toBeNull();
    });

    it('getCurrentAcademicYearStart berganti otomatis setiap 1 September', () => {
        // Sebelum 1 September (31 Agustus 2026) -> tahun akademik 2025/2026 -> start = 2025
        expect(getCurrentAcademicYearStart(new Date('2026-08-31T23:59:59'))).toBe(2025);
        // Pada / setelah 1 September (1 September 2026) -> tahun akademik 2026/2027 -> start = 2026
        expect(getCurrentAcademicYearStart(new Date('2026-09-01T00:00:00'))).toBe(2026);
    });

    it('get5YearRollingAcademicYears menghasilkan 5 tahun bergulir berbasis data terbaru di database', () => {
        // Jika data terbaru di DB adalah 2024/2025
        const years2024 = get5YearRollingAcademicYears(['2020/2021', '2021/2022', '2022/2023', '2023/2024', '2024/2025']);
        expect(years2024).toEqual(['2020/2021', '2021/2022', '2022/2023', '2023/2024', '2024/2025']);

        // Ketika sync menghasilkan data baru 2025/2026, 2020/2021 otomatis hilang
        const years2025 = get5YearRollingAcademicYears(['2020/2021', '2021/2022', '2022/2023', '2023/2024', '2024/2025', '2025/2026']);
        expect(years2025).toEqual(['2021/2022', '2022/2023', '2023/2024', '2024/2025', '2025/2026']);
        expect(years2025.includes('2020/2021')).toBe(false);

        // Ketika data 2026/2027 masuk, 2021/2022 otomatis hilang
        const years2026 = get5YearRollingAcademicYears(['2022/2023', '2023/2024', '2024/2025', '2025/2026', '2026/2027']);
        expect(years2026).toEqual(['2022/2023', '2023/2024', '2024/2025', '2025/2026', '2026/2027']);
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
