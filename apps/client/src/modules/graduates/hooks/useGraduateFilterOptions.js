import { useQuery } from '@tanstack/react-query';
import { queryKey } from '../../../hooks/moduleQueries';
import { graduatesService } from '../services/graduatesService';

/**
 * Opsi filter dimuat sebelum summary supaya Tahun Lulus default tidak memicu
 * summary/list pertama tanpa filter yang langsung dibuang.
 */
export function useGraduateFilterOptions(tahunAjaran) {
  const query = useQuery({
    queryKey: queryKey('graduates', 'filter-options', tahunAjaran || ''),
    queryFn: ({ signal }) => graduatesService.getFilterOptions({ signal, tahunAjaran }),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    select: (response) => response?.data ?? null,
  });

  return {
    filterOptions: query.data || {},
    isLoading: query.isLoading,
    error: query.error?.message || null,
  };
}
