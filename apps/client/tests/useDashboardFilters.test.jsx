import { renderHook, act } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { PAGE_PARAM, useDashboardFilters } from '../src/hooks/useDashboardFilters';

const fields = {
  searchQuery: {
    initial: '',
    param: 'search',
    setter: 'setSearchQuery',
    sanitize: (value) =>
      String(value ?? '')
        .trim()
        .slice(0, 3),
  },
  selectedStatus: {
    initial: ['Aktif'],
    param: 'status',
    api: 'statusKeaktifan',
    setter: 'setSelectedStatus',
  },
};

const getActiveFilterCount = (params) => (params.search ? 1 : 0);

/** Hook yang sama + lokasi live, supaya URL bisa diperiksa setelah tiap aksi. */
function renderFilters(initialUrl = '/') {
  const wrapper = ({ children }) => (
    <MemoryRouter initialEntries={[initialUrl]}>{children}</MemoryRouter>
  );
  return renderHook(
    () => ({
      filters: useDashboardFilters({ fields, getActiveFilterCount }),
      location: useLocation(),
    }),
    { wrapper },
  );
}

const searchOf = (result) => new URLSearchParams(result.current.location.search);

describe('useDashboardFilters (keadaan di URL)', () => {
  it('memakai nilai awal saat URL bersih dan multi-select dari URL saat ada', () => {
    const clean = renderFilters();
    expect(clean.result.current.filters.values).toEqual({
      searchQuery: '',
      selectedStatus: ['Aktif'],
    });

    const linked = renderFilters('/?search=s1&status=Cuti&status=Lulus');
    expect(linked.result.current.filters.values).toEqual({
      searchQuery: 's1',
      selectedStatus: ['Cuti', 'Lulus'],
    });
    expect(linked.result.current.filters.filterParams).toEqual({
      search: 's1',
      status: ['Cuti', 'Lulus'],
    });
  });

  it('membedakan ?status= (dipilih kosong) dari status yang tidak ada (default)', () => {
    expect(renderFilters('/?status=').result.current.filters.values.selectedStatus).toEqual([]);
    expect(renderFilters().result.current.filters.values.selectedStatus).toEqual(['Aktif']);
  });

  it('menulis ke URL lalu menghapus param saat nilai kembali ke default', () => {
    const { result } = renderFilters();
    act(() => result.current.filters.setters.setSelectedStatus(['Cuti']));
    expect(result.current.filters.values.selectedStatus).toEqual(['Cuti']);
    expect(searchOf(result).getAll('status')).toEqual(['Cuti']);

    act(() => result.current.filters.setters.setSelectedStatus(['Aktif']));
    expect(searchOf(result).has('status')).toBe(false);
  });

  it('mendaftar param API yang menyimpang dari default, dengan nama server', () => {
    expect(renderFilters().result.current.filters.activeFilterParams).toEqual([]);

    const linked = renderFilters('/?search=abc&status=Cuti');
    // `status` adalah nama di URL; yang dikirim ke server (dan yang didaftarkan
    // `kpiFilterScope`) adalah `statusKeaktifan`.
    expect(linked.result.current.filters.activeFilterParams).toEqual(['search', 'statusKeaktifan']);
  });

  it('memberlakukan sanitizer pada nilai yang datang dari URL', () => {
    const { result } = renderFilters('/?search=%20%20toolong-query%20');
    expect(result.current.filters.values.searchQuery).toBe('too');
  });

  it('menghapus ?page= setiap filter berubah, dan tidak menyentuh param lain', () => {
    const { result } = renderFilters(`/?page=3&sort=nama`);
    act(() => result.current.filters.setters.setSearchQuery('abc'));
    expect(searchOf(result).has(PAGE_PARAM)).toBe(false);
    expect(searchOf(result).get('sort')).toBe('nama');
    expect(searchOf(result).get('search')).toBe('abc');
  });

  it('resetFilters membersihkan filter dan halaman, mengembalikan nilai awal', () => {
    const { result } = renderFilters('/?search=abc&status=Cuti&page=4');
    expect(result.current.filters.activeFilterCount).toBe(1);

    act(() => result.current.filters.resetFilters());
    expect(result.current.filters.values).toEqual({ searchQuery: '', selectedStatus: ['Aktif'] });
    expect(result.current.filters.activeFilterCount).toBe(0);
    expect(searchOf(result).toString()).toBe('');
  });
});
