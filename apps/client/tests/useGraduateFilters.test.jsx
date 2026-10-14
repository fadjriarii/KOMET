import { renderHook, act } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { useGraduateFilters } from '../src/modules/graduates/hooks/useGraduateFilters';

/**
 * Hook + lokasi live. Argumen default bisa diganti lewat `rerender`
 * (DashboardPage memanggil ulang hook begitu summary termuat / jangkar
 * tahun ajaran bergeser).
 */
function renderFilters(url = '/') {
  const wrapper = ({ children }) => <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>;
  return renderHook(
    ({ defaultAcademicYear = '', defaultTahunLulus = '' }) => ({
      filters: useGraduateFilters(defaultAcademicYear, defaultTahunLulus),
      location: useLocation(),
    }),
    { wrapper, initialProps: { defaultAcademicYear: '', defaultTahunLulus: '' } },
  );
}

const searchOf = (result) => new URLSearchParams(result.current.location.search);

describe('useGraduateFilters (default Tahun Lulus = tahun terbaru)', () => {
  it('tanpa default: semua tahun, tanpa filter aktif', () => {
    const { result } = renderFilters();
    expect(result.current.filters.values.selectedTahunLulus).toEqual([]);
    expect(result.current.filters.activeFilterParams).toEqual([]);
    expect(result.current.filters.activeFilterCount).toBe(0);
  });

  it('default tahun lulus menjadi nilai awal, tapi BUKAN filter aktif', () => {
    const { result, rerender } = renderFilters();
    rerender({ defaultAcademicYear: '', defaultTahunLulus: '2025/2026' });
    // Nilai awal = tahun terbaru dari filterOptions.rollingYears[0].
    expect(result.current.filters.values.selectedTahunLulus).toEqual(['2025/2026']);
    // Dikirim ke server sebagai param query (key = nama field, bukan nama param).
    expect(result.current.filters.filterParams.selectedTahunLulus).toEqual(['2025/2026']);
    // ...tapi tidak menyala sebagai filter aktif (tidak ada badge "Terfilter").
    expect(result.current.filters.activeFilterParams).toEqual([]);
    expect(result.current.filters.activeFilterCount).toBe(0);
    // Default tidak pernah ditulis ke URL.
    expect(searchOf(result).has('tahunLulus')).toBe(false);
  });

  it('pilihan manual menyimpang dari default dan jadi filter aktif', async () => {
    const { result, rerender } = renderFilters();
    rerender({ defaultAcademicYear: '', defaultTahunLulus: '2025/2026' });
    await act(async () => {
      result.current.filters.setters.setSelectedTahunLulus(['2021/2022']);
    });
    expect(result.current.filters.values.selectedTahunLulus).toEqual(['2021/2022']);
    expect(result.current.filters.activeFilterParams).toEqual(['tahunLulus']);
    expect(result.current.filters.activeFilterCount).toBe(1);
  });

  it('default yang bergeser mengikuti, tetap bukan filter aktif', () => {
    const { result, rerender } = renderFilters();
    // Data termuat: tahun terbaru diketahui.
    rerender({ defaultAcademicYear: '', defaultTahunLulus: '2025/2026' });
    expect(result.current.filters.values.selectedTahunLulus).toEqual(['2025/2026']);
    // Jangkar tahun ajaran diganti user; tahun terbaru bergeser.
    rerender({ defaultAcademicYear: '', defaultTahunLulus: '2023/2024' });
    expect(result.current.filters.values.selectedTahunLulus).toEqual(['2023/2024']);
    expect(result.current.filters.filterParams.selectedTahunLulus).toEqual(['2023/2024']);
    // Nilainya sama dengan default baru: tidak aktif, tidak ada badge.
    expect(result.current.filters.activeFilterParams).toEqual([]);
    expect(result.current.filters.activeFilterCount).toBe(0);
  });

  it('reset mengembalikan ke default tahun lulus, bukan ke semua tahun', async () => {
    // Setelah efek pengikut membersihkan param default, user memilih manual 2020/2021.
    const { result, rerender } = renderFilters();
    rerender({ defaultAcademicYear: '', defaultTahunLulus: '2025/2026' });
    // Tahun Lulus default sudah diketahui = 2025/2026 (tidak ada param di URL).
    await act(async () => {
      result.current.filters.setters.setSelectedTahunLulus(['2020/2021']);
    });
    expect(result.current.filters.values.selectedTahunLulus).toEqual(['2020/2021']);
    expect(result.current.filters.activeFilterCount).toBe(1);

    await act(async () => {
      result.current.filters.resetFilters();
    });
    // Reset = kembali ke nilai awal (default = tahun terbaru), URL bersih.
    expect(result.current.filters.values.selectedTahunLulus).toEqual(['2025/2026']);
    expect(result.current.filters.activeFilterCount).toBe(0);
    expect(searchOf(result).has('tahunLulus')).toBe(false);
  });
});
