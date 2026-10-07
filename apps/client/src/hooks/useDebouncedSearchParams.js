import { useMemo } from 'react';
import { useDebouncedValue } from './useDebouncedValue';
import { SEARCH_DEBOUNCE_MS } from '../constants/debounce';

/**
 * Satu sumber parameter request untuk summary dan list sebuah halaman dashboard:
 * keduanya harus bertanya dengan filter yang sama, termasuk pencarian ter-debounce.
 * `isDebouncing` menandai jendela antara ketikan dan request berikutnya agar kartu KPI
 * yang sudah tampil tidak diubah menjadi skeleton saat refetch senyap.
 */
export function useDebouncedSearchParams(filterParams, searchQuery) {
  const debouncedSearch = useDebouncedValue(searchQuery, SEARCH_DEBOUNCE_MS);
  const params = useMemo(
    () => ({ ...filterParams, search: debouncedSearch }),
    [filterParams, debouncedSearch],
  );

  return { params, isDebouncing: searchQuery !== debouncedSearch };
}
